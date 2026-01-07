# puter-shutdown - Service Shutdown Script

## Description

Stops all Jobsprint services gracefully in reverse dependency order. Each service is given time to shutdown properly before force-stopping if necessary.

## Usage

```bash
puter-shutdown [OPTIONS]
```

## Options

- `-h, --help` - Display help message
- `-v, --verbose` - Enable verbose output
- `-q, --quiet` - Suppress output
- `--dry-run` - Show what would be done
- `--restart` - Restart services (stop then start)

## Shutdown Order

Services are stopped in reverse dependency order:

1. **nginx** - Reverse proxy (stop first)
2. **n8n** - Workflow engine
3. **rabbitmq** - Message broker
4. **redis** - Cache and queue
5. **postgres** - Database (stop last)

## Examples

### Normal shutdown
```bash
puter-shutdown
```

### Restart all services
```bash
puter-shutdown --restart
```

### Dry run
```bash
puter-shutdown --dry-run
```

### Automated shutdown
```bash
puter-shutdown --quiet && echo "Shutdown complete"
```

## Graceful Shutdown

Each service receives:
1. SIGTERM for graceful shutdown
2. 30-second timeout period
3. SIGKILL if still running (force stop)

## Service Management Methods

The script tries multiple methods:
- **Systemd** - `systemctl stop`
- **Docker** - `docker stop`
- **Docker Compose** - `docker-compose stop`
- **Process** - `pkill -TERM`

## Error Handling

- Non-running services are skipped
- Failed stops display warnings
- Returns exit code 1 if any service fails
- All attempts logged

## Related Commands

- `puter-startup` - Start services
- `puter-status` - Verify stopped state
- `puter-logs` - Check for shutdown errors

---

**Version:** 1.0.0 | **Part of:** Jobspring TUI
