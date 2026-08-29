---
"@getmonitor/mcp": patch
---

Add Changesets for versioning and changelogs. The MCP server now reports its version by reading `package.json` at build time instead of a hardcoded string, so it can no longer drift out of sync with the package version.
