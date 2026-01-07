# Jobsprint Gum TUI Documentation

Complete guide to the Jobsprint Terminal User Interface (TUI) powered by Gum.

## Overview

The Jobsprint Gum TUI provides a beautiful, intuitive terminal interface for managing all Jobsprint services. It offers both an interactive menu system and command-line interface for automation.

## Installation

### Prerequisites

```bash
# Install Gum (required)
sudo apt install gum  # Ubuntu/Debian
brew install gum      # macOS
```

### Setup

```bash
# Add to PATH
export PATH="${PATH}:/home/chris/dev/jobsprint/src/cli/gum-tui"

# Or create symlinks
ln -s /home/chris/dev/jobsprint/src/cli/gum-tui/puter /usr/local/bin/jobsprint
chmod +x /home/chris/dev/jobsprint/src/cli/gum-tui/*
```

## Quick Start

### Interactive Mode

```bash
# Launch the main menu
jobsprint
```

This will display an interactive menu with all available options.

### Command-Line Mode

```bash
# Start all services
jobsprint start

# Check status
jobsprint status

# View logs
jobsprint logs n8n

# Stop all services
jobsprint stop
```

## Commands

### jobspring start

Start all Jobsprint services in dependency order with health checks.

```bash
# Basic usage
jobsprint start

# Verbose mode
jobsprint start --verbose

# Dry run (show what would happen)
jobsprint start --dry-run

# Quiet mode (minimal output)
jobsprint start --quiet
```

**Startup Order:**
1. PostgreSQL (database)
2. Redis (cache/queue)
3. RabbitMQ (message broker)
4. n8n (workflow engine)
5. Nginx (reverse proxy)

### jobsprint stop

Stop all Jobsprint services gracefully.

```bash
# Stop services
jobsprint stop

# With confirmation
jobsprint stop --confirm

# Force stop if graceful shutdown fails
jobsprint stop --force
```

**Shutdown Order:** (reverse of startup)
1. Nginx
2. n8n
3. RabbitMQ
4. Redis
5. PostgreSQL

### jobsprint restart

Restart all Jobsprint services.

```bash
# Restart all services
jobsprint restart

# Equivalent to
jobsprint stop && sleep 3 && jobsprint start
```

### jobsprint status

Display status and health metrics for all services.

```bash
# Show all services
jobsprint status

# Watch mode (auto-refresh every 5s)
jobsprint status --watch

# Specific service
jobsprint status n8n

# JSON output for scripting
jobsprint status --json > status.json
```

**Output includes:**
- Service status (running/stopped)
- Uptime
- Memory usage
- CPU usage
- Port information

### jobsprint logs

View and filter logs from Jobsprint services.

```bash
# Interactive log viewer
jobsprint logs

# View specific service logs
jobsprint logs n8n

# Number of lines
jobsprint logs -n 50

# Tail logs (follow in real-time)
jobsprint logs --follow

# Filter by log level
jobsprint logs --filter ERROR

# Search for pattern
jobsprint logs --search "exception"

# Export logs to file
jobsprint logs --export logs.txt

# Show log statistics
jobsprint logs --stats
```

**Log Color Coding:**
- 🔴 Red - Errors
- 🟡 Yellow - Warnings
- 🔵 Blue - Info
- ⚪ Gray - Debug

### jobsprint config

Manage Jobsprint service configurations.

```bash
# Interactive configuration manager
jobsprint config

# List all configurations
jobsprint config --list

# View configuration
jobsprint config --view n8n

# Edit configuration
jobsprint config --edit nginx

# Reset to defaults
jobsprint config --reset postgres

# Validate configuration
jobsprint config --validate n8n

# Export all configurations
jobsprint config --export /backup/configs

# Import configurations
jobsprint config --import /backup/configs
```

**Configuration Files:**
- `n8n` - n8n workflow engine settings
- `postgres` - PostgreSQL database settings
- `redis` - Redis cache settings
- `rabbitmq` - RabbitMQ message broker settings
- `nginx` - Nginx reverse proxy settings
- `environment` - Environment variables (.env)
- `docker-compose` - Docker Compose configuration

### jobsprint monitor

Real-time health monitoring dashboard.

```bash
# Interactive monitor (default)
jobsprint monitor

# Single snapshot
jobsprint monitor --snapshot

# Export metrics as JSON
jobsprint monitor --export-json metrics.json
```

**Monitor Views:**
- **Dashboard** - Overview of all services
- **Compact** - One-line status per service
- **Detailed** - Full stats for selected service

**Keyboard Shortcuts:**
- `q` - Quit
- `r` - Refresh
- `s` - Switch view
- `h` - Help

