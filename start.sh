#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Phronesis (φρόνησις) - Orchestration & Startup Engine
# Question the decision. Examine the mind.
# ─────────────────────────────────────────────────────────────────────────────

set -eo pipefail

# Script location & Workspace directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$SCRIPT_DIR"

# ──────────────────────────────────────────────
# 1. Colors & Terminal Styling
# ──────────────────────────────────────────────
if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
    BOLD="\033[1m"
    DIM="\033[2m"
    CYAN="\033[0;36m"
    GREEN="\033[0;32m"
    YELLOW="\033[0;33m"
    RED="\033[0;31m"
    PURPLE="\033[0;35m"
    BLUE="\033[0;34m"
    RESET="\033[0m"
else
    BOLD=""
    DIM=""
    CYAN=""
    GREEN=""
    YELLOW=""
    RED=""
    PURPLE=""
    BLUE=""
    RESET=""
fi

ICON_SUCCESS="${GREEN}✓${RESET}"
ICON_ERROR="${RED}✖${RESET}"
ICON_WARN="${YELLOW}⚠${RESET}"
ICON_INFO="${CYAN}ℹ${RESET}"
ICON_ROCKET="${PURPLE}🚀${RESET}"
ICON_GEAR="${CYAN}⚙${RESET}"

# ──────────────────────────────────────────────
# 2. Defaults & Config
# ──────────────────────────────────────────────
PORT_BACKEND="${PORT_BACKEND:-8010}"
PORT_FRONTEND="${PORT_FRONTEND:-5180}"
HOST="${HOST:-0.0.0.0}"

START_BACKEND=true
START_FRONTEND=true
FORCE_INSTALL=false
MOCK_MODE=false
DOCTOR_MODE=false
OPEN_BROWSER=false
PROD_MODE=false

BACKEND_PID=""
FRONTEND_PID=""
CLEANED_UP=false

# ──────────────────────────────────────────────
# 3. Helper Functions & UI
# ──────────────────────────────────────────────
print_banner() {
    echo -e "${CYAN}${BOLD}"
    echo "  ╔═══════════════════════════════════════════════════════════╗"
    echo "  ║                  PHRONESIS (φρόνησις)                    ║"
    echo "  ║         Question the decision. Examine the mind.          ║"
    echo "  ╚═══════════════════════════════════════════════════════════╝"
    echo -e "${RESET}"
}

print_help() {
    print_banner
    echo -e "${BOLD}USAGE:${RESET}"
    echo -e "  ./start.sh [OPTIONS]\n"
    echo -e "${BOLD}OPTIONS:${RESET}"
    echo -e "  ${GREEN}-b, --backend-only${RESET}       Start only the FastAPI backend server (port ${PORT_BACKEND})"
    echo -e "  ${GREEN}-f, --frontend-only${RESET}      Start only the Vite frontend dev server (port ${PORT_FRONTEND})"
    echo -e "  ${GREEN}-m, --mock${RESET}               Enable mock LLM provider mode (zero-key offline testing)"
    echo -e "  ${GREEN}-i, --install${RESET}            Force clean install/update of Python & Node dependencies"
    echo -e "  ${GREEN}-d, --doctor${RESET}             Run diagnostic pre-flight checks without starting servers"
    echo -e "  ${GREEN}-o, --open${RESET}               Automatically open the browser once services are healthy"
    echo -e "  ${GREEN}-p, --prod${RESET}               Start in production mode (no auto-reload)"
    echo -e "  ${GREEN}--port-backend <port>${RESET}    Specify custom backend port (default: 8010)"
    echo -e "  ${GREEN}--port-frontend <port>${RESET}   Specify custom frontend port (default: 5180)"
    echo -e "  ${GREEN}--host <host>${RESET}            Specify host binding (default: 0.0.0.0)"
    echo -e "  ${GREEN}-h, --help${RESET}               Display this help message and exit\n"
    echo -e "${BOLD}EXAMPLES:${RESET}"
    echo -e "  ./start.sh                    # Start both backend & frontend"
    echo -e "  ./start.sh --mock             # Start in offline mode with mock LLM"
    echo -e "  ./start.sh -b                 # Start backend only"
    echo -e "  ./start.sh --install          # Reinstall virtualenv & node_modules"
    echo -e "  ./start.sh --doctor           # Run system & configuration diagnostics\n"
}

log_info() {
    echo -e " ${ICON_INFO}  $1"
}

log_success() {
    echo -e " ${ICON_SUCCESS}  $1"
}

log_warn() {
    echo -e " ${ICON_WARN}  ${YELLOW}$1${RESET}"
}

log_error() {
    echo -e " ${ICON_ERROR}  ${RED}$1${RESET}"
}

