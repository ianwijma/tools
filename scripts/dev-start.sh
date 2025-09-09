#!/bin/bash

# Development Server Start Script with Logging
# This script starts the Next.js development server and logs all output to a file

set -e

# Configuration
LOG_DIR="./logs"
LOG_FILE="$LOG_DIR/dev-server.log"
PID_FILE="$LOG_DIR/dev-server.pid"
PORT=3000

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to cleanup on exit
cleanup() {
    log "🛑 Development server stopped"
    if [ -f "$PID_FILE" ]; then
        rm -f "$PID_FILE"
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if server is already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        log "⚠️  Development server is already running (PID: $PID)"
        log "💡 Use './scripts/dev-stop.sh' to stop it first"
        exit 1
    else
        log "🧹 Cleaning up stale PID file"
        rm -f "$PID_FILE"
    fi
fi

# Check if port is in use
if lsof -ti:$PORT > /dev/null 2>&1; then
    log "⚠️  Port $PORT is already in use"
    log "💡 Use './scripts/dev-stop.sh' to stop the existing server"
    exit 1
fi

log "🚀 Starting Next.js development server..."
log "📝 Logs will be written to: $LOG_FILE"
log "🌐 Server will be available at: http://localhost:$PORT"
log "📊 Use './scripts/dev-logs.sh' to follow logs in real-time"
log "🛑 Use './scripts/dev-stop.sh' to stop the server"
log ""

# Start the development server in background
npm run dev > "$LOG_FILE" 2>&1 &
SERVER_PID=$!

# Save PID to file
echo "$SERVER_PID" > "$PID_FILE"

log "✅ Development server started (PID: $SERVER_PID)"
log "📁 PID saved to: $PID_FILE"

# Wait for server to be ready
log "⏳ Waiting for server to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:$PORT > /dev/null 2>&1; then
        log "🎉 Server is ready and responding!"
        break
    fi
    if [ $i -eq 30 ]; then
        log "❌ Server failed to start within 30 seconds"
        cleanup
        exit 1
    fi
    sleep 1
done

log ""
log "🎯 Development server is running successfully!"
log "📖 To view logs: tail -f $LOG_FILE"
log "🛑 To stop server: ./scripts/dev-stop.sh"
log ""

# Keep script running to maintain the server
wait $SERVER_PID
