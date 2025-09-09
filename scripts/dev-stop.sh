#!/bin/bash

# Development Server Stop Script
# This script stops the Next.js development server and cleans up

set -e

# Configuration
LOG_DIR="./logs"
LOG_FILE="$LOG_DIR/dev-server.log"
PID_FILE="$LOG_DIR/dev-server.pid"
PORT=3000

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "🛑 Stopping development server..."

# Method 1: Try to stop using PID file
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    log "📁 Found PID file with PID: $PID"
    
    if ps -p "$PID" > /dev/null 2>&1; then
        log "🔍 Process $PID is running, attempting to stop..."
        kill "$PID" 2>/dev/null || true
        
        # Wait for graceful shutdown
        for i in {1..10}; do
            if ! ps -p "$PID" > /dev/null 2>&1; then
                log "✅ Process $PID stopped gracefully"
                break
            fi
            sleep 1
        done
        
        # Force kill if still running
        if ps -p "$PID" > /dev/null 2>&1; then
            log "⚠️  Process still running, force killing..."
            kill -9 "$PID" 2>/dev/null || true
            sleep 1
        fi
    else
        log "⚠️  Process $PID is not running"
    fi
    
    # Clean up PID file
    rm -f "$PID_FILE"
    log "🧹 Cleaned up PID file"
else
    log "📁 No PID file found"
fi

# Method 2: Kill any remaining Next.js dev processes
log "🔍 Checking for any remaining Next.js dev processes..."
if pgrep -f "next dev" > /dev/null; then
    log "⚠️  Found remaining Next.js dev processes, stopping them..."
    pkill -f "next dev" || true
    sleep 2
else
    log "✅ No remaining Next.js dev processes found"
fi

# Method 3: Check and kill processes on port 3000
log "🔍 Checking for processes on port $PORT..."
if lsof -ti:$PORT > /dev/null 2>&1; then
    PIDS=$(lsof -ti:$PORT)
    log "⚠️  Found processes on port $PORT: $PIDS"
    for pid in $PIDS; do
        log "🛑 Killing process $pid on port $PORT..."
        kill "$pid" 2>/dev/null || true
    done
    sleep 2
    
    # Force kill if still running
    if lsof -ti:$PORT > /dev/null 2>&1; then
        PIDS=$(lsof -ti:$PORT)
        log "⚠️  Force killing remaining processes on port $PORT: $PIDS"
        for pid in $PIDS; do
            kill -9 "$pid" 2>/dev/null || true
        done
    fi
else
    log "✅ Port $PORT is free"
fi

# Final verification
sleep 1
if lsof -ti:$PORT > /dev/null 2>&1; then
    log "❌ Port $PORT is still in use"
    exit 1
else
    log "✅ Development server stopped successfully"
    log "🧹 Port $PORT is now free"
fi

log "🎯 All cleanup completed!"
