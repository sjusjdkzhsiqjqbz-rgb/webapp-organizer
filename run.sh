#!/usr/bin/env bash
set -e

PID_FILE="/tmp/webapp.pid"
LOG_FILE="/tmp/webapp.log"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

start() {
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        echo "App is already running (PID $(cat "$PID_FILE"))"
        exit 1
    fi
    echo "Starting app..."
    cd "$PROJECT_DIR"
    nohup npm run dev > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    echo "App started (PID $!)"
    echo "  Frontend: http://localhost:5173/"
    echo "  Backend:  http://localhost:3001"
    echo "  Logs:     $LOG_FILE"
}

stop() {
    if [ ! -f "$PID_FILE" ]; then
        echo "No PID file found. App is not running."
        exit 1
    fi
    PID=$(cat "$PID_FILE")
    if ! kill -0 "$PID" 2>/dev/null; then
        echo "Process $PID is not running. Removing stale PID file."
        rm -f "$PID_FILE"
        exit 1
    fi

    echo "Stopping app..."
    kill "$PID" 2>/dev/null || true
    sleep 1

    # Kill child processes (ts-node, vite)
    pkill -P "$PID" 2>/dev/null || true

    # Wait for processes to die gracefully
    for i in {1..5}; do
        if ! kill -0 "$PID" 2>/dev/null; then
            break
        fi
        sleep 1
    done

    # Force kill if still alive
    if kill -0 "$PID" 2>/dev/null; then
        echo "Force killing..."
        kill -9 "$PID" 2>/dev/null || true
        pkill -9 -P "$PID" 2>/dev/null || true
    fi

    rm -f "$PID_FILE"
    echo "App stopped."
}

restart() {
    if [ -f "$PID_FILE" ]; then
        stop
        sleep 1
    fi
    start
}

status() {
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        echo "App is running (PID $(cat "$PID_FILE"))"
        echo "  Frontend: http://localhost:5173/"
        echo "  Backend:  http://localhost:3001"
    else
        echo "App is not running."
        [ -f "$PID_FILE" ] && rm -f "$PID_FILE"
    fi
}

case "${1:-}" in
    start)    start ;;
    stop)     stop ;;
    restart)  restart ;;
    status)   status ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
