#!/usr/bin/env bash
# Jobsprint Gum TUI Configuration
# Shared configuration and utility functions for all Gum TUI scripts

set -euo pipefail

# Colors
export COLOR_PRIMARY="#00ADB5"
export COLOR_SECONDARY="#393E46"
export COLOR_SUCCESS="#00FF00"
export COLOR_WARNING="#FFA500"
export COLOR_ERROR="#FF0000"
export COLOR_INFO="#00BFFF"
export COLOR_MUTED="#8B8B8B"

# Services managed by Jobsprint
export SERVICES=(
    "n8n"
    "postgres"
    "redis"
    "rabbitmq"
    "nginx"
)

# Service ports
export N8N_PORT=5678
export POSTGRES_PORT=5432
export REDIS_PORT=6379
export RABBITMQ_PORT=5672
export NGINX_PORT=80

# Log directory
export JOBSPRINT_ROOT="${JOBSPRINT_ROOT:-/home/chris/dev/jobsprint}"
export LOG_DIR="${JOBSPRINT_ROOT}/logs"
export CONFIG_DIR="${JOBSPRINT_ROOT}/config"

# Ensure directories exist
ensure_directories() {
    mkdir -p "${LOG_DIR}"
    mkdir -p "${CONFIG_DIR}"
}

# Logging functions
log_info() {
    gum style \
        --foreground="${COLOR_INFO}" \
        --align="left" \
        "ℹ️  $*" | tee -a "${LOG_DIR}/jobsprint.log"
}

log_success() {
    gum style \
        --foreground="${COLOR_SUCCESS}" \
        --align="left" \
        "✓ $*" | tee -a "${LOG_DIR}/jobsprint.log"
}

log_warning() {
    gum style \
        --foreground="${COLOR_WARNING}" \
        --align="left" \
        "⚠️  $*" | tee -a "${LOG_DIR}/jobsprint.log"
}

log_error() {
    gum style \
        --foreground="${COLOR_ERROR}" \
        --align="left" \
        "✗ $*" | tee -a "${LOG_DIR}/jobsprint.log"
}

log_debug() {
    gum style \
        --foreground="${COLOR_MUTED}" \
        --align="left" \
        "  DEBUG: $*" | tee -a "${LOG_DIR}/jobsprint.log"
}

# Header display
show_header() {
    local title="$1"
    local subtitle="${2:-Jobsprint AI Automation Platform}"

    gum style \
        --foreground="${COLOR_PRIMARY}" \
        --border double \
        --border-foreground="${COLOR_PRIMARY}" \
        --align center \
        --padding "1 2" \
        --margin "1 2" \
        --bold \
        "${title}" > /dev/tty

    gum style \
        --foreground="${COLOR_MUTED}" \
        --align center \
        --margin "0 2" \
        "${subtitle}" > /dev/tty
}

# Service status check
check_service() {
    local service="$1"

    if systemctl is-active --quiet "${service}" 2>/dev/null; then
        echo "running"
    elif docker ps --format '{{.Names}}' | grep -q "^${service}$" 2>/dev/null; then
        echo "running"
    elif pgrep -f "${service}" >/dev/null 2>&1; then
        echo "running"
    else
        echo "stopped"
    fi
}

