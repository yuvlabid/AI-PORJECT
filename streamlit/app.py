from __future__ import annotations

import copy
import os
import streamlit as st
from google import genai
from google.genai import types

from recall_logic import (
    MODEL_OPTIONS,
    RIGOR_OPTIONS,
    SYLLABUS_OPTIONS,
    ModelId,
    OutputMode,
    RecallDeckSchema,
    build_system_instruction,
    compute_session_stats,
    export_deck_to_anki_csv,
    export_deck_to_markdown,
    extract_json_from_gemini_response,
    get_thinking_level,
    normalize_deck_dict,
    validate_inputs,
)
from sample_decks import SAMPLE_PRESETS

st.set_page_config(
    page_title="RecallForge — CBSE & Active-Recall Studio",
    layout="wide",
    initial_sidebar_state="collapsed",
)


def get_server_api_key() -> str:
    """Reads GEMINI_API_KEY strictly from server env or Streamlit secrets (never UI)."""
    env_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if env_key and env_key != "MY_GEMINI_API_KEY":
        return env_key
    try:
        secret_key = str(st.secrets.get("GEMINI_API_KEY", "")).strip()
        if secret_key and secret_key != "MY_GEMINI_API_KEY":
            return secret_key
    except Exception:
        pass
    return ""


def call_gemini_generate(
    *,
    notes_text: str,
    uploaded_file,
    syllabus: str,
    rigor: str,
    output_mode: OutputMode,
    item_count: int,
    model_id: ModelId,
) -> dict:
    api_key = get_server_api_key()
    if not api_key:
        raise RuntimeError(
            "Server Gemini API key is not configured. Add GEMINI_API_KEY to environment variables or .streamlit/secrets.toml."
        )

    client = genai.Client(api_key=api_key)
    system_instruction = build_system_instruction(
        syllabus=syllabus,
        rigor=rigor,
        output_mode=output_mode,
        item_count=item_count,
    )

    # Do NOT pass deprecated sampling parameters (temperature, top_p) on gemini-3.8-flash
    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        response_mime_type="application/json",
        response_schema=RecallDeckSchema,
        thinking_config=types.ThinkingConfig(
            thinking_level=get_thinking_level(model_id),
        ),
    )

    contents: list = []
    if uploaded_file is not None:
        mime_type = infer_mime_type(uploaded_file.name, uploaded_file.type)
        raw_bytes = uploaded_file.getvalue()
        if mime_type in {"text/plain", "text/markdown", "text/csv"}:
            decoded_text = raw_bytes.decode("utf-8", errors="replace")[:50000]
            contents.append(f"Uploaded Document ({uploaded_file.name}):\n{decoded_text}")
        else:
            contents.append(types.Part.from_bytes(data=raw_bytes, mime_type=mime_type))

    trimmed_notes = (notes_text or "").strip()
    if trimmed_notes:
        contents.append(
            f"Source Academic Notes:\n{trimmed_notes}\n\n"
            "Transform the material above into atomic active-recall items adhering strictly to the syllabus and rigor rules."
        )
    else:
        contents.append(
            "Analyze the attached document and transform its core concepts into atomic active-recall items adhering strictly to the syllabus and rigor rules."
        )

    response = client.models.generate_content(
        model=model_id,
        contents=contents,
        config=config,
    )
    parsed_json = extract_json_from_gemini_response(response)
    excerpt = trimmed_notes or (f"Document: {uploaded_file.name}" if uploaded_file else "Study Notes")
    return normalize_deck_dict(
        parsed_json,
        syllabus=syllabus,
        rigor=rigor,
        output_mode=output_mode,
        model_used=model_id,
        source_excerpt=excerpt,
    )


def infer_mime_type(filename: str, reported_type: str | None) -> str:
    if reported_type:
        return reported_type
    lower = filename.lower()
    if lower.endswith(".md"):
        return "text/markdown"
    if lower.endswith(".txt"):
        return "text/plain"
    if lower.endswith(".csv"):
        return "text/csv"
    if lower.endswith(".pdf"):
        return "application/pdf"
    if lower.endswith(".png"):
        return "image/png"
    if lower.endswith((".jpg", ".jpeg")):
        return "image/jpeg"
    if lower.endswith(".webp"):
        return "image/webp"
    return "application/octet-stream"


def init_state() -> None:
    if "saved_decks" not in st.session_state:
        st.session_state.saved_decks = []
    if "active_deck_id" not in st.session_state:
        st.session_state.active_deck_id = None
    if "notes_text" not in st.session_state:
        st.session_state.notes_text = ""
    if "selected_syllabus" not in st.session_state:
        st.session_state.selected_syllabus = SYLLABUS_OPTIONS[0]
    if "card_index" not in st.session_state:
        st.session_state.card_index = 0
    if "card_revealed" not in st.session_state:
        st.session_state.card_revealed = False
    if "card_hint_open" not in st.session_state:
        st.session_state.card_hint_open = False
    if "quiz_submissions" not in st.session_state:
        st.session_state.quiz_submissions = {}


