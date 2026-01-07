# puter-config - Configuration Manager

## Description

Edit, manage, and validate Jobsprint service configurations with backup support and import/export capabilities.

## Usage

```bash
puter-config [OPTIONS]
```

## Options

- `-h, --help` - Display help message
- `-v, --verbose` - Enable verbose output
- `-q, --quiet` - Suppress output
- `--list` - List all configuration files
- `--view SERVICE` - View configuration for service
- `--edit SERVICE` - Edit configuration for service
- `--reset SERVICE` - Reset to default configuration
- `--validate SERVICE` - Validate configuration file
- `--export DIR` - Export all configurations
- `--import DIR` - Import configurations from directory

## Services

- `n8n` - n8n workflow engine (config.yml)
- `postgres` - PostgreSQL (postgresql.conf)
- `redis` - Redis cache (redis.conf)
- `rabbitmq` - RabbitMQ (rabbitmq.conf)
- `nginx` - Nginx web server (nginx.conf)
- `docker-compose` - Docker Compose (docker-compose.yml)
- `environment` - Environment variables (.env)

## Examples

### Interactive mode
```bash
puter-config
```

### List all configurations
```bash
puter-config --list
```

### View configuration
```bash
puter-config --view n8n
```

### Edit configuration
```bash
puter-config --edit nginx
```

### Reset to defaults
```bash
puter-config --reset postgres
```

### Validate configuration
```bash
puter-config --validate n8n
```

### Export all configs
```bash
puter-config --export /backup/configs
```

### Import configs
```bash
puter-config --import /backup/configs
```

## Interactive Mode

The interactive menu offers:
1. **List configurations** - Show all config files and status
2. **View configuration** - Display with syntax highlighting
3. **Edit configuration** - Open in $EDITOR
4. **Reset configuration** - Restore defaults
5. **Validate configuration** - Check syntax and required fields
6. **Export configurations** - Backup all configs
7. **Import configurations** - Restore from backup

## Configuration Locations

Configs are stored in `${CONFIG_DIR}/`:
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

## Editor Selection

The script tries editors in this order:
1. `$VISUAL` environment variable
2. `$EDITOR` environment variable
3. `nano`
4. `vim`
5. `vi`
6. `code` (VS Code)

Set your preferred editor:
```bash
export EDITOR=vim
export VISUAL=vim
```

## Automatic Backups

Before editing, automatic backups are created:
```text
config.yml -> config.yml.backup.20250106-103000
```

## Default Configurations

Each service has sensible defaults:
- **n8n** - Webhook settings, database config, timeouts
- **postgres** - Memory settings, WAL config, logging
- **redis** - Persistence, memory limits, security
- **rabbitmq** - Listeners, memory watermark, logging
- **nginx** - Upstream config, proxy settings, gzip
- **environment** - All service credentials and settings

## Validation

Each config type has specific validation:
- **n8n** - Checks for webhook_url
- **postgres** - Checks for listen_addresses
- **redis** - Checks for port setting
- **docker-compose** - Checks for version field

## Export Format

Exports include metadata:
```
configs-export-20250106/
├── n8n.conf
├── postgres.conf
├── redis.conf
├── rabbitmq.conf
├── nginx.conf
└── export-info.txt
```

`export-info.txt` contains:
```text
Jobsprint Configuration Export
Generated: 2025-01-06 10:30:00
Host: server01

Services exported: 7

To import these configurations, use:
  puter-config --import configs-export-20250106
```

## Syntax Highlighting

View mode uses syntax highlighting:
- **YAML files** (.yml, .yaml)
- **Config files** (.conf, .cfg)
- **Environment files** (.env)

## Security

**Important:** Configuration files may contain sensitive information:
- Database passwords
- API keys
- Secret tokens
- Certificates

Always:
- Keep backups secure
- Use proper file permissions
- Never commit configs to version control
- Use environment variables for secrets

## Related Commands

- `puter-startup` - Restart after config changes
- `puter-status` - Verify config is loaded
- `puter-logs` - Check for config errors

---

**Version:** 1.0.0 | **Part of:** Jobspring TUI