# Get service status with details
get_service_status() {
    local service="$1"
    local status
    local uptime="N/A"
    local memory="N/A"
    local cpu="N/A"

    status=$(check_service "${service}")

    if [ "${status}" = "running" ]; then
        # Try systemd
        if systemctl is-active --quiet "${service}" 2>/dev/null; then
            uptime=$(systemctl show "${service}" -p ActiveState --value | xargs)
            # Get more details if available
            if command -v systemctl >/dev/null 2>&1; then
                memory=$(systemctl show "${service}" -p MemoryCurrent --value 2>/dev/null | awk '{printf "%.1fMB", $1/1024/1024}')
                cpu=$(systemctl show "${service}" -p CPUUsageNSec --value 2>/dev/null | awk '{printf "%.2f%%", $1/100000000}')
            fi
        # Try Docker
        elif docker ps --format '{{.Names}}' | grep -q "^${service}$" 2>/dev/null; then
            local container_id
            container_id=$(docker ps -qf "name=${service}")
            if [ -n "${container_id}" ]; then
                uptime=$(docker inspect "${container_id}" --format '{{.State.StartedAt}}' 2>/dev/null | xargs -I{} date -d {} '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "Unknown")
                memory=$(docker stats "${container_id}" --no-stream --format '{{.MemUsage}}' 2>/dev/null || echo "N/A")
                cpu=$(docker stats "${container_id}" --no-stream --format '{{.CPUPerc}}' 2>/dev/null || echo "N/A")
            fi
        # Try process
        elif pgrep -f "${service}" >/dev/null 2>&1; then
            local pid
            pid=$(pgrep -f "${service}" | head -1)
            if [ -n "${pid}" ]; then
                uptime=$(ps -p "${pid}" -o etime= 2>/dev/null | xargs || echo "Unknown")
                memory=$(ps -p "${pid}" -o rss= 2>/dev/null | awk '{printf "%.1fMB", $1/1024}')
                cpu=$(ps -p "${pid}" -o %cpu= 2>/dev/null | awk '{printf "%.2f%%", $1}')
            fi
        fi
    fi

    echo "${status}|${uptime}|${memory}|${cpu}"
}

# Error handler
error_exit() {
    log_error "$1"
    exit "${2:-1}"
}

# Confirm action
confirm_action() {
    local prompt="$1"
    local default="${2:-false}"

    if [ "${default}" = "true" ]; then
        gum confirm "${prompt}" --default --affirmative="Yes" --negative="No"
    else
        gum confirm "${prompt}" --affirmative="Yes" --negative="No"
    fi
}

# Display spinner during operation
spin() {
    local message="$1"
    shift
    local cmd=("$@")

    gum spin --spinner dot --title "${message}" -- "${cmd[@]}"
}

# Format time duration
format_duration() {
    local seconds="$1"
    local hours=$((seconds / 3600))
    local minutes=$(( (seconds % 3600) / 60 ))
    local secs=$((seconds % 60))

    if [ ${hours} -gt 0 ]; then
        printf "%dh %dm %ds" ${hours} ${minutes} ${secs}
    elif [ ${minutes} -gt 0 ]; then
        printf "%dm %ds" ${minutes} ${secs}
    else
        printf "%ds" ${secs}
    fi
}

# Check if required commands exist
check_requirements() {
    local missing=()

    for cmd in "$@"; do
        if ! command -v "${cmd}" >/dev/null 2>&1; then
            missing+=("${cmd}")
        fi
    done

    if [ ${#missing[@]} -gt 0 ]; then
        log_error "Missing required commands: ${missing[*]}"
        return 1
    fi

    return 0
}

# Display help message
show_help() {
    local script_name="$1"
    local description="$2"
    shift 2

    gum style \
        --foreground="${COLOR_PRIMARY}" \
        --bold \
        --border normal \
        --border-foreground="${COLOR_PRIMARY}" \
        --align left \
        --padding "1 2" \
        "NAME" > /dev/tty

    echo "    ${script_name} - ${description}" | tee -a "${LOG_DIR}/jobsprint.log" > /dev/tty
    echo "" > /dev/tty

    gum style \
        --foreground="${COLOR_PRIMARY}" \
        --bold \
        --border normal \
        --border-foreground="${COLOR_PRIMARY}" \
        --align left \
        --padding "1 2" \
        "SYNOPSIS" > /dev/tty

    echo "    ${script_name} [OPTIONS]" | tee -a "${LOG_DIR}/jobsprint.log" > /dev/tty
    echo "" > /dev/tty

    gum style \
        --foreground="${COLOR_PRIMARY}" \
        --bold \
        --border normal \
        --border-foreground="${COLOR_PRIMARY}" \
        --align left \
        --padding "1 2" \
        "DESCRIPTION" > /dev/tty

    for line in "$@"; do
        echo "    ${line}" | tee -a "${LOG_DIR}/jobsprint.log" > /dev/tty
    done
    echo "" > /dev/tty

    gum style \
        --foreground="${COLOR_PRIMARY}" \
        --bold \
        --border normal \
        --border-foreground="${COLOR_PRIMARY}" \
        --align left \
        --padding "1 2" \
        "OPTIONS" > /dev/tty

    cat <<'EOF' | tee -a "${LOG_DIR}/jobsprint.log" > /dev/tty
    -h, --help          Show this help message
    -v, --verbose       Enable verbose output
    -q, --quiet         Suppress output (except errors)
    --dry-run           Show what would be done without doing it
EOF
    echo "" > /dev/tty

    gum style \
        --foreground="${COLOR_PRIMARY}" \
        --bold \
        --border normal \
        --border-foreground="${COLOR_PRIMARY}" \
        --align left \
        --padding "1 2" \
        "EXAMPLES" > /dev/tty

    cat <<'EOF' | tee -a "${LOG_DIR}/jobsprint.log" > /dev/tty
    # Normal operation
    jobsprint COMMAND

    # Verbose mode
    jobsprint COMMAND --verbose

    # Dry run
    jobsprint COMMAND --dry-run
EOF
}

# Parse common arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                return 1
                ;;
            -v|--verbose)
                set -x
                shift
                ;;
            -q|--quiet)
                QUIET=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            *)
                shift
                ;;
        esac
    done
    return 0
}

# Export functions
export -f log_info log_success log_warning log_error log_debug
export -f show_header check_service get_service_status
export -f error_exit confirm_action spin
export -f format_duration check_requirements
export -f show_help parse_args
