#!/bin/bash

# Development Server Logs Viewer
# This script displays the development server logs in real-time

set -e

# Configuration
LOG_DIR="./logs"
LOG_FILE="$LOG_DIR/dev-server.log"

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -f, --follow    Follow logs in real-time (default)"
    echo "  -t, --tail N    Show last N lines (default: 50)"
    echo "  -h, --help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Follow logs in real-time"
    echo "  $0 -t 100            # Show last 100 lines"
    echo "  $0 --tail 20         # Show last 20 lines"
}

# Default values
FOLLOW=true
TAIL_LINES=50

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--follow)
            FOLLOW=true
            shift
            ;;
        -t|--tail)
            FOLLOW=false
            TAIL_LINES="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Check if log file exists
if [ ! -f "$LOG_FILE" ]; then
    echo "❌ Log file not found: $LOG_FILE"
    echo "💡 Start the development server first with: ./scripts/dev-start.sh"
    exit 1
fi

# Check if log file has content
if [ ! -s "$LOG_FILE" ]; then
    echo "📝 Log file is empty: $LOG_FILE"
    echo "💡 Start the development server first with: ./scripts/dev-start.sh"
    exit 1
fi

echo "📖 Development Server Logs"
echo "📁 Log file: $LOG_FILE"
echo ""

if [ "$FOLLOW" = true ]; then
    echo "🔄 Following logs in real-time (Ctrl+C to exit)..."
    echo ""
    tail -f "$LOG_FILE"
else
    echo "📄 Last $TAIL_LINES lines:"
    echo ""
    tail -n "$TAIL_LINES" "$LOG_FILE"
fi