## Direct Script Usage

You can also call scripts directly:

```bash
# Direct script calls
/home/chris/dev/jobsprint/src/cli/gum-tui/puter-startup
/home/chris/dev/jobsprint/src/cli/gum-tui/puter-status --watch
/home/chris/dev/jobsprint/src/cli/gum-tui/puter-logs n8n --follow
```

## Environment Variables

Configure Jobsprint TUI behavior:

```bash
# Set custom editor
export EDITOR=vim
export VISUAL=vim

# Set custom log directory
export JOBSPRINT_ROOT=/path/to/jobsprint

# Enable debug mode
export JOBSPRINT_DEBUG=true
```

## Configuration Files

All configurations are stored in `${JOBSPRINT_ROOT}/config/`:

```
config/
├── n8n/
│   └── config.yml
├── postgres/
│   └── postgresql.conf
├── redis/
│   └── redis.conf
├── rabbitmq/
│   └── rabbitmq.conf
├── nginx/
│   └── nginx.conf
└── environment
```

## Logs

Logs are stored in `${JOBSPRINT_ROOT}/logs/`:

```
logs/
├── jobsprint.log    # Main system log
├── n8n.log          # n8n service log
├── postgres.log     # PostgreSQL log
├── redis.log        # Redis log
├── rabbitmq.log     # RabbitMQ log
└── nginx.log        # Nginx log
```

## Troubleshooting

### Services Won't Start

```bash
# Check service status
jobsprint status

# View logs for errors
jobsprint logs --filter ERROR

# Verify configuration
jobsprint config --validate <service>
```

### High Memory Usage

```bash
# Monitor resources
jobsprint monitor

# Check specific service
jobsprint status <service>

# Adjust configuration
jobsprint config --edit <service>
```

### Permission Errors

```bash
# Ensure scripts are executable
chmod +x /home/chris/dev/jobsprint/src/cli/gum-tui/*

# Check file ownership
ls -la /home/chris/dev/jobsprint/src/cli/gum-tui/
```

## Tips & Tricks

### Quick Commands

```bash
# Alias for common operations
alias js='jobsprint'
alias jss='jobsprint status'
alias jsl='jobsprint logs --follow'
alias jsm='jobsprint monitor'
```

### Automation

```bash
# Start services and wait for health
jobsprint start && \
while ! jobsprint status --json | jq -r '.services.n8n.status' | grep -q running; do
    sleep 1
done

# Backup configurations
jobsprint config --export "backup-$(date +%Y%m%d)"

# Health check script
#!/bin/bash
if jobsprint status --json | jq -e '.services | to_entries | all(.value.status == "running")' > /dev/null; then
    echo "All services healthy"
    exit 0
else
    echo "Some services down"
    exit 1
fi
```

### Integration with Cron

```bash
# Daily status report
0 9 * * * /usr/local/bin/jobsprint status --json > /var/log/jobsprint-status-$(date +\%Y\%m\%d).json

# Log rotation
0 0 * * * /usr/local/bin/jobsprint logs --export /archive/logs/logs-$(date +\%Y\%m\%d).txt
```

## Examples

### Typical Workflow

```bash
# 1. Start services
jobsprint start

# 2. Monitor startup
jobsprint status --watch

# 3. Check logs if needed
jobsprint logs n8n --follow

# 4. Make configuration changes
jobsprint config --edit n8n

# 5. Restart affected service
jobsprint restart
```

### Debugging Issues

```bash
# 1. Check overall status
jobsprint status

# 2. View error logs
jobsprint logs --filter ERROR

# 3. Monitor in real-time
jobsprint monitor

# 4. Export logs for analysis
jobsprint logs --export debug-logs.txt

# 5. Restart if needed
jobsprint stop && jobsprint start
```

### System Administration

```bash
# Daily health check
jobsprint status --json | jq '.services | to_entries[] | select(.value.status != "running") | .key'

# Weekly configuration backup
jobsprint config --export "/backup/jobsprint-configs-$(date +%Yweek%V)"

# Monthly log archive
jobsprint logs --export "/archive/jobsprint-logs-$(date +%Y%m).txt"
```

## Support

For issues, questions, or contributions:
- GitHub: [Jobsprint Repository]
- Documentation: `/docs` directory
- Logs: `${JOBSPRINT_ROOT}/logs/`

## Version History

- **v1.0.0** (2025-01-06)
  - Initial release
  - All core commands implemented
  - Interactive menu system
  - Real-time monitoring
  - Configuration management
  - Log viewing and filtering

---

**Built with ❤️ using [Gum](https://github.com/charmbracelet/gum) by Charmbracelet**
