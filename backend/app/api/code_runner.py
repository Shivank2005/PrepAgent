from fastapi import APIRouter
import subprocess
import tempfile
import os
import re
import asyncio

router = APIRouter()

# File extensions and compile/run commands for each language
LANG_CONFIG = {
    "javascript": {"ext": ".js", "run": ["node"]},
    "python": {"ext": ".py", "run": ["python"]},
    "java": {"ext": ".java", "compile": ["javac"], "run": ["java", "-cp"]},
    "cpp": {"ext": ".cpp", "compile": ["g++", "-o"], "run": []},
    "c": {"ext": ".c", "compile": ["gcc", "-o"], "run": []},
    "typescript": {"ext": ".ts", "run": ["npx", "ts-node"]},
    "go": {"ext": ".go", "run": ["go", "run"]},
    "rust": {"ext": ".rs", "compile": ["rustc", "-o"], "run": []},
}

TIMEOUT = 15  # seconds


def _run_sync(code: str, lang: str) -> dict:
    config = LANG_CONFIG.get(lang)
    if not config:
        return {"stdout": "", "stderr": f"Unsupported language: {lang}", "code": 1, "output": f"Unsupported language: {lang}"}

    with tempfile.TemporaryDirectory() as tmpdir:
        try:
            if lang == "java":
                return _run_java(code, tmpdir)
            elif lang in ("cpp", "c", "rust"):
                return _run_compiled(code, lang, config, tmpdir)
            else:
                return _run_interpreted(code, lang, config, tmpdir)
        except subprocess.TimeoutExpired:
            return {"stdout": "", "stderr": "⏱️ Execution timed out (15s limit)", "code": 1, "output": "Execution timed out"}
        except FileNotFoundError as e:
            return {"stdout": "", "stderr": f"Compiler/runtime not found: {e.filename}. Make sure it's installed and in PATH.", "code": 1, "output": f"Runtime not found: {e.filename}"}
        except Exception as e:
            return {"stdout": "", "stderr": str(e), "code": 1, "output": str(e)}


def _run_java(code: str, tmpdir: str) -> dict:
    # Extract public class name from code
    match = re.search(r'public\s+class\s+(\w+)', code)
    classname = match.group(1) if match else "Main"
    filepath = os.path.join(tmpdir, f"{classname}.java")

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)

    # Compile
    compile_result = subprocess.run(
        ["javac", filepath],
        capture_output=True, text=True, timeout=TIMEOUT, cwd=tmpdir
    )
    if compile_result.returncode != 0:
        return {"stdout": "", "stderr": compile_result.stderr, "code": 1, "output": compile_result.stderr}

    # Run
    result = subprocess.run(
        ["java", "-cp", tmpdir, classname],
        capture_output=True, text=True, timeout=TIMEOUT, cwd=tmpdir
    )
    return {
        "stdout": result.stdout,
        "stderr": result.stderr,
        "code": result.returncode,
        "output": result.stdout if result.returncode == 0 else result.stderr,
    }


def _run_compiled(code: str, lang: str, config: dict, tmpdir: str) -> dict:
    ext = config["ext"]
    src = os.path.join(tmpdir, f"main{ext}")
    exe = os.path.join(tmpdir, "main.exe" if os.name == "nt" else "main")

    with open(src, "w", encoding="utf-8") as f:
        f.write(code)

    # Compile
    compile_cmd = config["compile"] + [exe, src]
    compile_result = subprocess.run(
        compile_cmd, capture_output=True, text=True, timeout=TIMEOUT, cwd=tmpdir
    )
    if compile_result.returncode != 0:
        return {"stdout": "", "stderr": compile_result.stderr, "code": 1, "output": compile_result.stderr}

    # Run
    result = subprocess.run(
        [exe], capture_output=True, text=True, timeout=TIMEOUT, cwd=tmpdir
    )
    return {
        "stdout": result.stdout,
        "stderr": result.stderr,
        "code": result.returncode,
        "output": result.stdout if result.returncode == 0 else result.stderr,
    }


def _run_interpreted(code: str, lang: str, config: dict, tmpdir: str) -> dict:
    ext = config["ext"]
    filepath = os.path.join(tmpdir, f"main{ext}")

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)

    run_cmd = config["run"] + [filepath]
    result = subprocess.run(
        run_cmd, capture_output=True, text=True, timeout=TIMEOUT, cwd=tmpdir
    )
    return {
        "stdout": result.stdout,
        "stderr": result.stderr,
        "code": result.returncode,
        "output": result.stdout if result.returncode == 0 else result.stderr,
    }


@router.post("/run")
async def run_code(payload: dict):
    code = payload.get("code", "")
    lang = payload.get("language", "javascript")

    # Run in a thread pool to avoid blocking the event loop
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, _run_sync, code, lang)
    return result
