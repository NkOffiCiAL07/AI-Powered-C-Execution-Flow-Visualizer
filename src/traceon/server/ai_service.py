import os
import re
import json
import logging
from typing import Any, Dict
from traceon.server.models import ExplainCodeResponse, GenerateCodeResponse

logger = logging.getLogger(__name__)


def generate_code_ai(prompt: str, language: str = "cpp") -> GenerateCodeResponse:
    """Generate C, C++, Python, or Java code from a natural-language prompt using Gemini."""
    api_key = os.getenv("GEMINI_API_KEY")
    if language == "python":
        lang_label = "Python"
    elif language == "c":
        lang_label = "C"
    elif language == "java":
        lang_label = "Java"
    else:
        lang_label = "C++"

    if api_key:
        try:
            return _gemini_generate(prompt, lang_label, api_key)
        except Exception as e:
            logger.warning(f"Gemini generation failed: {e}")
            raise

    raise RuntimeError("GEMINI_API_KEY is not configured. Add it to your .env file.")


# Comment rules applied to every language — keeps generated code clean
_NO_COMMENT_RULES = (
    "- Do NOT add inline comments, block comments, or section headers (e.g. '// Step 1', '// Initialize', '// Print result').\n"
    "- Do NOT add a file-level docstring or header comment.\n"
    "- Use clear, descriptive variable and function names — they are the only documentation needed.\n"
    "- Only add a comment if a line of code would be genuinely impossible to understand without one."
)


def _gemini_generate(prompt: str, lang_label: str, api_key: str) -> GenerateCodeResponse:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)

    if lang_label == "Python":
        rules = (
            "- Return ONLY the raw source code. No markdown, no code fences, no explanation text.\n"
            "- The code must run with python3 with no errors.\n"
            "- Always include a complete, runnable script (use if __name__ == '__main__' when appropriate).\n"
            "- Keep it concise but complete.\n"
            + _NO_COMMENT_RULES
        )
    elif lang_label == "Java":
        rules = (
            "- Return ONLY the raw source code. No markdown, no code fences, no explanation text.\n"
            "- Always define a public class named Main with a public static void main(String[] args) method.\n"
            "- The code must compile with javac 11 or later with no errors.\n"
            "- Import only standard Java library classes (java.util.*, java.io.*, etc.).\n"
            "- Keep it concise but complete.\n"
            + _NO_COMMENT_RULES
        )
    else:
        compiler = "clang++ -std=c++17" if lang_label == "C++" else "clang -std=c11"
        rules = (
            "- Return ONLY the raw source code. No markdown, no code fences, no explanation text.\n"
            "- Always include the necessary #include headers.\n"
            "- Always include a complete main() function that demonstrates or tests the code.\n"
            f"- The code must compile with {compiler} with no errors or warnings.\n"
            "- Keep it concise but complete.\n"
            + _NO_COMMENT_RULES
        )

    system_prompt = f"""You are an expert {lang_label} programmer.
The user will describe a program or function they want. Write clean, correct, readable {lang_label} code that satisfies the request.
Rules:
{rules}"""

    full_prompt = f"{system_prompt}\n\nRequest: {prompt}"

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=full_prompt,
        config=types.GenerateContentConfig(
            max_output_tokens=8192,
            temperature=0.3,
        ),
    )

    code = response.text.strip()
    code = re.sub(r"^```(?:cpp|c|c\+\+|java|python)?\n?", "", code)
    code = re.sub(r"\n?```$", "", code)
    code = code.strip()

    # If the model was still cut off, continue from where it stopped
    finish_reason = None
    try:
        finish_reason = response.candidates[0].finish_reason
    except Exception:
        pass

    if finish_reason and str(finish_reason) in ("MAX_TOKENS", "FinishReason.MAX_TOKENS", "2") or _is_code_truncated(code, lang_label):
        logger.warning("Generated code appears truncated; requesting continuation.")
        continuation_prompt = (
            f"The following {lang_label} code was cut off. Continue it from exactly where it stopped "
            f"and complete it. Return ONLY the continuation — do not repeat anything already written. "
            f"No markdown fences.\n\nCut-off code:\n{code}"
        )
        cont_response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=continuation_prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=4096,
                temperature=0.1,
            ),
        )
        continuation = cont_response.text.strip()
        continuation = re.sub(r"^```(?:cpp|c|c\+\+|java|python)?\n?", "", continuation)
        continuation = re.sub(r"\n?```$", "", continuation)
        code = code + "\n" + continuation.strip()

    return GenerateCodeResponse(code=code.strip())


