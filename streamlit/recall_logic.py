from __future__ import annotations

import csv
import io
import json
import re
from typing import Any, Literal
from pydantic import BaseModel, Field

ModelId = Literal["gemini-3.5-flash-lite", "gemini-3.8-flash"]
OutputMode = Literal["mixed", "flashcards", "quiz"]
FlashcardRating = Literal["again", "hard", "mastered"]

SYLLABUS_OPTIONS: tuple[str, ...] = (
    "CBSE Class 10 (All Subjects)",
    "CBSE Class 11–12 (All Subjects)",
    "Competitive Exams (JEE / NEET / CUET)",
    "College & University",
    "General Study & Certifications",
)

RIGOR_OPTIONS: dict[str, str] = {
    "Standard": "Core concepts, clear reasoning, and essential exam fundamentals.",
    "Challenge": "Apply ideas to new situations, multi-step problems, and common traps.",
    "Advanced": "Tricky edge cases, deeper problem-solving, and tough exam twists.",
}

MODEL_OPTIONS: dict[ModelId, dict[str, str]] = {
    "gemini-3.5-flash-lite": {
        "label": "Fast Mode (gemini-3.5-flash-lite)",
        "thinking_level": "MINIMAL",
        "description": "Best for everyday study · Faster replies and higher daily quota.",
    },
    "gemini-3.8-flash": {
        "label": "High Precision (gemini-3.8-flash)",
        "thinking_level": "LOW",
        "description": "Best for tough chapters · Deeper checking for complex topics.",
    },
}

ALLOWED_MIME_TYPES: set[str] = {
    "application/pdf",
    "text/plain",
    "text/markdown",
    "text/csv",
    "image/png",
    "image/jpeg",
    "image/webp",
}

MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024
MIN_NOTES_LENGTH = 20
MAX_NOTES_LENGTH = 60000


class FlashcardSchema(BaseModel):
    concept: str = Field(description="Single atomic concept name (3-7 words).")
    mechanism: str = Field(
        description=(
            "Cognitive target: Causal Chain, Sign Convention, Edge Case, "
            "Mathematical Trade-Off, Experimental Perturbation, Derivation Step, or Mechanism Boundary."
        )
    )
    prompt: str = Field(
        description="Focused active-recall prompt demanding prediction, derivation, or sign analysis."
    )
    hint: str = Field(description="Nudge toward governing conservation law or boundary condition.")
    answer: str = Field(description="Step-by-step worked answer with exact SI units and sign conventions.")
    commonPitfall: str = Field(description="Specific student misconception or sign/assumption trap.")
    syllabusTag: str = Field(description="Chapter or NCERT topic tag.")


class DistractorNoteSchema(BaseModel):
    optionIndex: int
    whyIncorrect: str


class QuizQuestionSchema(BaseModel):
    concept: str
    mechanism: str
    scenarioPrompt: str
    options: list[str]
    correctIndex: int
    correctExplanation: str
    distractorNotes: list[DistractorNoteSchema]
    syllabusTag: str


class RecallDeckSchema(BaseModel):
    deckTitle: str
    syllabusSummary: str
    flashcards: list[FlashcardSchema]
    quizQuestions: list[QuizQuestionSchema]


def get_thinking_level(model_id: ModelId) -> str:
    return MODEL_OPTIONS[model_id]["thinking_level"]


