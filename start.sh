#!/bin/bash
cd "$(dirname "$0")"
echo ""
echo "  ██████╗ ███████╗██╗   ██╗"
echo "  ██╔══██╗██╔════╝██║   ██║"
echo "  ██████╔╝█████╗  ██║   ██║"
echo "  ██╔══██╗██╔══╝  ╚██╗ ██╔╝"
echo "  ██║  ██║███████╗ ╚████╔╝ "
echo "  ╚═╝  ╚═╝╚══════╝  ╚═══╝  "
echo ""
echo "  REV Fire & Security Solutions"
echo "  ─────────────────────────────"
echo "  Starting local server..."
echo ""

PORT=8080

if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    PORT=3000
fi

if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    PORT=5500
fi

echo "  Server: http://localhost:$PORT"
echo "  Press Ctrl+C to stop."
echo ""

open "http://localhost:$PORT" 2>/dev/null &

if command -v python3 &>/dev/null; then
    python3 -m http.server $PORT
elif command -v python &>/dev/null; then
    python -m SimpleHTTPServer $PORT
elif command -v npx &>/dev/null; then
    npx --yes serve . -p $PORT
else
    echo "  ERROR: No server available. Install Python 3 or Node.js."
    exit 1
fi
