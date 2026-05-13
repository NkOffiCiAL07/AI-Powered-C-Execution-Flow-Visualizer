"""AI-powered C code analysis. Uses OpenAI if available, otherwise falls back to basic analysis."""

import os
import re
import json
import logging
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

def analyze_c_code(c_code: str, trace_result: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Analyze C code and return flow, explanation, and variables."""
    api_key = os.getenv("OPENAI_API_KEY")

    if api_key:
        try:
            return _ai_analysis(c_code, trace_result, api_key)
        except Exception as e:
            logger.warning(f"OpenAI analysis failed, falling back to basic analysis: {e}")

    # Fallback: rule-based analysis
    return _basic_analysis(c_code, trace_result)


def _ai_analysis(c_code: str, trace_result: Optional[Dict[str, Any]], api_key: str) -> Dict[str, Any]:
    """Use OpenAI API for analysis."""
    from openai import OpenAI
    
    client = OpenAI(api_key=api_key)

    prompt = f"""Analyze this C code and return a JSON object with:
- "flow": array of objects with "step", "line", "description"
- "explanation": a plain-English explanation of what the code does
- "variables": array of objects with "name", "type", "description"

Code:
```c
{c_code}
```"""

    response = client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-3.5-turbo"),
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )

    content = response.choices[0].message.content
    if not content:
        raise ValueError("Received empty content from OpenAI")

    # Try to extract JSON from the response
    json_match = re.search(r'\{[\s\S]*\}', content)
    if json_match:
        try:
            return json.loads(json_match.group())
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from AI response: {e}")
            
    return {"flow": [], "explanation": content, "variables": []}


def _basic_analysis(c_code: str, trace_result: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Rule-based fallback analysis."""
    lines = c_code.splitlines()
    flow = []
    variables = []
    step = 0

    var_pattern = re.compile(r'(int|float|double|char|long|short|unsigned)\s+(\w+)')
    func_pattern = re.compile(r'(\w+)\s+(\w+)\s*\(')

    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if not stripped or stripped.startswith("//") or stripped.startswith("#"):
            continue

        var_match = var_pattern.search(stripped)
        if var_match and "(" not in stripped:
            variables.append({
                "name": var_match.group(2),
                "type": var_match.group(1),
                "description": f"Declared on line {i}",
            })

        if any(kw in stripped for kw in ["for", "while", "if", "else", "return", "printf", "cout", "="]):
            step += 1
            flow.append({"step": step, "line": i, "description": stripped[:80]})

    explanation = f"The program has {len(lines)} lines with {len(variables)} variables and {len(flow)} execution steps."

    if trace_result and trace_result.get("trace"):
        explanation += f" Traced {len(trace_result['trace'])} runtime steps."

    return {
        "flow": flow,
        "explanation": explanation,
        "variables": variables,
    }