# ──────────────────────────────────────────────
# 4. CLI Argument Parsing
# ──────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
    case "$1" in
        -b|--backend-only)
            START_BACKEND=true
            START_FRONTEND=false
            shift
            ;;
        -f|--frontend-only)
            START_BACKEND=false
            START_FRONTEND=true
            shift
            ;;
        -m|--mock)
            MOCK_MODE=true
            shift
            ;;
        -i|--install)
            FORCE_INSTALL=true
            shift
            ;;
        -d|--doctor|--check)
            DOCTOR_MODE=true
            shift
            ;;
        -o|--open)
            OPEN_BROWSER=true
            shift
            ;;
        -p|--prod)
            PROD_MODE=true
            shift
            ;;
        --port-backend)
            PORT_BACKEND="$2"
            shift 2
            ;;
        --port-frontend)
            PORT_FRONTEND="$2"
            shift 2
            ;;
        --host)
            HOST="$2"
            shift 2
            ;;
        -h|--help)
            print_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            echo -e "Run ${BOLD}./start.sh --help${RESET} to see available options."
            exit 1
            ;;
    esac
done

# ──────────────────────────────────────────────
# 5. Process & Port Management
# ──────────────────────────────────────────────
free_port() {
    local port="$1"
    local pids=""

    if command -v lsof >/dev/null 2>&1; then
        pids=$(lsof -ti:"$port" 2>/dev/null || true)
    elif command -v fuser >/dev/null 2>&1; then
        pids=$(fuser "$port"/tcp 2>/dev/null || true)
    fi

    if [ -n "$pids" ]; then
        log_warn "Port $port is currently in use by PID(s): $pids. Cleaning up..."
        for pid in $pids; do
            kill -15 "$pid" 2>/dev/null || true
        done
        
        # Grace period for graceful shutdown
        local count=0
        while [ $count -lt 5 ]; do
            if command -v lsof >/dev/null 2>&1; then
                pids=$(lsof -ti:"$port" 2>/dev/null || true)
            else
                pids=""
            fi
            if [ -z "$pids" ]; then
                break
            fi
            sleep 0.3
            count=$((count + 1))
        done

        # Force kill if still lingering
        if [ -n "$pids" ]; then
            for pid in $pids; do
                kill -9 "$pid" 2>/dev/null || true
            done
        fi
        log_success "Port $port cleared."
    fi
}

cleanup() {
    if [ "$CLEANED_UP" = true ]; then
        return
    fi
    CLEANED_UP=true

    if [ -n "$BACKEND_PID" ] || [ -n "$FRONTEND_PID" ]; then
        echo ""
        log_info "Shutting down Phronesis servers..."

        if [ -n "$BACKEND_PID" ]; then
            kill -15 "$BACKEND_PID" 2>/dev/null || true
        fi
        if [ -n "$FRONTEND_PID" ]; then
            kill -15 "$FRONTEND_PID" 2>/dev/null || true
        fi

        # Small wait for child processes
        sleep 0.5

        # Ensure ports are clean
        if [ "$START_BACKEND" = true ]; then
            free_port "$PORT_BACKEND" >/dev/null 2>&1 || true
        fi
        if [ "$START_FRONTEND" = true ]; then
            free_port "$PORT_FRONTEND" >/dev/null 2>&1 || true
        fi

        log_success "All Phronesis services stopped cleanly. Farewell."
    fi
    exit 0
}

trap cleanup SIGINT SIGTERM SIGHUP EXIT

