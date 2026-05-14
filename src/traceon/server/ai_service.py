import os
import re
import json
import logging
from typing import Any, Dict, Optional
from traceon.server.models import ExplainCodeResponse

logger = logging.getLogger(__name__)

def explain_code_ai(code: str) -> ExplainCodeResponse:
    """Analyze C++ code and return explanation, complexities, and key points."""
    api_key = os.getenv("OPENAI_API_KEY")

    if api_key:
        try:
            return _ai_explanation(code, api_key)
        except Exception as e:
            logger.warning(f"OpenAI explanation failed, falling back to basic analysis: {e}")

    # Fallback: basic analysis
    return _basic_explanation(code)


def _ai_explanation(code: str, api_key: str) -> ExplainCodeResponse:
    """Use OpenAI API for deep code explanation."""
    from openai import OpenAI
    
    client = OpenAI(api_key=api_key)

    prompt = f"""Analyze this C++ code and provide a detailed explanation.
Return a JSON object with exactly these keys:
- "explanation": a clear, high-level summary of what the code does.
- "time_complexity": the Big O time complexity with a brief justification.
- "space_complexity": the Big O space complexity with a brief justification.
- "key_points": a list of 3-5 important technical observations about the implementation (e.g. use of recursion, memory management, specific algorithms).

Code:
```cpp
{code}
```"""

    response = client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-3.5-turbo"),
        messages=[
            {"role": "system", "content": "You are an expert C++ instructor and software architect."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2,
        response_format={"type": "json_object"}
    )

    content = response.choices[0].message.content
    if not content:
        raise ValueError("Received empty content from OpenAI")

    try:
        data = json.loads(content)
        return ExplainCodeResponse(
            explanation=data.get("explanation", ""),
            time_complexity=data.get("time_complexity", "Unknown"),
            space_complexity=data.get("space_complexity", "Unknown"),
            key_points=data.get("key_points", [])
        )
    except (json.JSONDecodeError, KeyError) as e:
        logger.error(f"Failed to parse JSON from AI response: {e}")
        raise ValueError(f"Invalid AI response format: {e}")


def _basic_explanation(code: str) -> ExplainCodeResponse:
    """Rule-based fallback explanation when AI is unavailable."""
    lines = code.splitlines()
    has_loops = any("for" in line or "while" in line for line in lines)
    has_recursion = re.search(r'(\w+)\s*\(.*\)\s*\{[\s\S]*\1\s*\(', code) is not None
    
    explanation = f"This is a C++ program with {len(lines)} lines of code."
    if has_loops:
        explanation += " It contains iteration blocks (loops)."
    if has_recursion:
        explanation += " It appears to use recursion."
        
    return ExplainCodeResponse(
        explanation=explanation,
        time_complexity="O(n) - Estimated (loops detected)" if has_loops else "O(1) - Estimated",
        space_complexity="O(n) - Estimated (recursion detected)" if has_recursion else "O(1) - Estimated",
        key_points=[
            f"Code consists of {len(lines)} lines.",
            "Uses standard C++ syntax.",
            "AI features are currently disabled or unavailable."
        ]
    )
