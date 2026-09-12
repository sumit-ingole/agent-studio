import json
import re
from datetime import datetime, timezone
from typing import Any

import httpx

from .config import Settings

MAX_ATTEMPTS = 3


def prompt_for(framework: str, requirement: str, component_name: str, features: list[str]) -> str:
    if framework == "react":
        files = f"{component_name}.tsx", f"{component_name}.module.css"
        rules = "React 18 TypeScript functional component, default export, accessible light theme CSS"
    else:
        files = "index.html", "component.js", "styles.css"
        rules = "self-contained accessible HTML, vanilla ES2020 JavaScript, responsive light theme CSS"
    return f"""You are ComponentForge, a production-ready web component generator. Generate only source files, no markdown.
Requirements: {requirement}
Component name: {component_name}
Features: {', '.join(features)}
Rules: {rules}. Include preview-data.json with a small valid object. Use exactly these delimiters:
=== FILE: {files[0]} ===\n[complete source]\n=== END FILE ===
=== FILE: {files[1]} ===\n[complete source]\n=== END FILE ===
=== FILE: preview-data.json ===\n{{\"label\":\"Submit\",\"loading\":false,\"disabled\":false}}\n=== END FILE ==="""


def parse_generated_code(code: str, framework: str) -> dict[str, str]:
    files: dict[str, str] = {}
    pattern = re.compile(r"===\s*FILE:\s*([^=\n]+?)\s*===\s*\n([\s\S]*?)\n===\s*END FILE\s*===", re.I)
    for match in pattern.finditer(code):
        name, content = match.group(1).strip(), match.group(2).strip()
        if name and content:
            files[name] = content
    if not files:
        files["component.tsx" if framework == "react" else "index.html"] = code.strip()
    return files


def validate_files(files: dict[str, str], framework: str) -> list[str]:
    errors: list[str] = []
    extensions = re.compile(r"\.(tsx|jsx|css|scss|json)$", re.I) if framework == "react" else re.compile(r"\.(html|js|css|json)$", re.I)
    if "preview-data.json" not in {name.lower() for name in files}:
        errors.append("preview-data.json is mandatory")
    else:
        try:
            value = json.loads(files[next(name for name in files if name.lower() == "preview-data.json")])
            if not isinstance(value, dict):
                errors.append("preview-data.json must contain an object")
        except (ValueError, StopIteration):
            errors.append("preview-data.json is not valid JSON")
    for name, content in files.items():
        if not extensions.search(name): errors.append(f"{name} has an unsupported extension")
        if not content.strip(): errors.append(f"{name} is empty")
        if re.search(r"\.(tsx|jsx|js)$", name, re.I) and "```" in content: errors.append(f"{name} contains markdown fences")
    if framework == "react" and not any(re.search(r"\.(tsx|jsx)$", name, re.I) for name in files): errors.append("a React component file is required")
    if framework == "html" and not any(name.endswith(".html") for name in files): errors.append("an HTML entry file is required")
    if framework == "html" and not any(name.endswith(".js") for name in files): errors.append("a JavaScript behavior file is required")
    return errors


async def generate(settings: Settings, framework: str, requirement: str, component_name: str, features: list[str], emit) -> tuple[dict[str, str], int]:
    if not settings.groq_api_key:
        raise RuntimeError("Generation service is not configured")
    correction, tokens = "", 0
    async with httpx.AsyncClient(timeout=settings.generation_timeout_seconds) as client:
        for attempt in range(1, MAX_ATTEMPTS + 1):
            await emit({"type": "processing", "message": "Generating component files..." if attempt == 1 else f"Repairing generated files (attempt {attempt}/{MAX_ATTEMPTS})..."})
            response = await client.post("https://api.groq.com/openai/v1/chat/completions", headers={"Authorization": f"Bearer {settings.groq_api_key}"}, json={"model": settings.groq_model, "max_tokens": 4096, "temperature": 0.45 if attempt == 1 else 0.2, "messages": [{"role": "system", "content": "You are ComponentForge. Output only complete source files."}, {"role": "user", "content": prompt_for(framework, requirement, component_name, features) + correction}]})
            if response.status_code >= 400:
                correction = " Return the complete source-file output again."
                continue
            payload: dict[str, Any] = response.json()
            tokens += int(payload.get("usage", {}).get("total_tokens", 0))
            files = parse_generated_code(payload.get("choices", [{}])[0].get("message", {}).get("content", ""), framework)
            errors = validate_files(files, framework)
            if not errors:
                return files, tokens
            correction = f" Correct these validation errors: {'; '.join(errors)}."
    raise RuntimeError("The generated component did not pass validation")


def timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()
