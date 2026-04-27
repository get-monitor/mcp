# GetMonitor MCP Server

Connect AI assistants (Claude, Cursor, etc.) to your [GetMonitor](https://getmonitor.io) status pages, monitors, incidents, and maintenance schedules.

## Hosted — no setup required

Add to your MCP client config:

```json
{
  "mcpServers": {
    "getmonitor": {
      "url": "https://mcp.getmonitor.io/mcp"
    }
  }
}
```

Your client will guide you through OAuth login with your GetMonitor account.

## Self-hosted (npm)

```bash
npm install -g @getmonitor/mcp
```

Add to your MCP client config:

```json
{
  "mcpServers": {
    "getmonitor": {
      "command": "getmonitor-mcp"
    }
  }
}
```

Optional environment variables:

```bash
export GETMONITOR_API_URL=https://api.getmonitor.io  # default
export GETMONITOR_API_KEY=your_api_key               # optional, for future auth-required tools
```

## Available Tools

All tools are read-only and work against public GetMonitor API endpoints.

| Tool | Description |
|------|-------------|
| `resolve_status_page` | Find a status page by slug or custom domain |
| `get_status_page_status` | Get current aggregate status (operational/degraded/outage) |
| `get_status_page_components` | Get component tree with uptime percentages |
| `list_status_updates` | List recent public status updates |
| `list_monitors` | List monitors attached to a status page |
| `get_monitor_aggregations` | Get hourly uptime data for a monitor on a given date |
| `list_incidents` | List incidents, optionally filtered by status |
| `get_incident` | Get a specific incident with all updates |
| `list_maintenance` | List maintenance windows, filter by status or date range |
| `get_maintenance` | Get a specific maintenance window |

## Example prompts

- *"What's the current status of the Acme status page at status.acme.com?"*
- *"Show me all investigating incidents on status page sp_abc123"*
- *"What maintenance is scheduled for next month on sp_abc123?"*
- *"What was the uptime for monitor m_xyz on 2026-04-01?"*
