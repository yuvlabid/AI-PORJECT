import sys
import types as py_types
import unittest
from pathlib import Path

# Allow running without installing pydantic if testing pure stdlib helpers, or use pydantic if present
sys.path.insert(0, str(Path(__file__).parent))

# Provide minimal pydantic stub only if pydantic is absent in the bare container Python
try:
    import pydantic  # noqa: F401
except ImportError:
    stub = py_types.ModuleType("pydantic")

    class _BaseModel:
        pass

    def _Field(**kwargs):
        return None

    stub.BaseModel = _BaseModel
    stub.Field = _Field
    sys.modules["pydantic"] = stub

import recall_logic  # noqa: E402
from sample_decks import SAMPLE_PRESETS  # noqa: E402


class TestStreamlitRecallLogic(unittest.TestCase):
    def test_thinking_levels(self):
        self.assertEqual(recall_logic.get_thinking_level("gemini-3.5-flash-lite"), "MINIMAL")
        self.assertEqual(recall_logic.get_thinking_level("gemini-3.8-flash"), "LOW")

    def test_system_instruction_rules(self):
        prompt = recall_logic.build_system_instruction(
            syllabus="CBSE Class 12 Physics",
            rigor="Application & HOTS",
            output_mode="mixed",
            item_count=6,
        )
        self.assertIn("Ban Trivia & Rote Lookups", prompt)
        self.assertIn("Atomic Boundaries", prompt)
        self.assertIn("CBSE Class 12 Physics", prompt)

    def test_extract_json_ignores_thinking_parts(self):
        thought_part = py_types.SimpleNamespace(thought=True, text="internal reasoning...")
        json_part = py_types.SimpleNamespace(
            thought=False,
            text='```json\n{"deckTitle":"Lenz Mechanics","syllabusSummary":"CBSE","flashcards":[],"quizQuestions":[]}\n```',
        )
        resp = py_types.SimpleNamespace(
            candidates=[py_types.SimpleNamespace(content=py_types.SimpleNamespace(parts=[thought_part, json_part]))],
            text="",
        )
        parsed = recall_logic.extract_json_from_gemini_response(resp)
        self.assertEqual(parsed["deckTitle"], "Lenz Mechanics")

    def test_validate_inputs(self):
        ok, err = recall_logic.validate_inputs("", False)
        self.assertFalse(ok)
        self.assertIsNotNone(err)

        ok_valid, err_valid = recall_logic.validate_inputs(
            "Faraday law states induced EMF equals negative rate of change of magnetic flux.",
            False,
            item_count=6,
            model_id="gemini-3.8-flash",
        )
        self.assertTrue(ok_valid)
        self.assertIsNone(err_valid)

    def test_exports(self):
        deck = SAMPLE_PRESETS[0]["deck"]
        csv_out = recall_logic.export_deck_to_anki_csv(deck)
        md_out = recall_logic.export_deck_to_markdown(deck)
        self.assertTrue(csv_out.startswith("Front,Back,Tags"))
        self.assertIn("# Electromagnetic Induction", md_out)


if __name__ == "__main__":
    unittest.main()