def _is_code_truncated(code: str, lang_label: str) -> bool:
    """Return True if the code looks syntactically incomplete (unbalanced braces)."""
    if lang_label == "Python":
        # Python: check for trailing colon without a body, or def/class with no body
        stripped = code.rstrip()
        return stripped.endswith(":") or stripped.endswith("\\")
    # C, C++, Java: open braces must match close braces
    opens = code.count("{")
    closes = code.count("}")
    return opens > closes


def optimize_code_ai(code: str, language: str = "cpp",
                     line_hits: dict = None, step_count: int = 0) -> ExplainCodeResponse:
    """Analyse code for performance bottlenecks and return human-readable optimization advice."""
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        try:
            return _gemini_optimize(code, language, api_key, line_hits or {}, step_count)
        except Exception as e:
            logger.warning(f"Gemini optimize failed: {e}")
            raise
    raise RuntimeError("GEMINI_API_KEY is not configured. Add it to your .env file.")


def _gemini_optimize(code: str, language: str, api_key: str,
                     line_hits: dict, step_count: int) -> ExplainCodeResponse:
    from google import genai
    from google.genai import types

    lang_labels = {"cpp": "C++", "c": "C", "python": "Python", "java": "Java"}
    lang_label = lang_labels.get(language, "C++")

    # Build hotspot context string
    hotspots = ""
    if line_hits:
        top = sorted(line_hits.items(), key=lambda x: -x[1])[:5]
        hotspots = "\n".join(f"  Line {ln}: executed {cnt} time(s)" for ln, cnt in top)
    elif step_count:
        hotspots = f"  Total execution steps recorded: {step_count}"
    else:
        hotspots = "  (No profiling data available — analysis based on static code review)"

    prompt = f"""You are an expert {lang_label} performance engineer.
Analyse the following {lang_label} code for performance issues and provide actionable optimization advice.

Execution hotspots from the debugger:
{hotspots}

Return a JSON object with exactly these keys — no markdown, no code fences, raw JSON only:
- "explanation": 2-3 sentences summarising the main performance characteristics and the single most impactful improvement the developer should make.
- "time_complexity": the current Big-O time complexity with a short justification.
- "space_complexity": the current Big-O space complexity with a short justification.
- "key_points": a list of exactly 4-5 concrete, actionable optimization tips (plain English — NO code blocks, NO source code). Each tip should name the specific technique (e.g. "Replace linear search with an unordered_set for O(1) lookups") and explain the expected gain.

Code to analyse:
```{language}
{code}
```"""

    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            max_output_tokens=2048,
            temperature=0.2,
        ),
    )

    content = response.text.strip()
    if content.startswith("```"):
        content = re.sub(r"^```(?:json)?\n?", "", content)
        content = re.sub(r"\n?```$", "", content)

    data = json.loads(content)
    return ExplainCodeResponse(
        explanation=data.get("explanation", ""),
        time_complexity=data.get("time_complexity", "Unknown"),
        space_complexity=data.get("space_complexity", "Unknown"),
        key_points=data.get("key_points", []),
    )


