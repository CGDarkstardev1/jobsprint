# Jobsprint Gum TUI - Quick Start Guide

## Installation

```bash
# Quick install
cd /home/chris/dev/jobsprint/src/cli/gum-tui
sudo ./install.sh
```

## First Time Setup

```bash
# Set environment
export JOBSPRINT_ROOT=/home/chris/dev/jobsprint

# Add to PATH (add to ~/.bashrc or ~/.zshrc)
export PATH="${PATH}:/home/chris/dev/jobsprint/src/cli/gum-tui"
```

## Basic Usage

### Interactive Mode

```bash
# Launch main menu
./puter

# Or use the main script
jobspring
```

### Command-Line Mode

```bash
# Start all services
./puter-startup

# Check status
./puter-status

# View logs
./puter-logs n8n

# Stop services
./puter-shutdown
```

## Common Tasks

### Start Services
```bash
./puter-startup
# Watch progress
./puter-status --watch
```

### Check Health
```bash
# Quick status
./puter-status

# Detailed monitoring
./puter-monitor

# Single snapshot
./puter-monitor --snapshot
```

### Debug Issues
```bash
# View error logs
./puter-logs --filter ERROR

# Follow logs in real-time
./puter-logs n8n --follow

# Check specific service
./puter-status postgres
```

### Manage Configuration
```bash
# Interactive config manager
./puter-config

# Edit specific service
./puter-config --edit n8n

# Validate configuration
./puter-config --validate postgres

# Reset to defaults
./puter-config --reset nginx
```

## Daily Operations

### Morning Startup
```bash
./puter-startup
./puter-status
./puter-monitor --snapshot > /var/log/jobsprint-health-$(date +%Y%m%d).log
```

### Health Check
```bash
#!/bin/bash
# Simple health check script

if ./puter-status --json | jq -e '.services | to_entries | all(.value.status == "running")' > /dev/null; then
    echo "✓ All services healthy"
    exit 0
else
    echo "✗ Some services down"
    ./puter-status
    exit 1
fi
```

### Log Maintenance
```bash
# Export logs
./puter-logs --export "jobsprint-logs-$(date +%Y%m%d).txt"

# Check log statistics
./puter-logs --stats
```

### Configuration Backup
```bash
# Backup all configs
./puter-config --export "/backup/jobsprint-configs-$(date +%Y%m%d)"
```

## Aliases (Optional)

Add to `~/.bashrc` or `~/.zshrc`:

```bash
# Jobsprint aliases
alias js='~/dev/jobsprint/src/cli/gum-tui/puter'
alias jss='~/dev/jobsprint/src/cli/gum-tui/puter-status'
alias jsl='~/dev/jobsprint/src/cli/gum-tui/puter-logs --follow'
alias jsm='~/dev/jobsprint/src/cli/gum-tui/puter-monitor'
alias jsc='~/dev/jobsprint/src/cli/gum-tui/puter-config'
```

Then use:
```bash
js          # Main menu
jss         # Status
jsl         # Logs
jsm         # Monitor
```

## Troubleshooting

### Services Won't Start

```bash
# Check what's wrong
./puter-status
./puter-logs --filter ERROR

# Try restart
./puter-shutdown --restart
```

### High Memory Usage

```bash
# Monitor resources
./puter-monitor

# Check specific service
./puter-status postgres

# Adjust config
./puter-config --edit postgres
```

### Permission Errors

```bash
# Ensure scripts are executable
chmod +x /home/chris/dev/jobsprint/src/cli/gum-tui/*

# Check ownership
ls -la /home/chris/dev/jobsprint/src/cli/gum-tui/
```

## Advanced Usage

### JSON Output for Scripts

```bash
# Get status as JSON
STATUS=$(./puter-status --json)

# Check if service is running
if echo "$STATUS" | jq -r '.services.n8n.status' | grep -q running; then
    echo "n8n is healthy"
fi
```

### Automated Monitoring

```bash
#!/bin/bash
# Monitor every minute and alert on failures

while true; do
    if ! ./puter-status --json | jq -e '.services | to_entries | all(.value.status == "running")' > /dev/null; then
        echo "ALERT: Service failure detected at $(date)" >&2
        ./puter-status
        # Send notification...
    fi
    sleep 60
done
```

### Export Metrics

```bash
# Export to JSON
./puter-monitor --export-json metrics.json

# Send to monitoring system
curl -X POST https://monitoring.example.com/metrics \
     -H "Content-Type: application/json" \
     -d @metrics.json
```

## Integration with Cron

```bash
# Add to crontab with: crontab -e

# Health check every 5 minutes
*/5 * * * * /home/chris/dev/jobsprint/src/cli/gum-tui/puter-status --json > /tmp/jobsprint-status.json 2>&1

# Daily status report
0 9 * * * /home/chris/dev/jobsprint/src/cli/gum-tui/puter-status > /var/log/jobsprint-daily-$(date +\%Y\%m\%d).log

# Weekly config backup
0 2 * * 0 /home/chris/dev/jobsprint/src/cli/gum-tui/puter-config --export /backup/jobsprint-$(date +\%Y\%m\%d)

# Monthly log archive
0 3 1 * * /home/chris/dev/jobsprint/src/cli/gum-tui/puter-logs --export /archive/jobsprint-logs-$(date +\%Y\%m).txt
```

## Tips

1. **Use watch mode** for monitoring startup:
   ```bash
   ./puter-status --watch
   ```

2. **Export before changes**:
   ```bash
   ./puter-config --export backup-before-change
   ```

3. **Validate configurations**:
   ```bash
   ./puter-config --validate n8n
   ```

4. **Check log statistics**:
   ```bash
   ./puter-logs --stats
   ```

5. **Use snapshots** for records:
   ```bash
   ./puter-monitor --snapshot > snapshot-$(date +%Y%m%d-%H%M%S).txt
   ```

## Getting Help

Each command has built-in help:
```bash
./puter-startup --help
./puter-status --help
./puter-logs --help
./puter-config --help
./puter-monitor --help
```

Full documentation:
- Main README: `README.md`
- Command docs: `COMMANDS*.md`

---

**Happy Jobsprinting! 🚀**
