#!/usr/bin/env python3
"""Read-only rollout verification of the four exact public Pages file bytes."""
import hashlib
import json
import os
from pathlib import Path
import time
import urllib.error
import urllib.parse
import urllib.request

root = Path(__file__).resolve().parents[1]
base = os.environ["LIVE_PREVIEW_URL"].rstrip("/") + "/"
url = urllib.parse.urlparse(base)
assert url.scheme == "https" and url.hostname, "Use the verified official HTTPS preview URL"
expected = json.loads((root / "play/wildbond/build.json").read_text())
files = {"index.pck", "index.html", "index.js", "index.wasm"}
assert set(expected["sha256"]) == files
out = root / "preview-review"
out.mkdir(exist_ok=True)
deadline = time.monotonic() + 900
attempts = []


def fetch(name):
    request = urllib.request.Request(base + name, headers={"Cache-Control": "no-cache", "User-Agent": "Wildbond-read-only-build-verification"})
    with urllib.request.urlopen(request, timeout=60) as response:
        assert response.status == 200, (name, response.status)
        final = urllib.parse.urlparse(response.url)
        assert final.scheme == "https" and final.hostname == url.hostname, "Unexpected cross-site deployment redirect"
        return response.read()


while True:
    result = {"checked_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "url": base}
    try:
        actual_manifest = json.loads(fetch("build.json"))
        assert actual_manifest == expected, "Public build metadata is still a different revision"
        found = {}
        for name in sorted(files):
            data = fetch(name)
            found[name] = {"bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}
            assert found[name]["sha256"] == expected["sha256"][name], name + " is still different from the reviewed commit"
        result.update({"verified": True, "source_commit": expected["source_commit"], "files": found})
        attempts.append(result)
        (out / "live-verification.json").write_text(json.dumps({"attempts": attempts, "verified": True}, indent=2) + "\n")
        print("LIVE_PREVIEW_VERIFIED " + json.dumps(result))
        break
    except (AssertionError, OSError, ValueError, urllib.error.URLError) as error:
        result.update({"verified": False, "reason": str(error)})
        attempts.append(result)
        (out / "live-verification.json").write_text(json.dumps({"attempts": attempts, "verified": False}, indent=2) + "\n")
        print("Waiting for Pages: " + str(error), flush=True)
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise RuntimeError("The reviewed bytes were not all live within the 15-minute Pages rollout window") from error
        time.sleep(min(30, remaining))
