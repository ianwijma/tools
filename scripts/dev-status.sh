#!/bin/bash

# Development Server Status Script
# This script checks the status of the development server

set -e

# Configuration
LOG_DIR="./logs"
LOG_FILE="$LOG_DIR/dev-server.log"
PID_FILE="$LOG_DIR/dev-server.pid"
PORT=3000

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

echo "🔍 Development Server Status Check"
echo "=================================="
echo ""

# Check PID file
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    echo "📁 PID file found: $PID"
    
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "✅ Process $PID is running"
        
        # Get process info
        echo "📊 Process info:"
        ps -p "$PID" -o pid,ppid,cmd,etime,pcpu,pmem
    else
        echo "❌ Process $PID is not running (stale PID file)"
    fi
else
    echo "📁 No PID file found"
fi

echo ""

# Check port usage
echo "🌐 Port $PORT status:"
if lsof -ti:$PORT > /dev/null 2>&1; then
    PIDS=$(lsof -ti:$PORT)
    echo "✅ Port $PORT is in use by processes: $PIDS"
    
    # Get detailed port info
    echo "📊 Port details:"
    lsof -i:$PORT
else
    echo "❌ Port $PORT is free"
fi

echo ""

# Check for Next.js dev processes
echo "🔍 Next.js dev processes:"
if pgrep -f "next dev" > /dev/null; then
    echo "✅ Found Next.js dev processes:"
    pgrep -f "next dev" | while read pid; do
        echo "  - PID: $pid"
        ps -p "$pid" -o pid,ppid,cmd,etime
    done
else
    echo "❌ No Next.js dev processes found"
fi

echo ""

# Check log file
if [ -f "$LOG_FILE" ]; then
    echo "📝 Log file status:"
    echo "  - File: $LOG_FILE"
    echo "  - Size: $(du -h "$LOG_FILE" | cut -f1)"
    echo "  - Last modified: $(stat -c %y "$LOG_FILE")"
    
    if [ -s "$LOG_FILE" ]; then
        echo "  - Last 3 lines:"
        tail -n 3 "$LOG_FILE" | sed 's/^/    /'
    else
        echo "  - File is empty"
    fi
else
    echo "📝 No log file found"
fi

echo ""

# Test server response
echo "🌐 Server response test:"
if curl -s http://localhost:$PORT > /dev/null 2>&1; then
    echo "✅ Server is responding at http://localhost:$PORT"
    
    # Get response time
    RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" http://localhost:$PORT)
    echo "⏱️  Response time: ${RESPONSE_TIME}s"
else
    echo "❌ Server is not responding at http://localhost:$PORT"
fi

echo ""
echo "🎯 Status check completed!"