def get_active_deck() -> dict | None:
    active_id = st.session_state.active_deck_id
    for deck in st.session_state.saved_decks:
        if deck["id"] == active_id:
            return deck
    return None


def upsert_deck(deck: dict) -> None:
    decks = st.session_state.saved_decks
    for idx, existing in enumerate(decks):
        if existing["id"] == deck["id"]:
            decks[idx] = deck
            st.session_state.active_deck_id = deck["id"]
            return
    decks.insert(0, deck)
    st.session_state.active_deck_id = deck["id"]


init_state()

# Header
header_left, header_right = st.columns([4, 1], vertical_alignment="center")
with header_left:
    st.title("RecallForge — CBSE & Active-Recall Studio")
    st.caption("Mechanism-first flashcards and diagnostic quizzes powered by structured active recall.")
with header_right:
    active_deck = get_active_deck()
    if active_deck:
        st.download_button(
            "Export Anki CSV",
            data=export_deck_to_anki_csv(active_deck),
            file_name=f"{active_deck['id']}-anki.csv",
            mime="text/csv",
            use_container_width=True,
        )
    else:
        if st.button("Load Sample Deck", type="primary", use_container_width=True):
            sample = copy.deepcopy(SAMPLE_PRESETS[0]["deck"])
            upsert_deck(sample)
            st.session_state.card_index = 0
            st.session_state.card_revealed = False
            st.rerun()

tab_studio, tab_recall, tab_quiz, tab_library = st.tabs(
    ["Studio", "Active Recall", "Diagnostic Quiz", "Saved Decks"]
)

with tab_studio:
    st.subheader("Quick CBSE Presets")
    preset_cols = st.columns(len(SAMPLE_PRESETS))
    for col, preset in zip(preset_cols, SAMPLE_PRESETS):
        with col:
            if st.button(preset["label"], key=f"preset_{preset['id']}", use_container_width=True):
                st.session_state.notes_text = preset["notes_text"]
                st.session_state.selected_syllabus = preset["syllabus"]
                st.rerun()

    left_col, right_col = st.columns([1.2, 1], gap="large")
    with left_col:
        notes_input = st.text_area(
            "Source Material & Lecture Excerpts",
            value=st.session_state.notes_text,
            height=290,
            placeholder="Paste NCERT paragraphs, derivations, circuit laws, reaction mechanisms, or messy lecture notes...",
        )
        st.session_state.notes_text = notes_input

        uploaded_file = st.file_uploader(
            "Attach textbook PDF, Markdown notes, or diagram photo (max 8 MB)",
            type=["pdf", "txt", "md", "csv", "png", "jpg", "jpeg", "webp"],
        )

    with right_col:
        syllabus = st.selectbox(
            "Syllabus Alignment",
            options=list(SYLLABUS_OPTIONS),
            index=list(SYLLABUS_OPTIONS).index(st.session_state.selected_syllabus)
            if st.session_state.selected_syllabus in SYLLABUS_OPTIONS
            else 0,
        )
        st.session_state.selected_syllabus = syllabus

        rigor = st.radio(
            "Cognitive Rigor",
            options=list(RIGOR_OPTIONS.keys()),
            index=1,
            horizontal=True,
        )
        st.caption(RIGOR_OPTIONS[rigor])

        mode_col, count_col = st.columns(2)
        with mode_col:
            output_mode_label = st.selectbox("Output Mode", ["Mixed", "Cards Only", "Quiz Only"])
            output_mode_map: dict[str, OutputMode] = {
                "Mixed": "mixed",
                "Cards Only": "flashcards",
                "Quiz Only": "quiz",
            }
            output_mode: OutputMode = output_mode_map[output_mode_label]
        with count_col:
            item_count = st.selectbox("Atomic Items", [4, 6, 8, 12], index=1)

        model_id: ModelId = st.radio(
            "Reasoning Engine",
            options=list(MODEL_OPTIONS.keys()),
            format_func=lambda m: MODEL_OPTIONS[m]["label"],
            index=0,
        )
        st.caption(MODEL_OPTIONS[model_id]["description"])

        if st.button("Forge Recall Set", type="primary", use_container_width=True):
            has_file = uploaded_file is not None
            mime = infer_mime_type(uploaded_file.name, uploaded_file.type) if has_file else None
            size = uploaded_file.size if has_file else 0
            valid, err_msg = validate_inputs(
                notes_text=notes_input,
                has_attachment=has_file,
                attachment_mime=mime,
                attachment_bytes=size,
                item_count=int(item_count),
                model_id=model_id,
            )
            if not valid:
                st.error(err_msg)
            else:
                with st.spinner("Forging atomic active-recall items..."):
                    try:
                        new_deck = call_gemini_generate(
                            notes_text=notes_input,
                            uploaded_file=uploaded_file,
                            syllabus=syllabus,
                            rigor=rigor,
                            output_mode=output_mode,
                            item_count=int(item_count),
                            model_id=model_id,
                        )
                        upsert_deck(new_deck)
                        st.session_state.card_index = 0
                        st.session_state.card_revealed = False
                        st.session_state.card_hint_open = False
                        st.session_state.quiz_submissions = {}
                        st.success(f"Forged '{new_deck['title']}'. Open the Active Recall or Diagnostic Quiz tab.")
                    except Exception as exc:
                        st.error(f"Generation failed: {exc}")

    st.divider()
    st.subheader("Ready-to-Study CBSE Reference Decks")
    ref_cols = st.columns(len(SAMPLE_PRESETS))
    for col, preset in zip(ref_cols, SAMPLE_PRESETS):
        with col:
            with st.container(border=True):
                st.caption(f"{preset['syllabus']} · {preset['deck']['rigor']}")
                st.markdown(f"**{preset['deck']['title']}**")
                if st.button("Open Deck", key=f"open_ref_{preset['id']}", use_container_width=True):
                    upsert_deck(copy.deepcopy(preset["deck"]))
                    st.session_state.card_index = 0
                    st.session_state.card_revealed = False
                    st.session_state.quiz_submissions = {}
                    st.rerun()

