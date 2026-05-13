import os
import logging
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from dotenv import load_dotenv
from services.ai_service import analyze_c_code
from services.compiler_service import compile_and_trace

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

load_dotenv()

app = Flask(__name__)
CORS(app)


@app.route("/api/health", methods=["GET"])
def health() -> Response:
    """Health check endpoint."""
    return jsonify({"status": "ok"})


@app.route("/api/analyze", methods=["POST"])
def analyze() -> tuple[Response, int]:
    """Receive C code, compile it, trace execution, and return AI-powered flow analysis."""
    data = request.get_json()
    if not data or "code" not in data:
        return jsonify({"error": "No C code provided"}), 400

    c_code = data.get("code")
    if not isinstance(c_code, str) or not c_code.strip():
        return jsonify({"error": "Invalid or empty C code provided"}), 400

    user_input = data.get("input", "")

    try:
        # Step 1: Compile and trace execution
        trace_result = compile_and_trace(c_code, user_input)
        if trace_result.get("error"):
            logger.error(f"Compilation/execution error: {trace_result['error']}")
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
        }), 200
    except Exception as e:
        logger.exception("An error occurred during analysis.")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500


@app.route("/api/quick-analyze", methods=["POST"])
def quick_analyze() -> tuple[Response, int]:
    """AI-only analysis without compilation (for environments without gcc)."""
    data = request.get_json()
    if not data or "code" not in data:
        return jsonify({"error": "No C code provided"}), 400

    c_code = data.get("code")
    if not isinstance(c_code, str) or not c_code.strip():
        return jsonify({"error": "Invalid or empty C code provided"}), 400

    try:
        ai_analysis = analyze_c_code(c_code, trace_result=None)
        return jsonify({
            "success": True,
            "flow": ai_analysis.get("flow", []),
            "explanation": ai_analysis.get("explanation", ""),
            "variables": ai_analysis.get("variables", []),
        }), 200
    except Exception as e:
        logger.exception("An error occurred during quick analysis.")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500


if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5000))
    debug_mode = os.getenv("FLASK_ENV") == "development"
    app.run(debug=debug_mode, port=port)
