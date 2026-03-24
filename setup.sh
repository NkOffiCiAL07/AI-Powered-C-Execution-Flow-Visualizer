#!/bin/bash

# C Execution Flow Visualizer - Full Stack Setup and Start Script

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "🚀 C Execution Flow Visualizer - Full Stack Setup"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if venv exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating Python virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate venv
echo -e "${BLUE}Activating Python virtual environment...${NC}"
source venv/bin/activate

# Install Python dependencies if needed
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo -e "${YELLOW}Installing Python dependencies...${NC}"
    pip install -r requirements.txt > /dev/null
fi

echo -e "${GREEN}✓ Backend ready${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js not found. Please install Node.js 16+${NC}"
    echo "  macOS: brew install node"
    echo "  Ubuntu: apt-get install nodejs npm"
    exit 1
fi

# Check npm packages
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd frontend
    npm install > /dev/null 2>&1
    cd "$PROJECT_DIR"
fi

echo -e "${GREEN}✓ Frontend ready${NC}"
echo ""

echo "=================================================="
echo -e "${GREEN}Everything is ready!${NC}"
echo ""
echo "To start the full stack, run:"
echo "  1. In terminal 1: npm run dev:backend"
echo "  2. In terminal 2: npm run dev:frontend"
echo ""
echo "Or run both together:"
echo "  npm run dev"
echo ""
echo "Frontend will open at: ${BLUE}http://localhost:3000${NC}"
echo "Backend API at: ${BLUE}http://localhost:8000${NC}"
