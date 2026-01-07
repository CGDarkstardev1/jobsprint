# puter-status - Service Status Monitor

## Description

Display real-time status and health metrics for all Jobsprint services with multiple viewing modes and output formats.

## Usage

```bash
puter-status [OPTIONS] [SERVICE]
```

## Options

- `-h, --help` - Display help message
- `-v, --verbose` - Enable verbose output
- `-q, --quiet` - Suppress output
- `-w, --watch` - Watch mode (auto-refresh every 5s)
- `-j, --json` - JSON output for scripting
- `-s, --service SERVICE` - Show specific service status

## Services

- `n8n` - Workflow engine
- `postgres` - Database
- `redis` - Cache
- `rabbitmq` - Message broker
- `nginx` - Reverse proxy

## Examples

### Show all services
```bash
puter-status
```

### Watch mode (live updates)
```bash
puter-status --watch
```

### Specific service
```bash
puter-status n8n
```

### JSON output for scripting
```bash
puter-status --json > status.json
```

### Use in scripts
```bash
if puter-status --json | jq -r '.services.n8n.status' | grep -q running; then
    echo "n8n is healthy"
fi
```

## Output Format

### Table Mode (default)
```
SERVICE     STATUS      UPTIME                    MEMORY       CPU        PORT
n8n         ● running   2025-01-06 10:30:15       245.1MB      2.35%      :5678
postgres    ● running   2025-01-06 10:30:10       128.5MB      0.85%      :5432
redis       ● running   2025-01-06 10:30:12       45.2MB       0.12%      :6379
rabbitmq    ○ stopped   N/A                       N/A          N/A        :5672
nginx       ● running   2025-01-06 10:30:20       12.3MB       0.05%      :80

Running: 4 | Stopped: 1 | Total: 5
```

### JSON Mode
```json
{
  "timestamp": "2025-01-06T10:30:00Z",
  "services": {
    "n8n": {
      "status": "running",
      "uptime": "2025-01-06 10:30:15",
      "memory": "245.1MB",
      "cpu": "2.35%"
    }
  }
}
```

## Status Indicators

- **● Green** - Service running and healthy
- **○ Red** - Service stopped or down

## Information Provided

- **Status** - Current state (running/stopped)
- **Uptime** - Time since start (or N/A if stopped)
- **Memory** - Current memory usage
- **CPU** - Current CPU percentage
- **Port** - Service port number

## Watch Mode

Auto-refreshes every 5 seconds:
- Press `Ctrl+C` to exit
- Clears screen between updates
- Shows system hostname and time
- Ideal for monitoring during operations

## Exit Codes

- `0` - All services running
- `1` - One or more services stopped

## Related Commands

- `puter-monitor` - Advanced real-time monitoring
- `puter-startup` - Start stopped services
- `puter-logs` - Check service logs

---

**Version:** 1.0.0 | **Part of:** Jobspring TUI