def build_system_instruction(
    syllabus: str,
    rigor: str,
    output_mode: OutputMode,
    item_count: int,
) -> str:
    if output_mode == "flashcards":
        allocation = f"Generate exactly {item_count} atomic active-recall flashcards and 0 quizQuestions (empty list)."
    elif output_mode == "quiz":
        allocation = f"Generate 0 flashcards (empty list) and exactly {item_count} diagnostic quizQuestions."
    else:
        fc_count = (item_count + 1) // 2
        qz_count = max(1, item_count // 2)
        allocation = f"Generate {fc_count} atomic active-recall flashcards and {qz_count} diagnostic quizQuestions."

    return "\n".join(
        [
            "Role: Principal Instructional Designer and Cognitive Science Engineering Agent.",
            "Objective: Transform unstructured academic text, lecture notes, or uploaded documents into rigorous, high-yield active-recall flashcards and/or diagnostic quizzes.",
            f"Active Syllabus Track: {syllabus}.",
            f"Target Rigor Level: {rigor}.",
            "",
            "MANDATORY INSTRUCTIONAL RULES:",
            '- Rule 1 (Ban Trivia & Rote Lookups): Reject bare-minimum definitions, dates, biographical facts, or "What is X?" questions. Every item MUST test underlying mechanics, causal chains, NCERT/SI sign conventions, architectural or mathematical trade-offs, experimental perturbations, or edge-case applications.',
            "- Rule 2 (Atomic Boundaries): Strictly limit each flashcard or quiz item to ONE underlying concept or principle. Split multi-mechanism concepts into separate atomic items so each tests a single testable prediction, derivation step, or failure mode.",
            "- Rule 3 (CBSE & Exam Precision): Explicitly enforce exact sign conventions (e.g., Cartesian optics sign convention, thermodynamic work convention, Lenz law opposition, Nernst potential conventions), limiting assumptions, and common board-exam misconceptions.",
            "- Rule 4 (Diagnostic Distractors): For every quiz question, provide 4 distinct options where each wrong option represents a specific, plausible student misconception, and explain in distractorNotes why each wrong option fails.",
            f"- Output Allocation: {allocation}",
            "- Return strictly valid JSON matching the required response schema.",
        ]
    )


def validate_inputs(
    notes_text: str,
    has_attachment: bool,
    attachment_mime: str | None = None,
    attachment_bytes: int = 0,
    item_count: int = 6,
    model_id: str = "gemini-3.5-flash-lite",
) -> tuple[bool, str | None]:
    trimmed = (notes_text or "").strip()
    if not trimmed and not has_attachment:
        return False, "Paste lecture notes or upload a study document (.pdf, .txt, .md, or image) before generating."
    if trimmed and len(trimmed) < MIN_NOTES_LENGTH and not has_attachment:
        return False, f"Please enter at least {MIN_NOTES_LENGTH} characters of study material."
    if len(trimmed) > MAX_NOTES_LENGTH:
        return False, f"Source notes exceed the {MAX_NOTES_LENGTH:,} character limit."
    if has_attachment:
        if attachment_mime not in ALLOWED_MIME_TYPES:
            return False, f"Unsupported file type ({attachment_mime}). Use PDF, TXT, MD, CSV, PNG, JPG, or WEBP."
        if attachment_bytes > MAX_ATTACHMENT_BYTES:
            return False, "Uploaded file exceeds the 8 MB limit."
    if not isinstance(item_count, int) or item_count < 2 or item_count > 16:
        return False, "Item count must be between 2 and 16."
    if model_id not in MODEL_OPTIONS:
        return False, "Unsupported model selection."
    return True, None


def strip_markdown_fences(text: str) -> str:
    trimmed = text.strip()
    match = re.match(r"^```(?:json)?\s*\n?([\s\S]*?)\n?```$", trimmed, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return trimmed


def extract_json_from_gemini_response(response: Any) -> dict[str, Any]:
    """Safely extracts JSON text while skipping model thinking parts (part.thought == True)."""
    non_thought_texts: list[str] = []
    candidates = getattr(response, "candidates", None) or []
    if candidates:
        content = getattr(candidates[0], "content", None)
        parts = getattr(content, "parts", None) or []
        for part in parts:
            if getattr(part, "thought", False):
                continue
            text = getattr(part, "text", None)
            if isinstance(text, str) and text.strip():
                non_thought_texts.append(text)

    raw_text = "\n".join(non_thought_texts).strip()
    if not raw_text:
        fallback_text = getattr(response, "text", None)
        if isinstance(fallback_text, str):
            raw_text = fallback_text.strip()

    if not raw_text:
        raise ValueError("Model returned an empty response.")

    cleaned = strip_markdown_fences(raw_text)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end > start:
            return json.loads(cleaned[start : end + 1])
        raise ValueError("Model output was not valid JSON.")


def normalize_deck_dict(
    raw: dict[str, Any],
    *,
    syllabus: str,
    rigor: str,
    output_mode: OutputMode,
    model_used: str,
    source_excerpt: str,
) -> dict[str, Any]:
    deck_id = f"deck-{abs(hash((raw.get('deckTitle', ''), source_excerpt[:60]))) % 10**8}"
    raw_cards = raw.get("flashcards") if isinstance(raw.get("flashcards"), list) else []
    raw_quiz = raw.get("quizQuestions") if isinstance(raw.get("quizQuestions"), list) else []

    flashcards = []
    for idx, card in enumerate(raw_cards):
        if not isinstance(card, dict):
            continue
        flashcards.append(
            {
                "id": f"{deck_id}-fc-{idx + 1}",
                "concept": str(card.get("concept") or f"Concept {idx + 1}").strip(),
                "mechanism": str(card.get("mechanism") or "Causal Chain").strip(),
                "prompt": str(card.get("prompt") or "Explain the underlying mechanism.").strip(),
                "hint": str(card.get("hint") or "Trace the governing conservation law.").strip(),
                "answer": str(card.get("answer") or "No answer provided.").strip(),
                "commonPitfall": str(
                    card.get("commonPitfall") or "Check sign conventions and limiting assumptions."
                ).strip(),
                "syllabusTag": str(card.get("syllabusTag") or syllabus).strip(),
                "rating": None,
            }
        )

    quiz_questions = []
    for idx, q in enumerate(raw_quiz):
        if not isinstance(q, dict):
            continue
        options = [str(o).strip() for o in (q.get("options") or []) if str(o).strip()][:4]
        if len(options) < 2:
            options = ["Option A", "Option B", "Option C", "Option D"]
        raw_correct = q.get("correctIndex", 0)
        correct_idx = raw_correct if isinstance(raw_correct, int) and 0 <= raw_correct < len(options) else 0
        notes = []
        for note in q.get("distractorNotes") or []:
            if isinstance(note, dict):
                notes.append(
                    {
                        "optionIndex": int(note.get("optionIndex", 0)),
                        "whyIncorrect": str(note.get("whyIncorrect") or "Violates governing principle.").strip(),
                    }
                )
        quiz_questions.append(
            {
                "id": f"{deck_id}-qz-{idx + 1}",
                "concept": str(q.get("concept") or f"Diagnostic Item {idx + 1}").strip(),
                "mechanism": str(q.get("mechanism") or "Edge Case").strip(),
                "scenarioPrompt": str(q.get("scenarioPrompt") or "Predict the outcome.").strip(),
                "options": options,
                "correctIndex": correct_idx,
                "correctExplanation": str(
                    q.get("correctExplanation") or "Follows from the governing principle."
                ).strip(),
                "distractorNotes": notes,
                "syllabusTag": str(q.get("syllabusTag") or syllabus).strip(),
            }
        )

    return {
        "id": deck_id,
        "title": str(raw.get("deckTitle") or f"{syllabus} Recall Set").strip(),
        "syllabus": syllabus,
        "rigor": rigor,
        "outputMode": output_mode,
        "modelUsed": model_used,
        "sourceExcerpt": source_excerpt[:220],
        "syllabusSummary": str(raw.get("syllabusSummary") or f"{syllabus} · {rigor}").strip(),
        "flashcards": flashcards,
        "quizQuestions": quiz_questions,
    }


def compute_session_stats(flashcards: list[dict[str, Any]]) -> dict[str, int]:
    total = len(flashcards)
    mastered = sum(1 for c in flashcards if c.get("rating") == "mastered")
    hard = sum(1 for c in flashcards if c.get("rating") == "hard")
    again = sum(1 for c in flashcards if c.get("rating") == "again")
    pct = round((mastered / total) * 100) if total else 0
    return {
        "total": total,
        "mastered": mastered,
        "hard": hard,
        "again": again,
        "mastery_percent": pct,
    }


def export_deck_to_anki_csv(deck: dict[str, Any]) -> str:
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["Front", "Back", "Tags"])
    syllabus_tag = deck.get("syllabus", "CBSE").replace(" ", "_")

    for card in deck.get("flashcards", []):
        front = f"[{card['concept']} · {card['mechanism']}]\n{card['prompt']}".replace("\n", "<br>")
        back = f"{card['answer']}\n\nCommon Pitfall: {card['commonPitfall']}".replace("\n", "<br>")
        mech_tag = card["mechanism"].replace(" ", "_")
        writer.writerow([front, back, f"{syllabus_tag} {mech_tag}"])

    for q in deck.get("quizQuestions", []):
        opts = "\n".join(f"{chr(65 + i)}) {opt}" for i, opt in enumerate(q["options"]))
        front = f"[Quiz · {q['concept']}]\n{q['scenarioPrompt']}\n{opts}".replace("\n", "<br>")
        correct_opt = q["options"][q["correctIndex"]] if q["options"] else ""
        back = f"Correct: {correct_opt}\n\n{q['correctExplanation']}".replace("\n", "<br>")
        writer.writerow([front, back, f"{syllabus_tag} Diagnostic_Quiz"])

    return buf.getvalue()


def export_deck_to_markdown(deck: dict[str, Any]) -> str:
    lines = [
        f"# {deck['title']}",
        f"**Syllabus:** {deck['syllabus']} · **Rigor:** {deck['rigor']}",
        "",
    ]
    if deck.get("flashcards"):
        lines.extend(["## Active-Recall Flashcards", ""])
        for i, card in enumerate(deck["flashcards"], start=1):
            lines.extend(
                [
                    f"### {i}. {card['concept']} ({card['mechanism']})",
                    f"**Prompt:** {card['prompt']}",
                    f"**Hint:** {card['hint']}",
                    f"**Answer:** {card['answer']}",
                    f"**Common Pitfall:** {card['commonPitfall']}",
                    "",
                ]
            )
    if deck.get("quizQuestions"):
        lines.extend(["## Diagnostic Quiz Items", ""])
        for i, q in enumerate(deck["quizQuestions"], start=1):
            lines.extend([f"### Q{i}. {q['concept']} ({q['mechanism']})", q["scenarioPrompt"], ""])
            for opt_i, opt in enumerate(q["options"]):
                marker = "[x]" if opt_i == q["correctIndex"] else "[ ]"
                lines.append(f"- {marker} {chr(65 + opt_i)}. {opt}")
            lines.extend(["", f"**Explanation:** {q['correctExplanation']}", ""])
    return "\n".join(lines)
