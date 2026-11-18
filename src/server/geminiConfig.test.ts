import test from 'node:test';
import assert from 'node:assert/strict';
import { ThinkingLevel } from '@google/genai';
import { buildGeminiGenerationConfig, getThinkingLevelForModel } from './geminiConfig';

test('gemini-3.5-flash-lite uses ThinkingLevel.MINIMAL and omits deprecated sampling params', () => {
  const config = buildGeminiGenerationConfig({
    model: 'gemini-3.5-flash-lite',
    systemInstruction: 'Test instruction',
  });

  assert.equal(getThinkingLevelForModel('gemini-3.5-flash-lite'), ThinkingLevel.MINIMAL);
  assert.equal(config.thinkingConfig?.thinkingLevel, ThinkingLevel.MINIMAL);
  assert.equal(config.responseMimeType, 'application/json');
  assert.equal('temperature' in config, false);
  assert.equal('topP' in config, false);
  assert.equal('topK' in config, false);
});

test('gemini-3.8-flash uses ThinkingLevel.LOW and omits deprecated sampling params', () => {
  const config = buildGeminiGenerationConfig({
    model: 'gemini-3.8-flash',
    systemInstruction: 'Test instruction',
  });

  assert.equal(getThinkingLevelForModel('gemini-3.8-flash'), ThinkingLevel.LOW);
  assert.equal(config.thinkingConfig?.thinkingLevel, ThinkingLevel.LOW);
  assert.equal(config.responseMimeType, 'application/json');
  assert.equal('temperature' in config, false);
  assert.equal('topP' in config, false);
});
