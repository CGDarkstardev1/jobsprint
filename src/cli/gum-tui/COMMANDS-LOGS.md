# puter-logs - Log Viewer and Filter

## Description

View and filter logs from Jobsprint services with color-coding, search capabilities, and real-time tailing.

## Usage

```bash
puter-logs [OPTIONS] [SERVICE]
```

## Options

- `-h, --help` - Display help message
- `-v, --verbose` - Enable verbose output
- `-q, --quiet` - Suppress output
- `-n, --lines NUM` - Number of lines to show (default: 100)
- `-f, --follow` - Tail logs in real-time (follow mode)
- `-s, --service SERVICE` - Specific service to view
- `--filter LEVEL` - Filter by log level (ERROR, WARN, INFO, DEBUG)
- `--search PATTERN` - Search for specific pattern
- `--export FILE` - Export logs to file
- `-i, --interactive` - Interactive mode (default)
- `--stats` - Show log statistics

## Services

- `n8n` - Workflow engine logs
- `postgres` - Database logs
- `redis` - Cache logs
- `rabbitmq` - Message broker logs
- `nginx` - Web server logs
- `jobsprint` - System logs (all services)
- `all` - All services combined

## Examples

### Interactive viewer
```bash
puter-logs
```

### View specific service
```bash
puter-logs n8n
```

### Tail logs in real-time
```bash
puter-logs n8n --follow
```

### Show last 50 lines
```bash
puter-logs -n 50
```

### Filter by error level
```bash
puter-logs --filter ERROR
```

### Search for pattern
```bash
puter-logs --search "exception"
```

### Export logs
```bash
puter-logs --export debug-logs.txt
```

### Show statistics
```bash
puter-logs --stats
```

### Combined filters
```bash
puter-logs n8n -n 200 --filter ERROR --search "timeout"
```

## Interactive Mode

The interactive menu provides:
1. Select service
2. Choose viewing mode:
   - **view** - Display N lines
   - **tail (follow)** - Real-time updates
   - **filter by level** - ERROR, WARN, INFO, DEBUG
   - **search** - Pattern matching

## Color Coding

Logs are color-coded by level:
- 🔴 **Red** - Error messages
- 🟡 **Yellow** - Warning messages
- 🔵 **Blue** - Info messages
- ⚪ **Gray** - Debug messages

## Log Locations

Logs are stored in `${LOG_DIR}/`:
```
logs/
├── jobsprint.log    # Main system log
├── n8n.log          # n8n service
├── postgres.log     # PostgreSQL
├── redis.log        # Redis
├── rabbitmq.log     # RabbitMQ
└── nginx.log        # Nginx
```

## Statistics Output

```bash
$ puter-logs --stats

Log Statistics - Summary Information

n8n
  Size: 2.4M | Lines: 15234 | Errors: 23 | Warnings: 156

postgres
  Size: 8.1M | Lines: 45678 | Errors: 2 | Warnings: 45

redis
  Size: 512K | Lines: 3456 | Errors: 0 | Warnings: 12
```

## Export Format

Exported logs include metadata:
```text
Jobsprint Logs Export
Generated: 2025-01-06 10:30:00
Service: n8n
==========================================

[actual log content here]
```

## Real-time Tailing

Follow mode features:
- Live updates as logs are written
- Color-coding maintained
- Press `Ctrl+C` to exit
- Works with filters and search

## Journalctl Integration

If service logs are in journalctl:
- Automatically detected
- Falls back to journalctl if log files missing
- Supports all journalctl features

## Exit Codes

- `0` - Success
- `1` - Error (service not found, log file missing)
- `130` - Interrupted (Ctrl+C)

## Related Commands

- `puter-status` - Check service status
- `puter-monitor` - Live monitoring
- `puter-config` - Configure log levels

---

**Version:** 1.0.0 | **Part of:** Jobspring TUI