# ──────────────────────────────────────────────
# 6. Pre-flight Checks & Dependency Manager
# ──────────────────────────────────────────────
check_prerequisites() {
    echo -e "${BOLD}${CYAN}► Pre-flight Diagnostics & Environment Verification${RESET}\n"
    local all_passed=true

    # 1. Python 3 Check (Requires >= 3.10)
    if command -v python3 >/dev/null 2>&1; then
        local py_version
        py_version=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}')")
        local py_valid
        py_valid=$(python3 -c "import sys; print(1 if sys.version_info >= (3, 10) else 0)")
        if [ "$py_valid" -eq 1 ]; then
            log_success "Python version: ${BOLD}$py_version${RESET} (meets >= 3.10 requirement)"
        else
            log_error "Python version $py_version is below recommended 3.10+"
            all_passed=false
        fi
    else
        log_error "Python 3 is not installed or not in PATH."
        all_passed=false
    fi

    # 2. Node.js & npm Check (Requires Node >= 18)
    if command -v node >/dev/null 2>&1; then
        local node_version
        node_version=$(node -v | tr -d 'v')
        local node_major
        node_major=$(echo "$node_version" | cut -d. -f1)
        if [ "$node_major" -ge 18 ]; then
            log_success "Node.js version: ${BOLD}v$node_version${RESET} (meets >= 18 requirement)"
        else
            log_warn "Node.js version v$node_version is below recommended 18+"
        fi
    else
        log_error "Node.js is not installed or not in PATH."
        all_passed=false
    fi

    if command -v npm >/dev/null 2>&1; then
        local npm_version
        npm_version=$(npm -v)
        log_success "npm package manager: ${BOLD}v$npm_version${RESET}"
    else
        log_error "npm is not installed or not in PATH."
        all_passed=false
    fi

    # 3. Environment (.env) Configuration
    if [ ! -f "$SCRIPT_DIR/backend/.env" ]; then
        if [ -f "$SCRIPT_DIR/backend/.env.example" ]; then
            log_warn "backend/.env not found. Auto-scaffolding from .env.example..."
            cp "$SCRIPT_DIR/backend/.env.example" "$SCRIPT_DIR/backend/.env"
            log_success "Created backend/.env (configured with default settings)"
        else
            log_warn "No backend/.env or .env.example found."
        fi
    else
        log_success "Environment file detected at ${BOLD}backend/.env${RESET}"
    fi

    # Read active LLM configuration for status banner
    local active_provider="unknown"
    if [ -f "$SCRIPT_DIR/backend/.env" ]; then
        active_provider=$(grep -E "^LLM_PROVIDER=" "$SCRIPT_DIR/backend/.env" | cut -d= -f2 | tr -d ' "\r\n' || echo "gemini")
    fi
    if [ "$MOCK_MODE" = true ]; then
        active_provider="mock (flag override)"
    fi
    log_info "Active LLM Provider: ${BOLD}${active_provider}${RESET}"

    # If doctor mode only, summarize and exit
    if [ "$DOCTOR_MODE" = true ]; then
        echo ""
        if [ "$all_passed" = true ]; then
            log_success "${BOLD}All system pre-flight checks PASSED!${RESET}"
            exit 0
        else
            log_error "${BOLD}Some pre-flight checks failed. Please review errors above.${RESET}"
            exit 1
        fi
    fi

    if [ "$all_passed" = false ]; then
        log_error "Cannot continue due to missing prerequisites. Please install required dependencies."
        exit 1
    fi

    # 4. Backend Virtualenv & Dependencies
    if [ "$START_BACKEND" = true ]; then
        echo ""
        cd "$SCRIPT_DIR/backend"
        if [ ! -d "venv" ] || [ "$FORCE_INSTALL" = true ]; then
            log_info "Setting up Python virtual environment in backend/venv..."
            python3 -m venv venv
            log_info "Installing backend dependencies from requirements.txt..."
            ./venv/bin/pip install --upgrade pip >/dev/null 2>&1 || true
            ./venv/bin/pip install -r requirements.txt
            log_success "Backend dependencies installed successfully."
        elif [ "requirements.txt" -nt "venv" ]; then
            log_info "requirements.txt has changed. Updating backend virtualenv packages..."
            ./venv/bin/pip install -r requirements.txt
            touch venv
            log_success "Backend dependencies synchronized."
        else
            log_success "Backend Python virtual environment is ready."
        fi
    fi

    # 5. Frontend Node Modules & Dependencies
    if [ "$START_FRONTEND" = true ]; then
        cd "$SCRIPT_DIR/frontend"
        if [ ! -d "node_modules" ] || [ "$FORCE_INSTALL" = true ]; then
            log_info "Installing frontend dependencies with npm install..."
            npm install
            log_success "Frontend packages installed successfully."
        elif [ "package.json" -nt "node_modules" ]; then
            log_info "package.json has changed. Updating frontend dependencies..."
            npm install
            touch node_modules
            log_success "Frontend dependencies synchronized."
        else
            log_success "Frontend node_modules is ready."
        fi
    fi

    cd "$SCRIPT_DIR"
    echo ""
}

# ──────────────────────────────────────────────
# 7. Service Launchers & Health Checking
# ──────────────────────────────────────────────
wait_for_health() {
    local url="$1"
    local service_name="$2"
    local pid="$3"
    local max_retries=30
    local count=0

    echo -ne " ${ICON_GEAR}  Waiting for ${BOLD}$service_name${RESET} to become ready..."

    while [ $count -lt $max_retries ]; do
        # Check if the process unexpectedly exited
        if [ -n "$pid" ] && ! kill -0 "$pid" 2>/dev/null; then
            echo ""
            log_error "$service_name (PID $pid) terminated unexpectedly during startup!"
            return 1
        fi

        # Probe health endpoint
        if command -v curl >/dev/null 2>&1; then
            if curl -s -f -o /dev/null "$url" 2>/dev/null; then
                echo -e "\r ${ICON_SUCCESS}  ${BOLD}$service_name${RESET} is ready and responsive!     "
                return 0
            fi
        else
            # Python fallback if curl is not installed
            if python3 -c "import urllib.request; urllib.request.urlopen('$url', timeout=1)" >/dev/null 2>&1; then
                echo -e "\r ${ICON_SUCCESS}  ${BOLD}$service_name${RESET} is ready and responsive!     "
                return 0
            fi
        fi

        sleep 0.5
        count=$((count + 1))
        echo -ne "."
    done

    echo ""
    log_warn "Timeout reached waiting for $service_name ($url)."
    return 0
}

