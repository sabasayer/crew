import json
import os
import subprocess
import sys
import tempfile
import unittest

BIN = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "bin")
MR = ["--repo", "/r/app", "--remote", "gitlab.com/g/app", "--worktree", "/w/app", "--branch", "feat/x"]


def run(root, name, args, **env):
    full = {"PATH": os.environ["PATH"], "CREW_BOARD_ROOT": root, "CLAUDE_CODE_SESSION_ID": "first", **env}
    return subprocess.run([os.path.join(BIN, name), *args], env=full, capture_output=True, text=True)


def create(root, *extra):
    return run(root, "crew-ship", ["create", "abc-1", "--title", "Add x", "--fleet", "app", *extra, *MR])


def ship(root):
    with open(f"{root}/abc-1/ship.json") as f:
        return json.load(f)


class CrewShip(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.TemporaryDirectory()
        self.root = self.dir.name

    def tearDown(self):
        self.dir.cleanup()

    def test_bad_input_is_refused_and_nothing_is_written(self):
        base = ["--title", "t", "--fleet", "f", *MR]
        for args in (
            ["create", "a/b", *base],
            ["create", "abc-1", "--title", " ", "--fleet", "f", *MR],
            ["create", "abc-1", "--title", "t", "--fleet", "f", *[v.replace("gitlab.com/g/app", "https://x.com/a") for v in MR]],
            ["create", "abc-1", "--title", "t", "--fleet", "f", *[v.replace("/w/app", "w/app") for v in MR]],
            ["create", "abc-1", *base, "--task", "nope"],
        ):
            self.assertNotEqual(run(self.root, "crew-ship", args).returncode, 0, args)
        self.assertEqual(os.listdir(self.root), [])

    def test_valid_ship_file_add_mr_and_url(self):
        self.assertEqual(create(self.root).returncode, 0)
        data = ship(self.root)
        self.assertEqual((data["version"], data["ship"], data["task"], data["session"]["id"]), (1, "abc-1", None, "first"))
        self.assertEqual(data["mrs"][0]["url"], None)
        self.assertNotEqual(create(self.root).returncode, 0)
        self.assertEqual(run(self.root, "crew-ship", ["add-mr", "abc-1", *MR]).returncode, 0)
        self.assertEqual([m["n"] for m in ship(self.root)["mrs"]], [1, 2])
        for n, url in (("2", "nope"), ("3", "https://x.com/mr/3")):
            self.assertNotEqual(run(self.root, "crew-ship", ["url", "abc-1", n, url]).returncode, 0)
        self.assertEqual(run(self.root, "crew-ship", ["url", "abc-1", "2", "https://x.com/mr/2"]).returncode, 0)
        self.assertEqual(ship(self.root)["mrs"][1]["url"], "https://x.com/mr/2")

    def test_status_refreshes_session_but_not_in_a_sub_agent(self):
        create(self.root)
        status = lambda **env: run(self.root, "crew-status", ["--run", f"{self.root}/abc-1-mr1", "red", "running", "--order", "1"], **env)
        self.assertEqual(status(CLAUDE_CODE_SESSION_ID="second").returncode, 0)
        self.assertEqual(ship(self.root)["session"]["id"], "second")
        status(CLAUDE_CODE_SESSION_ID="child", CLAUDE_CODE_CHILD_SESSION="1")
        self.assertEqual(ship(self.root)["session"]["id"], "second")

    def test_status_without_a_ship_file_writes_only_the_status_file(self):
        self.assertEqual(run(self.root, "crew-status", ["--run", f"{self.root}/xyz-mr1", "red", "running", "--order", "1"]).returncode, 0)
        self.assertEqual(os.listdir(self.root), ["xyz-mr1"])


if __name__ == "__main__":
    unittest.main()
