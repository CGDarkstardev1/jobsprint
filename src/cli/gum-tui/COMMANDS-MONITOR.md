# puter-monitor - Real-Time Health Monitor

## Description

Live dashboard for monitoring Jobsprint services with real-time updates, system resources, alerts, and multiple view modes.

## Usage

```bash
puter-monitor [OPTIONS]
```

## Options

- `-h, --help` - Display help message
- `-v, --verbose` - Enable verbose output
- `-q, --quiet` - Suppress output
- `--snapshot, -1` - Single snapshot (no refresh)
- `--export-json FILE` - Export metrics as JSON

## Examples

### Interactive monitor (default)
```bash
puter-monitor
```

### Single snapshot
```bash
puter-monitor --snapshot
```

### Export metrics
```bash
puter-monitor --export-json metrics.json
```

### In automation
```bash
while true; do
    puter-monitor --snapshot
    sleep 60
done
```

## View Modes

### Dashboard View (default)
Comprehensive overview with:
- System resources (CPU, memory, disk, load)
- Service status grid
- Network connections
- Recent activity
- Active alerts

### Compact View
Single-line status per service:
- Faster refresh rate
- Minimal screen usage
- Essential info only

### Detailed View
Full statistics for selected service:
- Complete status details
- Recent log entries
- Connection info
- Resource usage

## Keyboard Shortcuts

During interactive monitoring:
- `q` - Quit monitor
- `r` - Force refresh
- `s` - Switch view mode
- `d` - Switch to detailed view
- `c` - Switch to compact view
- `h` - Show help

## Dashboard Information

### System Resources
- **CPU Usage** - Current processor utilization
- **Memory** - RAM usage with percentage
- **Disk** - Storage space on jobsprint directory
- **Load Average** - System load (1, 5, 15 min)

### Service Grid
For each service:
- Status indicator (● running, ○ stopped)
- Uptime since start
- Memory consumption
- CPU percentage

### Network Status
- Number of listening ports
- Connection counts per service
- Port availability

### Recent Activity
- Error count in last 5 minutes
- Recent log entries (last 3 lines)
- System events

### Alerts
Warnings for:
- Stopped services
- High error rates (>10 in 5 min)
- Disk space critical (>80% used)
- Resource exhaustion

## Refresh Intervals

- **Dashboard/Compact** - 2 seconds
- **Detailed** - 5 seconds (default)
- **Watch mode** - Configurable via `--interval`

## JSON Export Format

```json
{
  "timestamp": "2025-01-06T10:30:00Z",
  "hostname": "server01",
  "services": {
    "n8n": {
      "status": "running",
      "uptime": "2025-01-06 10:15:00",
      "memory": "245.1MB",
      "cpu": "2.35%"
    },
    "postgres": {
      "status": "running",
      "uptime": "2025-01-06 10:14:55",
      "memory": "128.5MB",
      "cpu": "0.85%"
    }
  }
}
```

## Terminal Requirements

- Minimum size: 80x24 characters
- Supports: `tput` for cursor control
- Colors: ANSI color codes
- Recommended: 120x40 or larger

## Alert Thresholds

### High Error Rate
- Threshold: >10 errors in 5 minutes
- Services: All logs scanned
- Action: Check logs, investigate

### Disk Space
- Warning: >80% used
- Critical: >90% used
- Action: Clean up logs, expand storage

### Service Down
- Trigger: Any service not running
- Action: `jobsprint start` or investigate

## Integration Examples

### Automated monitoring
```bash
#!/bin/bash
while true; do
    puter-monitor --export-json /tmp/metrics.json
    # Send to monitoring system
    curl -X POST https://monitoring.example.com/metrics \
         -H "Content-Type: application/json" \
         -d @/tmp/metrics.json
    sleep 60
done
```

### Alert integration
```bash
#!/bin/bash
# Export and check for issues
puter-monitor --export-json metrics.json

if jq -e '.services | to_entries | any(.value.status != "running")' metrics.json; then
    echo "ALERT: Service down detected" | mail -s "Jobsprint Alert" admin@example.com
fi
```

### Prometheus metrics
```bash
# Convert to Prometheus format
puter-monitor --export-json metrics.json | \
  jq -r '.services | to_entries[] | "\(.key)_status{\(.value.status)} 1"'
```

## Performance Impact

- **CPU usage**: <1%
- **Memory overhead**: ~20MB
- **I/O**: Minimal (reads /proc, /sys)
- **Network**: None (local only)

## Exit Codes

- `0` - Normal exit (q pressed)
- `1` - Error (terminal too small, missing tools)
- `130` - Interrupted (Ctrl+C)

## Troubleshooting

### Terminal too small
```bash
# Resize terminal or use compact view
puter-monitor  # Requires 80x24 minimum
```

### Missing tput
```bash
# Install ncurses
sudo apt install ncurses-term  # Debian/Ubuntu
```

### Cursor not hidden
```bash
# Terminal doesn't support cursor control
# Monitor will still work, just with visible cursor
```

## Related Commands

- `puter-status` - Single status check
- `puter-logs` - Investigate issues
- `puter-startup` - Restart failed services

---

**Version:** 1.0.0 | **Part of:** Jobspring TUI