with tab_recall:
    deck = get_active_deck()
    if not deck:
        st.info("No active deck loaded. Load a CBSE reference deck or forge one in the Studio tab.")
    elif not deck["flashcards"]:
        st.info("This deck contains diagnostic quiz items only. Switch to the Diagnostic Quiz tab.")
    else:
        cards = deck["flashcards"]
        stats = compute_session_stats(cards)

        m1, m2, m3, m4 = st.columns(4)
        m1.metric("Mastered", f"{stats['mastered']} / {stats['total']}")
        m2.metric("Hard / Revisit", stats["hard"])
        m3.metric("Again (Missed)", stats["again"])
        m4.metric("Deck Mastery", f"{stats['mastery_percent']}%")

        filter_choice = st.radio(
            "Filter Cards",
            ["All Cards", "Needs Review"],
            horizontal=True,
        )
        visible_cards = (
            cards
            if filter_choice == "All Cards"
            else [c for c in cards if c.get("rating") != "mastered"]
        )

        if not visible_cards:
            st.success("All cards in this deck are mastered.")
            if st.button("Reset Mastery Ratings"):
                for c in cards:
                    c["rating"] = None
                st.rerun()
        else:
            idx = min(st.session_state.card_index, len(visible_cards) - 1)
            card = visible_cards[idx]

            with st.container(border=True):
                st.caption(
                    f"Card {idx + 1} of {len(visible_cards)} · {card['concept']} · {card['mechanism']} · {card['syllabusTag']}"
                )
                st.markdown(f"#### {card['prompt']}")

                if st.button(
                    "Hide Hint" if st.session_state.card_hint_open else "Show Hint",
                    key=f"hint_{card['id']}",
                ):
                    st.session_state.card_hint_open = not st.session_state.card_hint_open
                    st.rerun()

                if st.session_state.card_hint_open and not st.session_state.card_revealed:
                    st.warning(f"Hint: {card['hint']}")

                if not st.session_state.card_revealed:
                    if st.button("Reveal Worked Answer", type="primary", key=f"reveal_{card['id']}"):
                        st.session_state.card_revealed = True
                        st.rerun()
                else:
                    st.success(f"**Worked Reasoning:**\n\n{card['answer']}")
                    st.error(f"**Common Exam Pitfall:** {card['commonPitfall']}")

                    r1, r2, r3 = st.columns(3)
                    if r1.button("Again · Missed", use_container_width=True, key=f"rate_again_{card['id']}"):
                        card["rating"] = "again"
                        st.session_state.card_revealed = False
                        st.session_state.card_hint_open = False
                        st.session_state.card_index = (idx + 1) % len(visible_cards)
                        st.rerun()
                    if r2.button("Hard · Partial", use_container_width=True, key=f"rate_hard_{card['id']}"):
                        card["rating"] = "hard"
                        st.session_state.card_revealed = False
                        st.session_state.card_hint_open = False
                        st.session_state.card_index = (idx + 1) % len(visible_cards)
                        st.rerun()
                    if r3.button("Mastered", type="primary", use_container_width=True, key=f"rate_mast_{card['id']}"):
                        card["rating"] = "mastered"
                        st.session_state.card_revealed = False
                        st.session_state.card_hint_open = False
                        st.session_state.card_index = (idx + 1) % len(visible_cards)
                        st.rerun()

            nav_prev, nav_next = st.columns(2)
            if nav_prev.button("Previous Card", use_container_width=True):
                st.session_state.card_index = (idx - 1) % len(visible_cards)
                st.session_state.card_revealed = False
                st.session_state.card_hint_open = False
                st.rerun()
            if nav_next.button("Next Card", use_container_width=True):
                st.session_state.card_index = (idx + 1) % len(visible_cards)
                st.session_state.card_revealed = False
                st.session_state.card_hint_open = False
                st.rerun()

