"""Integration and unit tests for SERA-inspired capabilities in JARVIS."""

import os
import sys
import unittest
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from core.learning import ErrorReflectionEngine, MistakeStore, normalize_signature, classify_error
from core.diagnostics import system_doctor
from core.hardware_grader import hardware_grader
from core.screen_memory import screen_memory
from security.privacy import redact_secrets, contains_secrets, redact_data
from tools.clipboard import snapshot_clipboard, restore_clipboard, preserve_clipboard
from tools.windows_manager import list_open_windows, _get_window_info


class TestSeraFeatures(unittest.TestCase):

    def test_privacy_redaction(self):
        """Test regex secret filtering for API keys, tokens, and passwords."""
        test_openai = "Connecting with sk-proj-1234567890abcdefghijklmnopqrstuvwxyz1234 to server"
        redacted = redact_secrets(test_openai)
        self.assertNotIn("sk-proj-1234567890", redacted)
        self.assertIn("[REDACTED_OPENAI_KEY]", redacted)

        test_google = "Google API Key is AIzaSyD9876543210zyxwvutsrqponmlkjihgfe"
        self.assertTrue(contains_secrets(test_google))
        self.assertIn("[REDACTED_GOOGLE_KEY]", redact_secrets(test_google))

        test_dict = {
            "token": "sk-111122223333444455556666",
            "nested": {"password": "supersecretpassword123"}
        }
        clean_dict = redact_data(test_dict)
        self.assertNotIn("111122223333", str(clean_dict))

    def test_learning_and_mistake_store(self):
        """Test error classification, normalization, and reflection engine."""
        sig = normalize_signature("focus_window", "Window lost focus at PID 4920 and address 0x7fff4012")
        self.assertNotIn("4920", sig)
        self.assertNotIn("0x7fff", sig)

        engine = ErrorReflectionEngine()
        learned = engine.reflect_and_learn(
            tool_name="click_element",
            args={"query": "Submit"},
            error_text="Target window lost focus during click event"
        )
        self.assertIn("focus_window", learned["workaround"])

        # Pre-flight check should now return the advice
        pre = engine.pre_flight_check("click_element", {"query": "Submit"})
        self.assertTrue(pre.get("has_hint"))
        self.assertIn("focus", pre.get("hint").lower())

    def test_windows_manager(self):
        """Test native Win32 window listing."""
        windows = list_open_windows()
        self.assertIsInstance(windows, list)
        self.assertGreater(len(windows), 0)
        first = windows[0]
        self.assertIn("hwnd", first)
        self.assertIn("title", first)
        self.assertIn("bounds", first)

    def test_hardware_grader(self):
        """Test GPU detection and model fit grading."""
        gpus = hardware_grader.get_gpu_info()
        self.assertIsInstance(gpus, list)
        self.assertGreater(len(gpus), 0)

        vram = hardware_grader.get_best_vram_gb()
        self.assertIsInstance(vram, float)

        grade_small = hardware_grader.grade_model("llama3.2:1b")
        self.assertIn(grade_small["grade"], ["excellent", "good", "usable"])

        audit = hardware_grader.audit_all()
        self.assertIn("evaluations", audit)
        self.assertIn("recommended_model", audit)

    def test_system_doctor(self):
        """Test diagnostic checks across runtime, disk, RAM, and db."""
        report = system_doctor.run_all_checks()
        self.assertIn("overall_status", report)
        self.assertIn("checks", report)
        self.assertGreaterEqual(len(report["checks"]), 10)

        # Ensure checks have required fields
        for c in report["checks"]:
            self.assertIn("id", c)
            self.assertIn("status", c)
            self.assertIn(c["status"], ["pass", "warn", "fail"])

    def test_screen_memory(self):
        """Test chronological screen memory digest."""
        screen_memory.clear()
        screen_memory.record_snapshot("Fatal error 0xC0000005 in application module ntdll.dll", ["0xC0000005"])
        screen_memory.record_snapshot("Welcome to Visual Studio Code", [])

        results = screen_memory.query("0xC0000005")
        self.assertEqual(len(results), 1)
        self.assertIn("0xC0000005", results[0]["text_preview"])

    def test_clipboard_preservation(self):
        """Test snapshot and restore of clipboard."""
        import pyperclip
        original = "JARVIS_TEST_CLIPBOARD_STRING_12345"
        pyperclip.copy(original)

        snapshot = snapshot_clipboard()
        self.assertEqual(snapshot, original)

        # Overwrite clipboard
        pyperclip.copy("TEMPORARY_JUNK_CONTENT")
        self.assertEqual(pyperclip.paste(), "TEMPORARY_JUNK_CONTENT")

        # Restore
        restored = restore_clipboard()
        self.assertTrue(restored)
        self.assertEqual(pyperclip.paste(), original)


if __name__ == "__main__":
    unittest.main()
