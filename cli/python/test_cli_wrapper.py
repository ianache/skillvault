import os
import sys
import unittest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from skillvault.cli import main


class TestCLIWrapper(unittest.TestCase):
    @patch("os.path.exists")
    @patch("subprocess.run")
    def test_calls_native_binary_if_present(self, mock_run, mock_exists):
        mock_exists.side_effect = lambda path: "skillvault-bin" in path
        mock_run.return_value = MagicMock(returncode=0)

        with patch("sys.argv", ["skillvault", "--version"]):
            with self.assertRaises(SystemExit) as cm:
                main()
            self.assertEqual(cm.exception.code, 0)
            mock_run.assert_called_once()
            self.assertIn("skillvault-bin", mock_run.call_args[0][0][0])

    @patch("os.path.exists")
    @patch("shutil.which")
    @patch("subprocess.run")
    def test_calls_node_with_bundle_if_no_binary(self, mock_run, mock_which, mock_exists):
        mock_exists.side_effect = lambda path: "skillvault.bundle.cjs" in path
        mock_which.return_value = "/usr/bin/node"
        mock_run.return_value = MagicMock(returncode=0)

        with patch("sys.argv", ["skillvault", "--version"]):
            with self.assertRaises(SystemExit) as cm:
                main()
            self.assertEqual(cm.exception.code, 0)
            mock_run.assert_called_once()
            self.assertEqual(mock_run.call_args[0][0][0], "/usr/bin/node")


if __name__ == "__main__":
    unittest.main()