# ──────────────────────────────────────────────
# 8. Main Execution Flow
# ──────────────────────────────────────────────
print_banner
check_prerequisites

# Free occupied ports before binding
if [ "$START_BACKEND" = true ]; then
    free_port "$PORT_BACKEND"
fi
if [ "$START_FRONTEND" = true ]; then
    free_port "$PORT_FRONTEND"
fi

# Launch FastAPI Backend
if [ "$START_BACKEND" = true ]; then
    cd "$SCRIPT_DIR/backend"
    log_info "Launching FastAPI Backend on ${BOLD}http://${HOST}:${PORT_BACKEND}${RESET}..."

    # Setup environment variables
    if [ "$MOCK_MODE" = true ]; then
        export LLM_PROVIDER="mock"
        log_info "Running in ${BOLD}MOCK LLM${RESET} mode for offline operation."
    fi

    RELOAD_ARGS="--reload"
    if [ "$PROD_MODE" = true ]; then
        RELOAD_ARGS=""
    fi

    ./venv/bin/uvicorn app.main:app \
        --host "$HOST" \
        --port "$PORT_BACKEND" \
        $RELOAD_ARGS &
    BACKEND_PID=$!

    # Wait for backend health
    wait_for_health "http://127.0.0.1:${PORT_BACKEND}/health" "FastAPI Backend" "$BACKEND_PID"
fi

# Launch Vite Frontend
if [ "$START_FRONTEND" = true ]; then
    cd "$SCRIPT_DIR/frontend"
    log_info "Launching Vite Frontend on ${BOLD}http://${HOST}:${PORT_FRONTEND}${RESET}..."

    export VITE_BACKEND_URL="http://127.0.0.1:${PORT_BACKEND}"
    if [ "$PROD_MODE" = true ]; then
        npm run build
        npx vite preview --host "$HOST" --port "$PORT_FRONTEND" &
    else
        npx vite --host "$HOST" --port "$PORT_FRONTEND" &
    fi
    FRONTEND_PID=$!

    # Wait for frontend readiness
    wait_for_health "http://127.0.0.1:${PORT_FRONTEND}" "Vite Frontend" "$FRONTEND_PID"
fi

cd "$SCRIPT_DIR"

# ──────────────────────────────────────────────
# 9. Status Dashboard & Supervised Wait
# ──────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════════════════════${RESET}"
echo -e "${GREEN}${BOLD}  ${ICON_ROCKET} Phronesis is fully operational and ready!${RESET}"
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════════════════════${RESET}"

if [ "$START_FRONTEND" = true ]; then
    echo -e "  ${BOLD}➜ Web Application:${RESET}  ${CYAN}http://localhost:${PORT_FRONTEND}${RESET}"
fi
if [ "$START_BACKEND" = true ]; then
    echo -e "  ${BOLD}➜ Backend API:${RESET}      ${CYAN}http://localhost:${PORT_BACKEND}${RESET}"
    echo -e "  ${BOLD}➜ Interactive Docs:${RESET} ${CYAN}http://localhost:${PORT_BACKEND}/docs${RESET}"
    echo -e "  ${BOLD}➜ Health Check:${RESET}     ${CYAN}http://localhost:${PORT_BACKEND}/health${RESET}"
fi

echo -e "\n  ${DIM}Press ${BOLD}Ctrl+C${RESET}${DIM} to stop all running Phronesis processes cleanly.${RESET}\n"

# Optionally open browser
if [ "$OPEN_BROWSER" = true ] && [ "$START_FRONTEND" = true ]; then
    log_info "Opening browser to http://localhost:${PORT_FRONTEND}..."
    if command -v open >/dev/null 2>&1; then
        open "http://localhost:${PORT_FRONTEND}"
    elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open "http://localhost:${PORT_FRONTEND}" >/dev/null 2>&1 || true
    fi
fi

# Process supervisor: Monitor background tasks
while true; do
    if [ -n "$BACKEND_PID" ] && ! kill -0 "$BACKEND_PID" 2>/dev/null; then
        log_error "FastAPI Backend (PID $BACKEND_PID) exited unexpectedly."
        break
    fi
    if [ -n "$FRONTEND_PID" ] && ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
        log_error "Vite Frontend (PID $FRONTEND_PID) exited unexpectedly."
        break
    fi
    sleep 2
done

cleanup