def explain_code_ai(code: str, language: str = "cpp") -> ExplainCodeResponse:
    """Analyze C, C++, or Python code and return explanation, complexities, and key points."""
    api_key = os.getenv("GEMINI_API_KEY")

    if api_key:
        try:
            return _gemini_explanation(code, api_key, language)
        except Exception as e:
            logger.warning(f"Gemini explanation failed, falling back to static analysis: {e}")

    return _static_explanation(code, language)


def _gemini_explanation(code: str, api_key: str, language: str = "cpp") -> ExplainCodeResponse:
    """Use Google Gemini API for deep code explanation."""
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)

    if language == "python":
        lang_label, fence = "Python", "python"
    elif language == "c":
        lang_label, fence = "C", "c"
    elif language == "java":
        lang_label, fence = "Java", "java"
    else:
        lang_label, fence = "C++", "cpp"

    prompt = f"""Analyze this {lang_label} code and provide a structured explanation.
Return a JSON object with exactly these keys:
- "explanation": a clear 2-3 sentence summary of what the code does and its purpose.
- "time_complexity": the Big O time complexity with a brief justification (e.g. "O(n²) — nested loops each iterate over n elements").
- "space_complexity": the Big O space complexity with a brief justification.
- "key_points": a list of 3-5 important technical observations (e.g. algorithm used, data structures, edge cases, memory management, performance characteristics).

Return ONLY the raw JSON object. Do not include markdown code fences or any other text.

Code:
```{fence}
{code}
```"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            max_output_tokens=4096,
            temperature=0.2,
        ),
    )

    content = response.text.strip()

    # Strip markdown code fences if the model adds them anyway
    if content.startswith("```"):
        content = re.sub(r"^```(?:json)?\n?", "", content)
        content = re.sub(r"\n?```$", "", content)

    try:
        data = json.loads(content)
        return ExplainCodeResponse(
            explanation=data.get("explanation", ""),
            time_complexity=data.get("time_complexity", "Unknown"),
            space_complexity=data.get("space_complexity", "Unknown"),
            key_points=data.get("key_points", []),
        )
    except (json.JSONDecodeError, KeyError) as e:
        logger.error(f"Failed to parse JSON from Gemini response: {e}\nRaw: {content[:300]}")
        raise ValueError(f"Invalid AI response format: {e}")


def _detect_nested_loops(code: str) -> bool:
    """Detect nested loops, including braceless forms like: for(...) for(...)."""
    # Pattern 1: braceless — a loop keyword immediately followed by another
    # (only whitespace/newlines/simple statements between them)
    if re.search(
        r'\b(?:for|while|do)\s*\([^)]*\)\s*\n?\s*(?:for|while|do)\s*\(',
        code
    ):
        return True
    # Pattern 2: braced — loop keyword inside a block that's itself inside a loop
    loop_re = re.compile(r'\b(?:for|while|do)\s*\(')
    loop_depths: list[int] = []
    depth = 0
    for ch in code:
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
    # Re-scan tracking position
    depth = 0
    for i, ch in enumerate(code):
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
        elif loop_re.match(code, i):
            loop_depths.append(depth)
    return len(loop_depths) >= 2 and len(set(loop_depths)) > 1


def _static_explanation(code: str, language: str = "cpp") -> ExplainCodeResponse:
    """Static analysis fallback used when no API key is configured."""
    lines = [l for l in code.splitlines() if l.strip()]

    has_loops = bool(re.search(r'\b(for|while|do)\s*[\s(]', code))
    has_nested_loops = _detect_nested_loops(code)
    has_vectors = bool(re.search(r'\bvector\s*<', code))
    has_recursion = _detect_recursion(code)
    has_pointers = bool(re.search(r'[*&]\s*\w+\s*[;,=\)]', code))
    has_classes = bool(re.search(r'\bclass\s+\w+', code))
    has_templates = bool(re.search(r'\btemplate\s*<', code))
    has_collections = bool(re.search(r'\b(ArrayList|HashMap|LinkedList|TreeMap|HashSet)\s*<', code))
    function_names = re.findall(r'\b\w+\s+(\w+)\s*\([^)]*\)\s*\{', code)

    # Complexity estimation
    if has_nested_loops:
        time_c = "O(n²) — nested loops detected"
    elif has_loops and has_recursion:
        time_c = "O(n log n) or worse — combination of loops and recursion"
    elif has_recursion:
        time_c = "O(2ⁿ) or O(n) — depends on recursion depth and branching"
    elif has_loops:
        time_c = "O(n) — single loop iterating over input"
    else:
        time_c = "O(1) — no loops or recursion detected"

    if has_recursion:
        space_c = "O(n) — recursive call stack"
    elif has_vectors:
        space_c = "O(n) — dynamic container allocation"
    else:
        space_c = "O(1) — fixed stack variables"

    # Build key points
    key_points = []
    if has_classes:
        key_points.append("Uses object-oriented design with class definitions.")
    if has_templates:
        key_points.append("Uses C++ templates for generic programming.")
    if has_recursion:
        key_points.append(f"Recursive function(s) detected: {', '.join(function_names[:3]) or 'unknown'}.")
    if has_nested_loops:
        key_points.append("Contains nested loops — watch for O(n²) or worse performance on large inputs.")
    elif has_loops:
        key_points.append("Uses iterative constructs (for/while loops).")
    if has_collections:
        key_points.append("Uses Java Collections (ArrayList/HashMap/etc.) for dynamic data storage.")
    elif has_vectors:
        key_points.append("Uses std::vector for dynamic array storage.")
    if has_pointers and language != "java":
        key_points.append("Uses pointers or references — manual memory awareness required.")
    if not key_points:
        key_points.append("Straightforward procedural logic with no complex control flow.")
    key_points.append(f"Source spans {len(lines)} non-empty lines.")

    return ExplainCodeResponse(
        explanation=_build_summary(code, has_loops, has_recursion, has_classes, function_names, language),
        time_complexity=time_c,
        space_complexity=space_c,
        key_points=key_points[:5],
    )


def _detect_recursion(code: str) -> bool:
    """Detect genuine recursive calls (function calls itself within its own body)."""
    # Extract function definitions: name + body
    func_pattern = re.compile(
        r'\b(?:int|void|bool|float|double|string|auto)\s+(\w+)\s*\([^)]*\)\s*\{',
    )
    for match in func_pattern.finditer(code):
        func_name = match.group(1)
        if func_name in ("main",):
            continue
        # Find the body of this function (simple brace counting)
        body_start = match.end()
        depth = 1
        pos = body_start
        while pos < len(code) and depth > 0:
            if code[pos] == '{':
                depth += 1
            elif code[pos] == '}':
                depth -= 1
            pos += 1
        body = code[body_start:pos - 1]
        # Check if the function calls itself inside its own body
        if re.search(r'\b' + re.escape(func_name) + r'\s*\(', body):
            return True
    return False


def _build_summary(code: str, has_loops: bool, has_recursion: bool,
                   has_classes: bool, function_names: list, language: str = "cpp") -> str:
    if language == "python":
        lang_name = "Python"
    elif language == "c":
        lang_name = "C"
    elif language == "java":
        lang_name = "Java"
    else:
        lang_name = "C++"

    parts = []
    if has_classes:
        parts.append(f"This {lang_name} program defines classes and uses object-oriented patterns.")
    elif function_names and len(function_names) > 1:
        shown = ", ".join(function_names[:3])
        parts.append(f"This {lang_name} program defines multiple functions ({shown}) to solve its task.")
    else:
        parts.append(f"This is a {lang_name} program.")

    if has_recursion:
        parts.append("It uses recursion as a core control-flow strategy.")
    elif has_loops:
        parts.append("It uses iterative loops to process data.")

    if not parts[1:]:
        parts.append("It performs a series of sequential operations.")

    return " ".join(parts)
