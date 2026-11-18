import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import {
  buildSystemInstruction,
  extractJsonFromGeminiResponse,
  normalizeGeneratedDeck,
  validateGenerateInput,
} from './src/lib/recallLogic.ts';
import type { GenerateRequestPayload, OutputMode, RigorLevel, SyllabusTrack } from './src/lib/types.ts';
import { buildGeminiGenerationConfig } from './src/server/geminiConfig.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new ServerConfigError(
      'Server Gemini API key is not configured. Configure GEMINI_API_KEY in server environment secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

class ServerConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServerConfigError';
  }
}

async function generateWithRetry<T>(fn: () => Promise<T>, maxRetries = 1): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isQuickTransient = /ECONNRESET|503|UNAVAILABLE/i.test(msg);
      if (!isQuickTransient || attempt === maxRetries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
    }
  }
  throw lastError;
}

function formatUpstreamError(err: unknown): { status: number; message: string } {
  if (err instanceof ServerConfigError) {
    return { status: 503, message: err.message };
  }
  const raw = err instanceof Error ? err.message : String(err);
  if (/API_KEY_INVALID|PERMISSION_DENIED|403|401/i.test(raw)) {
    return {
      status: 502,
      message: 'The server Gemini API credentials were rejected. Check your server GEMINI_API_KEY configuration.',
    };
  }
  if (/RESOURCE_EXHAUSTED|429|quota/i.test(raw)) {
    return {
      status: 429,
      message: 'Model rate limit or daily free-tier quota reached. Wait briefly or switch to Fast Mode (gemini-3.5-flash-lite).',
    };
  }
  if (/NOT_FOUND|404/i.test(raw)) {
    return {
      status: 502,
      message: 'The selected Gemini model is not available on this API tier. Switch to Fast Mode (gemini-3.5-flash-lite).',
    };
  }
  if (/503|UNAVAILABLE|DEADLINE_EXCEEDED|ETIMEDOUT|504/i.test(raw)) {
    return {
      status: 503,
      message: 'The model timed out or is temporarily busy. Try Fast Mode (gemini-3.5-flash-lite) or reduce the item count.',
    };
  }
  if (/INVALID_ARGUMENT|400/i.test(raw)) {
    return {
      status: 400,
      message: 'The model rejected the request format or attachment size. Try shorter notes or a smaller file.',
    };
  }
  if (/JSON|empty response/i.test(raw)) {
    return {
      status: 502,
      message: 'The model returned an incomplete structure. Try reducing item count or switching modes.',
    };
  }
  return {
    status: 502,
    message: 'Failed to generate recall set from source material. Please try again or switch to Fast Mode.',
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '14mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/generate', async (req: Request, res: Response) => {
    try {
      const body = (req.body ?? {}) as Partial<GenerateRequestPayload>;
      const notesText = typeof body.notesText === 'string' ? body.notesText : '';
      const attachment = body.attachment ?? null;
      const syllabus = (body.syllabus ?? 'CBSE Class 12 Physics') as SyllabusTrack;
      const rigor = (body.rigor ?? 'Application & HOTS') as RigorLevel;
      const outputMode = (body.outputMode ?? 'mixed') as OutputMode;
      const itemCount = typeof body.itemCount === 'number' ? body.itemCount : 6;
      const model = body.model ?? 'gemini-3.5-flash-lite';

      const validation = validateGenerateInput({
        notesText,
        attachment,
        itemCount,
        model,
      });

      if (!validation.valid) {
        res.status(400).json({ error: validation.error });
        return;
      }

      if (model !== 'gemini-3.5-flash-lite' && model !== 'gemini-3.8-flash') {
        res.status(400).json({ error: 'Unsupported model selection.' });
        return;
      }

      const ai = getGeminiClient();
      const systemInstruction = buildSystemInstruction({
        syllabus,
        rigor,
        outputMode,
        itemCount,
      });
      const config = buildGeminiGenerationConfig({
        model,
        systemInstruction,
      });

      const parts: Array<
        | { text: string }
        | { inlineData: { mimeType: string; data: string } }
      > = [];

      if (attachment && attachment.data) {
        if (attachment.encoding === 'utf8') {
          parts.push({
            text: `Uploaded Document (${attachment.name}):\n${attachment.data.slice(0, 50000)}`,
          });
        } else {
          parts.push({
            inlineData: {
              mimeType: attachment.mimeType,
              data: attachment.data,
            },
          });
        }
      }

      const promptBody = notesText.trim()
        ? `Source Academic Notes:\n${notesText.trim()}\n\nTransform the material above into atomic active-recall items adhering strictly to the syllabus and rigor rules.`
        : 'Analyze the attached document and transform its core concepts into atomic active-recall items adhering strictly to the syllabus and rigor rules.';

      parts.push({ text: promptBody });

      const response = await generateWithRetry(() =>
        ai.models.generateContent({
          model,
          contents: { parts },
          config,
        })
      );

      const parsedJson = extractJsonFromGeminiResponse<Record<string, unknown>>(response);
      const deck = normalizeGeneratedDeck(parsedJson, {
        syllabus,
        rigor,
        outputMode,
        modelUsed: model,
        sourceExcerpt:
          notesText.trim() || (attachment ? `Document: ${attachment.name}` : 'Study Notes'),
      });

      res.json({ deck });
    } catch (err) {
      const formatted = formatUpstreamError(err);
      console.error('[RecallForge /api/generate error]', err instanceof Error ? err.message : err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RecallForge server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start RecallForge server:', err);
  process.exit(1);
});