with tab_quiz:
    deck = get_active_deck()
    if not deck:
        st.info("No active deck loaded. Load a CBSE reference deck or forge one in the Studio tab.")
    elif not deck["quizQuestions"]:
        st.info("This deck contains flashcards only. Switch to Active Recall or forge a Mixed/Quiz deck.")
    else:
        questions = deck["quizQuestions"]
        submissions = st.session_state.quiz_submissions
        correct_count = sum(1 for q in questions if submissions.get(q["id"]) == q["correctIndex"])
        st.metric("Diagnostic Score", f"{correct_count} / {len(questions)}")

        for q_idx, q in enumerate(questions, start=1):
            with st.container(border=True):
                st.caption(f"Q{q_idx} · {q['concept']} · {q['mechanism']} · {q['syllabusTag']}")
                st.markdown(f"**{q['scenarioPrompt']}**")

                selected = submissions.get(q["id"])
                choice = st.radio(
                    f"Select option for Q{q_idx}",
                    options=list(range(len(q["options"]))),
                    format_func=lambda i, opts=q["options"]: f"{chr(65 + i)}. {opts[i]}",
                    index=selected if selected is not None else None,
                    key=f"quiz_radio_{q['id']}",
                    label_visibility="collapsed",
                )
                if choice is not None and selected is None:
                    submissions[q["id"]] = choice
                    st.rerun()

                if selected is not None:
                    if selected == q["correctIndex"]:
                        st.success(f"Correct: {q['correctExplanation']}")
                    else:
                        st.error(
                            f"Incorrect. Correct answer: {chr(65 + q['correctIndex'])}. "
                            f"{q['correctExplanation']}"
                        )
                    if q.get("distractorNotes"):
                        with st.expander("Why Distractors Fail (Misconception Analysis)", expanded=True):
                            for note in q["distractorNotes"]:
                                st.markdown(
                                    f"- **Option {chr(65 + note['optionIndex'])}:** {note['whyIncorrect']}"
                                )

        if st.button("Retake Quiz"):
            st.session_state.quiz_submissions = {}
            st.rerun()

with tab_library:
    decks = st.session_state.saved_decks
    if not decks:
        st.info("No saved decks in this session yet.")
    else:
        for d in decks:
            stats = compute_session_stats(d["flashcards"])
            with st.container(border=True):
                st.caption(f"{d['syllabus']} · {d['rigor']} · {d['modelUsed']}")
                st.markdown(f"### {d['title']}")
                st.write(f"{stats['total']} cards ({stats['mastery_percent']}% mastered) · {len(d['quizQuestions'])} quiz items")

                c1, c2, c3, c4 = st.columns(4)
                if c1.button("Activate Deck", key=f"act_{d['id']}", use_container_width=True):
                    st.session_state.active_deck_id = d["id"]
                    st.session_state.card_index = 0
                    st.session_state.card_revealed = False
                    st.rerun()
                c2.download_button(
                    "Download CSV",
                    data=export_deck_to_anki_csv(d),
                    file_name=f"{d['id']}-anki.csv",
                    mime="text/csv",
                    key=f"csv_{d['id']}",
                    use_container_width=True,
                )
                c3.download_button(
                    "Download MD",
                    data=export_deck_to_markdown(d),
                    file_name=f"{d['id']}.md",
                    mime="text/markdown",
                    key=f"md_{d['id']}",
                    use_container_width=True,
                )
                if c4.button("Delete", key=f"del_{d['id']}", use_container_width=True):
                    st.session_state.saved_decks = [x for x in decks if x["id"] != d["id"]]
                    if st.session_state.active_deck_id == d["id"]:
                        st.session_state.active_deck_id = None
                    st.rerun()
