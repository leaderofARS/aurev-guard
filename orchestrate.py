"""
orchestrate.py
Step-by-step runner for AUREV Guard:
- ensures package structure
- installs dependencies
- pulls live blockchain data (500 blocks, append)
- trains models
- launches API
- tests prediction endpoint

Run from repo root:
  python orchestrate.py
Or choose steps:
  python orchestrate.py --data --train --api --test --port 9000
"""

import os
import sys
import time
import subprocess
import json
import urllib.request
import urllib.error
from pathlib import Path
import argparse

REPO_ROOT = Path(__file__).resolve().parent
PYTHON = sys.executable

def run(cmd, cwd=None):
    print(f"$ {' '.join(cmd)}")
    proc = subprocess.run(cmd, cwd=cwd or REPO_ROOT)
    if proc.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(cmd)}")

def ensure_inits():
    print("[init] ensuring package markers")
    paths = [
        REPO_ROOT / "agents" / "__init__.py",
        REPO_ROOT / "agents" / "ai_model" / "__init__.py",
        REPO_ROOT / "agents" / "ai_model" / "src" / "__init__.py",
        REPO_ROOT / "agents" / "ai_model" / "src" / "features" / "__init__.py",
        REPO_ROOT / "agents" / "ai_model" / "src" / "pipeline" / "__init__.py",
        REPO_ROOT / "agents" / "ai_model" / "src" / "utils" / "__init__.py",
    ]
    for p in paths:
        p.parent.mkdir(parents=True, exist_ok=True)
        if not p.exists():
            p.write_text("")
            print(f"created {p}")

def install_deps():
    print("[deps] installing requirements")
    req = REPO_ROOT / "agents" / "ai_model" / "src" / "requirements.txt"
    if req.exists():
        run([PYTHON, "-m", "pip", "install", "-r", str(req)])
    else:
        pkgs = [
            "fastapi", "uvicorn", "pydantic", "loguru",
            "scikit-learn", "pandas", "numpy", "shap", "matplotlib", "joblib",
            "requests", "python-dotenv", "pyarrow",
        ]
        run([PYTHON, "-m", "pip", "install"] + pkgs)

def run_live_pipeline():
    print("[data] pulling live blockchain data (500 blocks, append)")
    # Run as module to respect package imports
    run([PYTHON, "-m", "agents.ai_model.src.live_pipeline"])

def train_models():
    print("[train] running training")
    run([PYTHON, "-m", "agents.ai_model.src.train"])

def inference_demo():
    print("[infer] running inference demo")
    run([PYTHON, "-m", "agents.ai_model.src", "inference"])

def start_api(port: int):
    print(f"[api] starting uvicorn on port {port}")
    # spawn server in background
    proc = subprocess.Popen(
        [PYTHON, "-m", "uvicorn", "agents.ai_model.src.pipeline.api:app", "--port", str(port), "--reload"],
        cwd=REPO_ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    return proc

def test_predict(port: int):
    print("[test] /predict request")
    payload = {
        "tx_count_24h": 12,
        "total_value_24h": 5_000_000,
        "largest_value_24h": 2_000_000,
        "std_value_24h": 200_000,
        "unique_counterparts_24h": 15,
        "entropy_of_destinations": 2.5,
        "share_of_daily_volume": 0.35,
        "relative_max_vs_global": 0.8,
    }
    data = json.dumps(payload).encode("utf-8")
    url = f"http://127.0.0.1:{port}/predict"
    for _ in range(15):
        time.sleep(0.8)
        try:
            req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
            with urllib.request.urlopen(req, timeout=3) as resp:
                out = json.loads(resp.read().decode("utf-8"))
                print(json.dumps(out, indent=2))
                return True
        except (urllib.error.URLError, urllib.error.HTTPError):
            pass
    print("Could not reach API. Visit:", f"http://127.0.0.1:{port}/docs")
    return False

def parse_args():
    parser = argparse.ArgumentParser(description="AUREV Guard orchestrator")
    parser.add_argument("--port", type=int, default=int(os.environ.get("AUREV_PORT", "8000")), help="API port")
    parser.add_argument("--data", action="store_true", help="Run live data pipeline")
    parser.add_argument("--train", action="store_true", help="Run training")
    parser.add_argument("--api", action="store_true", help="Start API")
    parser.add_argument("--test", action="store_true", help="Test /predict endpoint")
    parser.add_argument("--all", action="store_true", help="Run full pipeline (data, train, api, test)")
    return parser.parse_args()

def main():
    # Ensure we run from repo root so -m imports work
    os.chdir(REPO_ROOT)

    args = parse_args()
    steps = {"data": args.data, "train": args.train, "api": args.api, "test": args.test}
    if args.all or not any(steps.values()):
        # Default: full pipeline
        steps = {"data": True, "train": True, "api": True, "test": True}

    print("== AUREV Guard orchestrator ==")
    ensure_inits()
    install_deps()

    if steps["data"]:
        run_live_pipeline()

    if steps["train"]:
        train_models()

    proc = None
    if steps["api"]:
        proc = start_api(args.port)

    if steps["test"]:
        ok = test_predict(args.port)
        print("Open docs:", f"http://127.0.0.1:{args.port}/docs")
        if not ok and proc is not None:
            time.sleep(1.0)
            print("\n[api logs]")
            try:
                output = proc.stdout.read().decode("utf-8", errors="ignore")
                print("\n".join(output.splitlines()[-50:]))
            except Exception:
                pass

    # Keep server running
    if proc is not None:
        print("== API running ==")
        print("Press Ctrl+C to stop the server.")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nStopping server...")
        finally:
            proc.terminate()

    print("== Done ==")

if __name__ == "__main__":
    main()