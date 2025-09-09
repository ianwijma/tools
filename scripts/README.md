# Development Server Management Scripts

This directory contains scripts to manage the Next.js development server with proper logging and monitoring capabilities.

## Scripts Overview

### 🚀 `dev-start.sh`
Starts the development server with comprehensive logging.

**Features:**
- Logs all output to `./logs/dev-server.log`
- Saves process ID for easy management
- Waits for server to be ready before completing
- Prevents multiple instances from running
- Provides clear status messages

**Usage:**
```bash
./scripts/dev-start.sh
# or
npm run dev:start
```

### 🛑 `dev-stop.sh`
Stops the development server and cleans up resources.

**Features:**
- Graceful shutdown with fallback to force kill
- Cleans up PID files
- Kills processes on port 3000
- Comprehensive cleanup verification

**Usage:**
```bash
./scripts/dev-stop.sh
# or
npm run dev:stop
```

### 📖 `dev-logs.sh`
Views development server logs.

**Features:**
- Real-time log following
- Configurable tail length
- Timestamped log entries
- Helpful usage information

**Usage:**
```bash
# Follow logs in real-time
./scripts/dev-logs.sh
./scripts/dev-logs.sh -f

# Show last 50 lines (default)
./scripts/dev-logs.sh -t 50

# Show last 100 lines
./scripts/dev-logs.sh --tail 100
```

### 🔍 `dev-status.sh`
Checks the current status of the development server.

**Features:**
- Process status verification
- Port usage checking
- Log file information
- Server response testing
- Comprehensive status report

**Usage:**
```bash
./scripts/dev-status.sh
# or
npm run dev:status
```

## NPM Scripts

The following npm scripts are available for easy access:

```bash
npm run dev:start    # Start server with logging
npm run dev:stop     # Stop server
npm run dev:logs     # View logs
npm run dev:status   # Check status
```

## Log Files

- **Location:** `./logs/dev-server.log`
- **Format:** Timestamped entries with server output
- **Rotation:** Manual (clear logs by deleting the file)

## AI Usage

These scripts are designed to be AI-friendly:

1. **Structured Output:** All scripts provide clear, parseable output
2. **Logging:** Comprehensive logging for debugging and monitoring
3. **Status Codes:** Proper exit codes for automation
4. **Error Handling:** Graceful error handling with informative messages

### Example AI Workflow

```bash
# Start server and monitor
npm run dev:start

# In another terminal, check status
npm run dev:status

# View logs for debugging
npm run dev:logs -t 20

# Stop server when done
npm run dev:stop
```

## Troubleshooting

### Port Already in Use
```bash
# Check what's using port 3000
lsof -i:3000

# Stop all Next.js processes
npm run dev:stop
```

### Stale PID Files
```bash
# Remove stale PID file
rm -f ./logs/dev-server.pid
```

### Permission Issues
```bash
# Make scripts executable
chmod +x scripts/*.sh
```

## File Structure

```
scripts/
├── README.md           # This file
├── dev-start.sh        # Start server script
├── dev-stop.sh         # Stop server script
├── dev-logs.sh         # View logs script
└── dev-status.sh       # Status check script

logs/
└── dev-server.log      # Server logs (created when server starts)
```
