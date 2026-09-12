# @getmonitor/mcp

## 0.3.2

### Patch Changes

- Fix session token authentication against accounts. Path 2 session tokens are now validated against `accounts` instead of `api`, and are exchanged for an accounts-issued JWT before being used as the Bearer credential on `api` calls, since `api`'s AccountsOrgGuard rejects raw session tokens. Also corrects `accountsUrl` to point at the correct API endpoint.

## 0.3.1

### Patch Changes

- cdb75c4: Add Changesets for versioning and changelogs. The MCP server now reports its version by reading `package.json` at build time instead of a hardcoded string, so it can no longer drift out of sync with the package version.
