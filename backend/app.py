import os
import subprocess
import tempfile
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from services.ai_service import analyze_c_code
from services.compiler_service import compile_and_trace

load_dotenv()

app = Flask(__name__)
CORS(app)


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/api/analyze", methods=["POST"])
def analyze():
    """Receive C code, compile it, trace execution, and return AI-powered flow analysis."""
    data = request.get_json()
    if not data or "code" not in data:
        return jsonify({"error": "No C code provided"}), 400

    c_code = data["code"]
    user_input = data.get("input", "")

    try:
        # Step 1: Compile and trace execution
        trace_result = compile_and_trace(c_code, user_input)
        if trace_result.get("error"):
            return jsonify({"error": trace_result["error"], "phase": "compilation"}), 400

        # Step 2: AI-powered analysis
        ai_analysis = analyze_c_code(c_code, trace_result)

        return jsonify({
            "success": True,
            "output": trace_result.get("output", ""),
            "trace": trace_result.get("trace", []),
            "flow": ai_analysis.get("flow", []),
            "explanation": ai_analysis.get("explanation", ""),
            "variables": ai_analysis.get("variables", []),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/quick-analyze", methods=["POST"])
def quick_analyze():
    """AI-only analysis without compilation (for environments without gcc)."""
    data = request.get_json()
    if not data or "code" not in data:
        return jsonify({"error": "No C code provided"}), 400

    c_code = data["code"]

    try:
        ai_analysis = analyze_c_code(c_code, trace_result=None)
        return jsonify({
            "success": True,
            "flow": ai_analysis.get("flow", []),
            "explanation": ai_analysis.get("explanation", ""),
            "variables": ai_analysis.get("variables", []),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5000))
    app.run(debug=os.getenv("FLASK_ENV") == "development", port=port)
