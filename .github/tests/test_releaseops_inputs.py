import os
import subprocess
import textwrap
import unittest
from pathlib import Path

WORKFLOW = Path(__file__).resolve().parents[1] / "workflows/releaseops-aura-tests.yml"


class ReleaseopsInputTest(unittest.TestCase):
    def test_invocation_validation(self):
        script = textwrap.dedent(
            WORKFLOW.read_text()
            .split("        run: |\n", 1)[1]
            .split("\n  aura-professional-5-tests:", 1)[0]
        )
        for database, correlation, valid in [
            ("", "", True),
            ("abcdef12", "releaseops-100-1", True),
            ("graphql", "releaseops-100-1", False),
            ("abcdef12", "", False),
            ("", "releaseops-100-1", False),
            ("abcdef12.example.test", "releaseops-100-1", False),
            ("abcdef12", "releaseops-100-1\nother", False),
        ]:
            result = subprocess.run(
                ["bash", "-e", "-c", script],
                env=dict(os.environ, DATABASE_ID=database, CORRELATION_ID=correlation),
                capture_output=True,
                check=False,
            )
            self.assertEqual(result.returncode == 0, valid, (database, correlation))


if __name__ == "__main__":
    unittest.main()
