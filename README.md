# GetMonitor Full Management MCP Server

Give AI assistants (Claude, Cursor, etc.) complete authenticated access to manage all GetMonitor resources — organizations, monitors, incident response, on-call, status pages, integrations, and more.

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

### Organizations (27 tools)

Manage organization settings, teams, members, invitations, and roles.

- Create, read, update, delete organizations, and check slug availability
- List organizations and guest-access organizations, and resolve by slug
- Manage organization members, roles, and invitations (send, view, accept, cancel)
- Create and manage teams and team membership
- Track organization status and onboarding progress

### Projects (9 tools)

Manage projects and source-map upload tokens for error tracking ingestion.

- Create, read, update, delete projects
- Rotate project ingestion keys
- Create, list, and revoke source-map tokens

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

### On-Call (21 tools)

Manage on-call rotations, schedules, routing, and alerts.

- Create and manage rotations and rotation members
- Manage schedules and schedule overrides, and query who's on call
- Configure notification routes for on-call escalation
- List, acknowledge, and resolve on-call alerts, and view alert stats

### Incident Response (40 tools)

Full incident-response lifecycle management, from declaration through postmortem.

- Create, update, resolve, and close incidents; view overview stats
- Assign roles, link affected services, and set incident types
- Publish status updates, with AI-generated summaries and drafts
- Manage incident actions (action items) and custom fields
- Configure escalations and manage incident type definitions
- Link notebooks, track participants (join/leave), and related incidents
- Record timeline notes throughout the incident

### Integrations (12 tools)

Discover, install, and configure integration apps for incident notifications and status syncing.

- Browse available integration apps and view app details
- Install, configure, and disable integrations
- Create, update, and delete destination configurations
- Check installation health status

### Status Pages (60 tools)

Full lifecycle management of status pages including components, updates, maintenance, domains, and subscribers.

- Create, read, update, delete status pages, and check domain availability
- Manage custom domains (set, remove, verify) and page customization/branding
- Create and manage component groups and static components, and attach monitors
- Create and manage maintenance windows (start, complete, cancel) and post updates
- Create and manage status page updates
- List, remove, and export status page subscribers, with subscription analytics
- View status badges and aggregated monitor status

### Notebooks (7 tools)

Incident postmortem and runbook documents, including AI-assisted drafting.

- Create, read, update, delete notebooks
- Generate AI-drafted notebook content
- List available notebook templates

### Members (4 tools)

Manage your personal notification contact methods.

- List your contact methods
- Create, update, and remove contact methods (Slack, email, SMS)

### Subscriptions (6 tools)

Public subscription management for status page updates, plus billing plan information.

- Subscribe to status page updates and verify/confirm the subscription
- Unsubscribe from status page notifications
- List available billing subscription plans

## Example prompts

- _"Create a new status page for our company website and add my monitors to it"_
- _"Add john@acme.com as a manager to my organization"_
- _"Create an incident on my status page for a database outage and send notifications"_
- _"Set up an on-call rotation and schedule an override for next week"_
- _"Draft a postmortem notebook for last night's outage and link it to the incident"_
- _"Install the Slack integration and configure it to notify our #incidents channel"_
- _"List all monitors and their current status across my organization"_
- _"Create a maintenance window for next Tuesday and update subscribers"_

## Releasing

Versioning and changelogs are managed with [Changesets](https://changesets.dev).

1. On any PR with a user-facing change, run `pnpm changeset` and follow the prompts to describe the change and pick a semver bump (patch/minor/major). Commit the generated file under `.changeset/`.
2. When ready to release, run `pnpm version-packages` to consume all pending changesets, bump the version in `package.json`, and update `CHANGELOG.md`. Commit the result.
3. Run `pnpm build`, then `npm publish`, then push a matching git tag (e.g. `vX.Y.Z`).
