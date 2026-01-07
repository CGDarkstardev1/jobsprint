#!/usr/bin/env bash
# Jobsprint Gum TUI Installation Script
# Installs Jobsprint TUI scripts system-wide

set -euo pipefail

# Colors
readonly COLOR_SUCCESS='\033[0;32m'
readonly COLOR_ERROR='\033[0;31m'
readonly COLOR_INFO='\033[0;34m'
readonly COLOR_MUTED='\033[0;90m'
readonly COLOR_RESET='\033[0m'

# Installation directories
readonly INSTALL_DIR="/usr/local/bin"
readonly SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Log functions
log_info() {
    echo -e "${COLOR_INFO}ℹ️  $*${COLOR_RESET}"
}

log_success() {
    echo -e "${COLOR_SUCCESS}✓ $*${COLOR_RESET}"
}

log_error() {
    echo -e "${COLOR_ERROR}✗ $*${COLOR_RESET}"
}

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "This script must be run as root or with sudo"
        exit 1
    fi
}

# Check dependencies
check_dependencies() {
    log_info "Checking dependencies..."

    if ! command -v gum >/dev/null 2>&1; then
        log_error "Gum is not installed"
        echo ""
        echo "Install Gum:"
        echo "  Ubuntu/Debian: sudo apt install gum"
        echo "  macOS:         brew install gum"
        echo "  Source:        https://github.com/charmbracelet/gum"
        exit 1
    fi

    log_success "All dependencies satisfied"
}

# Install scripts
install_scripts() {
    log_info "Installing Jobsprint TUI scripts to ${INSTALL_DIR}..."

    local scripts=(
        "puter"
        "puter-startup"
        "puter-shutdown"
        "puter-status"
        "puter-logs"
        "puter-config"
        "puter-monitor"
    )

    for script in "${scripts[@]}"; do
        local source="${SOURCE_DIR}/${script}"
        local target="${INSTALL_DIR}/jobsprint-${script}"

        if [ ! -f "${source}" ]; then
            log_error "Script not found: ${source}"
            exit 1
        fi

        # Copy script
        cp "${source}" "${target}"

        # Make executable
        chmod +x "${target}"

        log_success "Installed ${script} → ${target}"
    done

    # Create main symlink
    ln -sf "${INSTALL_DIR}/puter" "${INSTALL_DIR}/jobsprint"
    log_success "Created symlink: jobsprint → puter"
}

# Create directories
create_directories() {
    log_info "Creating Jobsprint directories..."

    local dirs=(
        "${JOBSPRINT_ROOT}/logs"
        "${JOBSPRINT_ROOT}/config/n8n"
        "${JOBSPRINT_ROOT}/config/postgres"
        "${JOBSPRINT_ROOT}/config/redis"
        "${JOBSPRINT_ROOT}/config/rabbitmq"
        "${JOBSPRINT_ROOT}/config/nginx"
    )

    for dir in "${dirs[@]}"; do
        mkdir -p "${dir}"
        log_success "Created ${dir}"
    done
}

# Set JOBSPRINT_ROOT
set_environment() {
    log_info "Setting up environment..."

    local env_file="/etc/profile.d/jobsprint.sh"

    cat > "${env_file}" <<'EOF'
# Jobsprint TUI Environment
export JOBSPRINT_ROOT="${JOBSPRINT_ROOT:-/opt/jobsprint}"
EOF

    log_success "Created ${env_file}"
    log_info "Source with: source /etc/profile.d/jobsprint.sh"
}

# Print installation summary
print_summary() {
    echo ""
    gum style \
        --foreground="${COLOR_SUCCESS}" \
        --border double \
        --align center \
        --padding "1 2" \
        "Installation Complete!"
    echo ""

    echo "Available commands:"
    echo "  jobspring          - Main menu"
    echo "  jobspring start    - Start all services"
    echo "  jobspring stop     - Stop all services"
    echo "  jobspring status   - Show service status"
    echo "  jobspring logs     - View logs"
    echo "  jobspring config   - Manage configurations"
    echo "  jobspring monitor  - Health monitor"
    echo ""
    echo "Documentation:"
    echo "  ${SOURCE_DIR}/README.md"
    echo ""
    echo "Configuration:"
    echo "  JOBSPRINT_ROOT=${JOBSPRINT_ROOT:-/opt/jobsprint}"
    echo ""
}

# Main installation
main() {
    echo ""
    gum style \
        --foreground="${COLOR_INFO}" \
        --border double \
        --align center \
        --padding "1 2" \
        "Jobsprint Gum TUI Installer"
    echo ""

    # Check requirements
    check_dependencies

    # Set default root if not set
    export JOBSPRINT_ROOT="${JOBSPRINT_ROOT:-/opt/jobsprint}"

    log_info "Installing to: ${INSTALL_DIR}"
    log_info "Jobsprint root: ${JOBSPRINT_ROOT}"
    echo ""

    # Confirm installation
    if ! gum confirm "Continue with installation?" --default; then
        log_info "Installation cancelled"
        exit 0
    fi

    echo ""

    # Run installation steps
    check_root
    create_directories
    install_scripts
    set_environment

    # Print summary
    print_summary

    log_success "Installation completed successfully!"
}

# Run main
main "$@"
