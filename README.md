# GetMonitor Full Management MCP Server

Give AI assistants (Claude, Cursor, etc.) complete authenticated access to manage all GetMonitor resources — organizations, users, monitors, incidents, status pages, integrations, and more.

Unlike the read-only public MCP server, this server provides full CRUD access to everything in GetMonitor, including privileged operations like organization management, subscription control, and incident management.

## Hosted — OAuth setup

**Claude Code:**

```bash
claude mcp add --transport http getmonitor https://mcp.getmonitor.io/mcp
```

Or add manually to your MCP client config:

```json
{
  "mcpServers": {
    "getmonitor": {
      "url": "https://mcp.getmonitor.io/mcp"
    }
  }
}
```

Your client will guide you through OAuth login with your GetMonitor account. The server validates your session and gives you full access to your organization and resources.

## Self-hosted (npm)

```bash
npm install -g @getmonitor/mcp
```

**Claude Code:**

```bash
claude mcp add getmonitor getmonitor-mcp --env GETMONITOR_API_KEY=your_api_key
```

Or add manually to your MCP client config:

```json
{
  "mcpServers": {
    "getmonitor": {
      "command": "getmonitor-mcp"
    }
  }
}
```

Required environment variable:

```bash
export GETMONITOR_API_KEY=your_api_key  # Personal or service account API key
```

Optional:

```bash
export GETMONITOR_API_URL=https://api.getmonitor.io  # default
```

## Available Tools

All tools require authentication. Your API key or session token must be associated with an account that has the necessary permissions on the organization or resources.

### Organizations (16 tools)

Manage organization settings, members, invitations, roles, and billing subscription.

- Create, read, update, delete organizations
- Manage organization members and their roles
- Send and manage member invitations
- Update subscription plans and billing

### Users (13 tools)

Manage your user account, sessions, and connected OAuth apps.

- View and update profile information
- List and revoke active sessions
- Link and unlink OAuth accounts (GitHub, Google, etc.)
- Manage API keys

### Images (7 tools)

Upload and manage images for status page branding and components.

- Upload images with metadata
- Replace existing images
- Delete images
- List images with metadata

### Onboarding (1 tool)

- Complete the GetMonitor onboarding flow for new accounts

### Uptime Monitors (7 tools)

CRUD operations on uptime monitors with statistics and logging.

- Create, read, update, delete monitors
- Get monitor statistics and uptime data
- List uptime logs and check history
- Manage monitor pause/unpause state

### Monitors (5 tools)

Cross-type monitor listing and organization statistics.

- List all monitors in an organization
- Get organization monitor statistics
- Query monitor status and aggregations

### Heartbeats (8 tools)

Create and manage heartbeat monitors including pause/unpause and token regeneration.

- Create, read, update, delete heartbeat monitors
- Pause and unpause monitors
- Regenerate monitor tokens
- Get heartbeat check history

### On-Call (26 tools)

Full management of on-call teams, members, schedules, policies, and monitor assignments.

- Create and manage on-call teams
- Add and remove team members
- Create and manage schedules
- Define and apply escalation policies
- Assign monitors to on-call workflows
- Manage notification channels and destinations

### Integrations (16 tools)

Discover, install, and configure integration apps for incident notifications and status syncing.

- Browse available integration apps
- Install and uninstall apps
- Create and manage destination configurations
- Test and preview integration templates
- List installed apps and their configurations

### Status Pages (60 tools)

Full lifecycle management of status pages including components, incidents, maintenance, domains, and subscribers.

- Create, read, update, delete status pages
- Manage custom domains and branding
- Create and manage component groups and static components
- Attach monitors to status pages
- Create and update incidents with updates
- Create and manage maintenance windows
- List and manage status page subscribers
- Customize status page appearance and notifications

### Subscriptions (6 tools)

Public subscription management and pricing information.

- List available subscription plans
- Get subscription details and current usage
- Manage subscriber email preferences

## Example prompts

- _"Create a new status page for our company website and add my monitors to it"_
- _"Add john@acme.com as a manager to my organization"_
- _"Create an incident on my status page for a database outage and send notifications"_
- _"Set up an on-call rotation with escalation to PagerDuty"_
- _"Upload our company logo and use it to brand the status page"_
- _"Install the Slack integration and configure it to notify our #incidents channel"_
- _"List all monitors and their current status across my organization"_
- _"Create a maintenance window for next Tuesday and update subscribers"_
