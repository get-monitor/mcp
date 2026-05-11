import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GetMonitorClient } from '../client/api-client.js';
import { callApi, text, type ToolResponse } from './helpers.js';

export function registerStatusPageTools(server: McpServer, client: GetMonitorClient): void {
  // -------------------------------------------------------------------------
  // Public endpoints (read-only, no auth required but auth-aware)
  // -------------------------------------------------------------------------

  server.tool(
    'resolve_status_page',
    'Resolve a status page by slug or custom domain.',
    {
      slug: z.string().optional().describe('The status page slug'),
      domain: z.string().optional().describe('The custom domain associated with the status page'),
    },
    ({ slug, domain }) =>
      callApi(() => client.get('/api/v1/status-pages', { slug, domain })),
  );

  server.tool(
    'get_status_page_status',
    'Get the current operational status of a status page.',
    {
      id: z.string().describe('The status page ID'),
    },
    ({ id }) => callApi(() => client.get(`/api/v1/status-pages/${id}/status`)),
  );

  server.tool(
    'get_status_page_customization',
    'Get the customization settings for a status page.',
    {
      id: z.string().describe('The status page ID'),
    },
    ({ id }) => callApi(() => client.get(`/api/v1/status-pages/${id}/customization`)),
  );

  server.tool(
    'get_status_page_monitors',
    'Get the list of monitors associated with a status page.',
    {
      id: z.string().describe('The status page ID'),
    },
    ({ id }) => callApi(() => client.get(`/api/v1/status-pages/${id}/monitors`)),
  );

  server.tool(
    'get_status_page_component_tree',
    'Get the component tree for a status page, optionally scoped to a date range.',
    {
      id: z.string().describe('The status page ID'),
      days: z.number().optional().describe('Number of days of history to include'),
    },
    ({ id, days }) =>
      callApi(() => client.get(`/api/v1/status-pages/${id}/components`, { days })),
  );

  server.tool(
    'get_monitor_aggregations',
    'Get aggregated uptime data for a monitor on a status page for a specific date.',
    {
      id: z.string().describe('The status page ID'),
      monitorId: z.string().describe('The monitor ID'),
      date: z.string().describe('The date to aggregate data for (ISO format, e.g. 2024-01-15)'),
    },
    ({ id, monitorId, date }) =>
      callApi(() =>
        client.get(`/api/v1/status-pages/${id}/monitors/${monitorId}/aggregations`, { date }),
      ),
  );

  server.tool(
    'list_status_page_incidents',
    'List incidents for a status page.',
    {
      id: z.string().describe('The status page ID'),
      limit: z.number().optional().describe('Maximum number of incidents to return'),
      page: z.number().optional().describe('Page number for pagination'),
      status: z.string().optional().describe('Filter incidents by status'),
      active: z.boolean().optional().describe('If true, return only active (non-resolved) incidents'),
    },
    ({ id, limit, page, status, active }) =>
      callApi(() =>
        client.get(`/api/v1/status-pages/${id}/incidents`, { limit, page, status, active }),
      ),
  );

  server.tool(
    'get_status_page_incident',
    'Get details about a specific incident on a status page.',
    {
      id: z.string().describe('The status page ID'),
      incidentId: z.string().describe('The incident ID'),
    },
    ({ id, incidentId }) =>
      callApi(() => client.get(`/api/v1/status-pages/${id}/incidents/${incidentId}`)),
  );

  server.tool(
    'list_status_page_maintenance',
    'List maintenance windows for a status page.',
    {
      id: z.string().describe('The status page ID'),
      limit: z.number().optional().describe('Maximum number of items to return'),
      page: z.number().optional().describe('Page number for pagination'),
      status: z.string().optional().describe('Filter maintenance by status'),
      startDate: z.string().optional().describe('Filter by start date'),
      endDate: z.string().optional().describe('Filter by end date'),
    },
    ({ id, limit, page, status, startDate, endDate }) =>
      callApi(() =>
        client.get(`/api/v1/status-pages/${id}/maintenance`, {
          limit,
          page,
          status,
          startDate,
          endDate,
        }),
      ),
  );

  server.tool(
    'get_status_page_maintenance_item',
    'Get details about a specific maintenance window on a status page.',
    {
      id: z.string().describe('The status page ID'),
      maintenanceId: z.string().describe('The maintenance ID'),
    },
    ({ id, maintenanceId }) =>
      callApi(() => client.get(`/api/v1/status-pages/${id}/maintenance/${maintenanceId}`)),
  );

  server.tool(
    'list_status_page_updates',
    'List updates (incident/maintenance posts) for a status page.',
    {
      id: z.string().describe('The status page ID'),
      limit: z.number().optional().describe('Maximum number of items to return'),
      page: z.number().optional().describe('Page number for pagination'),
    },
    ({ id, limit, page }) =>
      callApi(() => client.get(`/api/v1/status-pages/${id}/updates`, { limit, page })),
  );

  server.tool(
    'get_status_page_badge',
    'Get the SVG badge for a status page.',
    {
      id: z.string().describe('The status page ID'),
      preview: z
        .enum(['operational', 'unavailable', 'investigation'])
        .optional()
        .describe('Preview a specific badge state'),
      textInvestigation: z.string().optional().describe('Custom text for investigation state'),
      textUnavailable: z.string().optional().describe('Custom text for unavailable state'),
      textOperational: z.string().optional().describe('Custom text for operational state'),
    },
    ({ id, preview, textInvestigation, textUnavailable, textOperational }) =>
      callApi(() =>
        client.get(`/api/v1/status-pages/${id}/badge`, {
          preview,
          textInvestigation,
          textUnavailable,
          textOperational,
        }),
      ),
  );

  // -------------------------------------------------------------------------
  // Management — Status Pages CRUD
  // -------------------------------------------------------------------------

  server.tool(
    'list_managed_status_pages',
    'List all status pages managed by the authenticated user/organization.',
    {},
    () => callApi(() => client.get('/api/v1/manage/status-pages')),
  );

  server.tool(
    'create_status_page',
    'Create a new status page.',
    {
      data: z.record(z.unknown()).describe('Status page configuration fields'),
    },
    ({ data }) => callApi(() => client.post('/api/v1/manage/status-pages', data)),
  );

  server.tool(
    'get_managed_status_page',
    'Get details about a specific managed status page.',
    {
      id: z.string().describe('The status page ID'),
    },
    ({ id }) => callApi(() => client.get(`/api/v1/manage/status-pages/${id}`)),
  );

  server.tool(
    'delete_status_page',
    'Delete a status page.',
    {
      id: z.string().describe('The status page ID'),
    },
    ({ id }) => callApi(() => client.delete(`/api/v1/manage/status-pages/${id}`)),
  );

  server.tool(
    'update_status_page',
    'Update a status page configuration.',
    {
      id: z.string().describe('The status page ID'),
      data: z.record(z.unknown()).describe('Fields to update on the status page'),
    },
    ({ id, data }) => callApi(() => client.patch(`/api/v1/status-pages/${id}`, data)),
  );

  // -------------------------------------------------------------------------
  // Management — Customization + Domain
  // -------------------------------------------------------------------------

  server.tool(
    'update_status_page_customization',
    'Update the customization settings for a status page.',
    {
      id: z.string().describe('The status page ID'),
      data: z.record(z.unknown()).describe('Customization fields to update'),
    },
    ({ id, data }) =>
      callApi(() => client.patch(`/api/v1/status-pages/${id}/customization`, data)),
  );

  server.tool(
    'reset_status_page_customization',
    'Reset the customization settings for a status page to defaults.',
    {
      id: z.string().describe('The status page ID'),
    },
    ({ id }) => callApi(() => client.delete(`/api/v1/status-pages/${id}/customization`)),
  );

  server.tool(
    'get_status_page_badge_config',
    'Get the badge configuration for a status page.',
    {
      id: z.string().describe('The status page ID'),
      preview: z
        .enum(['operational', 'unavailable', 'investigation'])
        .optional()
        .describe('Preview a specific badge state'),
      textInvestigation: z.string().optional().describe('Custom text for investigation state'),
      textUnavailable: z.string().optional().describe('Custom text for unavailable state'),
      textOperational: z.string().optional().describe('Custom text for operational state'),
    },
    ({ id, preview, textInvestigation, textUnavailable, textOperational }) =>
      callApi(() =>
        client.get(`/api/v1/status-pages/${id}/badge/config`, {
          preview,
          textInvestigation,
          textUnavailable,
          textOperational,
        }),
      ),
  );

  server.tool(
    'set_status_page_domain',
    'Set a custom domain for a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
      data: z.record(z.unknown()).describe('Domain configuration fields'),
    },
    ({ statusPageId, data }) =>
      callApi(() => client.post(`/api/v1/status-pages/${statusPageId}/domain`, data)),
  );

  server.tool(
    'remove_status_page_domain',
    'Remove the custom domain from a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
    },
    ({ statusPageId }) =>
      callApi(() => client.delete(`/api/v1/status-pages/${statusPageId}/domain`)),
  );

  server.tool(
    'verify_status_page_domain',
    'Trigger domain verification for a status page custom domain.',
    {
      statusPageId: z.string().describe('The status page ID'),
    },
    ({ statusPageId }) =>
      callApi(() => client.post(`/api/v1/status-pages/${statusPageId}/domain/verify`, {})),
  );

  server.tool(
    'check_status_page_domain_verification',
    'Check the current domain verification status for a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
    },
    ({ statusPageId }) =>
      callApi(() => client.get(`/api/v1/status-pages/${statusPageId}/domain/verification`)),
  );

  // -------------------------------------------------------------------------
  // Management — Component Groups
  // -------------------------------------------------------------------------

  server.tool(
    'list_component_groups',
    'List all component groups for a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
    },
    ({ statusPageId }) =>
      callApi(() => client.get(`/api/v1/status-pages/${statusPageId}/component-groups`)),
  );

  server.tool(
    'create_component_group',
    'Create a new component group on a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
      data: z.record(z.unknown()).describe('Component group fields'),
    },
    ({ statusPageId, data }) =>
      callApi(() => client.post(`/api/v1/status-pages/${statusPageId}/component-groups`, data)),
  );

  server.tool(
    'reorder_component_groups',
    'Reorder component groups on a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
      data: z.record(z.unknown()).describe('Reorder payload (e.g. ordered list of group IDs)'),
    },
    ({ statusPageId, data }) =>
      callApi(() =>
        client.patch(`/api/v1/status-pages/${statusPageId}/component-groups/reorder`, data),
      ),
  );

  server.tool(
    'update_component_group',
    'Update a component group on a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
      groupId: z.string().describe('The component group ID'),
      data: z.record(z.unknown()).describe('Component group fields to update'),
    },
    ({ statusPageId, groupId, data }) =>
      callApi(() =>
        client.patch(`/api/v1/status-pages/${statusPageId}/component-groups/${groupId}`, data),
      ),
  );

  server.tool(
    'delete_component_group',
    'Delete a component group from a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
      groupId: z.string().describe('The component group ID'),
    },
    ({ statusPageId, groupId }) =>
      callApi(() =>
        client.delete(`/api/v1/status-pages/${statusPageId}/component-groups/${groupId}`),
      ),
  );

  server.tool(
    'move_component_group',
    'Move a component group to a different position on a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
      groupId: z.string().describe('The component group ID'),
      data: z.record(z.unknown()).describe('Move payload (e.g. target position or parent)'),
    },
    ({ statusPageId, groupId, data }) =>
      callApi(() =>
        client.patch(
          `/api/v1/status-pages/${statusPageId}/component-groups/${groupId}/move`,
          data,
        ),
      ),
  );

  // -------------------------------------------------------------------------
  // Management — Monitors on Status Page
  // -------------------------------------------------------------------------

  server.tool(
    'link_monitor_to_status_page',
    'Link a monitor to a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
      data: z.record(z.unknown()).describe('Monitor link fields (e.g. monitorId)'),
    },
    ({ statusPageId, data }) =>
      callApi(() => client.post(`/api/v1/status-pages/${statusPageId}/monitors`, data)),
  );

  server.tool(
    'unlink_monitor_from_status_page',
    'Unlink a monitor from a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
      monitorId: z.string().describe('The monitor ID to unlink'),
    },
    ({ statusPageId, monitorId }) =>
      callApi(() =>
        client.delete(`/api/v1/status-pages/${statusPageId}/monitors/${monitorId}`),
      ),
  );

  server.tool(
    'get_grouped_status_page_monitors',
    'Get monitors on a status page grouped by their component group.',
    {
      statusPageId: z.string().describe('The status page ID'),
    },
    ({ statusPageId }) =>
      callApi(() => client.get(`/api/v1/status-pages/${statusPageId}/monitors/grouped`)),
  );

  server.tool(
    'reorder_status_page_monitors',
    'Reorder monitors on a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
      data: z.record(z.unknown()).describe('Reorder payload (e.g. ordered list of monitor IDs)'),
    },
    ({ statusPageId, data }) =>
      callApi(() =>
        client.patch(`/api/v1/status-pages/${statusPageId}/monitors/reorder`, data),
      ),
  );

  server.tool(
    'move_monitor_to_group',
    'Move a monitor to a different component group on a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
      monitorId: z.string().describe('The monitor ID to move'),
      data: z.record(z.unknown()).describe('Move payload (e.g. target groupId)'),
    },
    ({ statusPageId, monitorId, data }) =>
      callApi(() =>
        client.patch(
          `/api/v1/status-pages/${statusPageId}/monitors/${monitorId}/group`,
          data,
        ),
      ),
  );

  // -------------------------------------------------------------------------
  // Management — Static Components
  // -------------------------------------------------------------------------

  server.tool(
    'list_static_components',
    'List all static components for a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
    },
    ({ statusPageId }) =>
      callApi(() => client.get(`/api/v1/status-pages/${statusPageId}/static-components`)),
  );

  server.tool(
    'create_static_component',
    'Create a new static component on a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
      data: z.record(z.unknown()).describe('Static component fields'),
    },
    ({ statusPageId, data }) =>
      callApi(() => client.post(`/api/v1/status-pages/${statusPageId}/static-components`, data)),
  );

  server.tool(
    'reorder_static_components',
    'Reorder static components on a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
      data: z.record(z.unknown()).describe('Reorder payload (e.g. ordered list of component IDs)'),
    },
    ({ statusPageId, data }) =>
      callApi(() =>
        client.patch(`/api/v1/status-pages/${statusPageId}/static-components/reorder`, data),
      ),
  );

  server.tool(
    'update_static_component',
    'Update a static component on a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
      componentId: z.string().describe('The static component ID'),
      data: z.record(z.unknown()).describe('Static component fields to update'),
    },
    ({ statusPageId, componentId, data }) =>
      callApi(() =>
        client.patch(
          `/api/v1/status-pages/${statusPageId}/static-components/${componentId}`,
          data,
        ),
      ),
  );

  server.tool(
    'delete_static_component',
    'Delete a static component from a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
      componentId: z.string().describe('The static component ID'),
    },
    ({ statusPageId, componentId }) =>
      callApi(() =>
        client.delete(
          `/api/v1/status-pages/${statusPageId}/static-components/${componentId}`,
        ),
      ),
  );

  server.tool(
    'upsert_static_component_override',
    'Create or update a status override for a static component on a specific date.',
    {
      statusPageId: z.string().describe('The status page ID'),
      componentId: z.string().describe('The static component ID'),
      date: z.string().describe('The date for the override (ISO format, e.g. 2024-01-15)'),
      data: z.record(z.unknown()).describe('Override fields (e.g. status)'),
    },
    ({ statusPageId, componentId, date, data }) =>
      callApi(() =>
        client.put(
          `/api/v1/status-pages/${statusPageId}/static-components/${componentId}/overrides/${date}`,
          data,
        ),
      ),
  );

  server.tool(
    'get_static_component_override',
    'Get the status override for a static component on a specific date.',
    {
      statusPageId: z.string().describe('The status page ID'),
      componentId: z.string().describe('The static component ID'),
      date: z.string().describe('The date of the override (ISO format, e.g. 2024-01-15)'),
    },
    ({ statusPageId, componentId, date }) =>
      callApi(() =>
        client.get(
          `/api/v1/status-pages/${statusPageId}/static-components/${componentId}/overrides/${date}`,
        ),
      ),
  );

  // -------------------------------------------------------------------------
  // Management — Incidents
  // -------------------------------------------------------------------------

  server.tool(
    'create_incident',
    'Create a new incident on a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
      title: z.string().optional().describe('Title of the incident'),
      status: z.string().optional().describe('Status of the incident (e.g. investigating, identified, monitoring, resolved)'),
      message: z.string().optional().describe('Initial message or description of the incident'),
      affectedComponents: z.array(z.record(z.string(), z.unknown())).optional().describe('List of affected components'),
    },
    ({ statusPageId, ...rest }) =>
      callApi(() => client.post(`/api/v1/status-pages/${statusPageId}/incidents`, rest)),
  );

  server.tool(
    'update_incident',
    'Update an existing incident on a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
      incidentId: z.string().describe('The incident ID'),
      data: z.record(z.unknown()).describe('Incident fields to update'),
    },
    ({ statusPageId, incidentId, data }) =>
      callApi(() =>
        client.patch(`/api/v1/status-pages/${statusPageId}/incidents/${incidentId}`, data),
      ),
  );

  server.tool(
    'delete_incident',
    'Delete an incident from a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
      incidentId: z.string().describe('The incident ID'),
    },
    ({ statusPageId, incidentId }) =>
      callApi(() =>
        client.delete(`/api/v1/status-pages/${statusPageId}/incidents/${incidentId}`),
      ),
  );

  server.tool(
    'resolve_incident',
    'Resolve an incident on a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
      incidentId: z.string().describe('The incident ID'),
    },
    ({ statusPageId, incidentId }) =>
      callApi(() =>
        client.post(
          `/api/v1/status-pages/${statusPageId}/incidents/${incidentId}/resolve`,
          {},
        ),
      ),
  );

  server.tool(
    'add_incident_update',
    'Add an update (post) to an existing incident on a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
      incidentId: z.string().describe('The incident ID'),
      data: z.record(z.unknown()).describe('Update fields (e.g. message, status)'),
    },
    ({ statusPageId, incidentId, data }) =>
      callApi(() =>
        client.post(
          `/api/v1/status-pages/${statusPageId}/incidents/${incidentId}/updates`,
          data,
        ),
      ),
  );

  server.tool(
    'get_status_page_health_score',
    'Get the health score for a status page over a time range.',
    {
      statusPageId: z.string().describe('The status page ID'),
      timeRange: z
        .enum(['24h', '7d', '30d'])
        .optional()
        .describe('Time range for the health score (24h, 7d, or 30d)'),
    },
    ({ statusPageId, timeRange }) =>
      callApi(() =>
        client.get(`/api/v1/status-pages/${statusPageId}/incidents/health-score`, {
          timeRange,
        }),
      ),
  );

  // -------------------------------------------------------------------------
  // Management — Maintenance
  // -------------------------------------------------------------------------

  server.tool(
    'create_maintenance',
    'Create a new maintenance window on a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
      title: z.string().describe('Title of the maintenance window'),
      scheduledStartAt: z.string().describe('Scheduled start time of the maintenance window (ISO 8601)'),
      scheduledEndAt: z.string().describe('Scheduled end time of the maintenance window (ISO 8601)'),
      description: z.string().optional().describe('Optional description of the maintenance window'),
    },
    ({ statusPageId, title, scheduledStartAt, scheduledEndAt, ...rest }) =>
      callApi(() =>
        client.post(`/api/v1/status-pages/${statusPageId}/maintenance`, {
          title,
          scheduledStartAt,
          scheduledEndAt,
          ...rest,
        }),
      ),
  );

  server.tool(
    'update_maintenance',
    'Update an existing maintenance window on a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
      maintenanceId: z.string().describe('The maintenance ID'),
      data: z.record(z.unknown()).describe('Maintenance fields to update'),
    },
    ({ statusPageId, maintenanceId, data }) =>
      callApi(() =>
        client.patch(
          `/api/v1/status-pages/${statusPageId}/maintenance/${maintenanceId}`,
          data,
        ),
      ),
  );

  server.tool(
    'delete_maintenance',
    'Delete a maintenance window from a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
      maintenanceId: z.string().describe('The maintenance ID'),
    },
    ({ statusPageId, maintenanceId }) =>
      callApi(() =>
        client.delete(`/api/v1/status-pages/${statusPageId}/maintenance/${maintenanceId}`),
      ),
  );

  server.tool(
    'add_maintenance_update',
    'Add an update (post) to an existing maintenance window on a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
      maintenanceId: z.string().describe('The maintenance ID'),
      data: z.record(z.unknown()).describe('Update fields (e.g. message)'),
    },
    ({ statusPageId, maintenanceId, data }) =>
      callApi(() =>
        client.post(
          `/api/v1/status-pages/${statusPageId}/maintenance/${maintenanceId}/updates`,
          data,
        ),
      ),
  );

  server.tool(
    'start_maintenance',
    'Mark a maintenance window as started on a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
      maintenanceId: z.string().describe('The maintenance ID'),
    },
    ({ statusPageId, maintenanceId }) =>
      callApi(() =>
        client.post(
          `/api/v1/status-pages/${statusPageId}/maintenance/${maintenanceId}/start`,
          {},
        ),
      ),
  );

  server.tool(
    'complete_maintenance',
    'Mark a maintenance window as completed on a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
      maintenanceId: z.string().describe('The maintenance ID'),
    },
    ({ statusPageId, maintenanceId }) =>
      callApi(() =>
        client.post(
          `/api/v1/status-pages/${statusPageId}/maintenance/${maintenanceId}/complete`,
          {},
        ),
      ),
  );

  server.tool(
    'cancel_maintenance',
    'Cancel a maintenance window on a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
      maintenanceId: z.string().describe('The maintenance ID'),
    },
    ({ statusPageId, maintenanceId }) =>
      callApi(() =>
        client.post(
          `/api/v1/status-pages/${statusPageId}/maintenance/${maintenanceId}/cancel`,
          {},
        ),
      ),
  );

  // -------------------------------------------------------------------------
  // Management — Subscribers
  // -------------------------------------------------------------------------

  server.tool(
    'list_status_page_subscribers',
    'List all subscribers for a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
      page: z.number().optional().describe('Page number for pagination'),
      limit: z.number().optional().describe('Maximum number of subscribers to return'),
    },
    ({ statusPageId, page, limit }) =>
      callApi(() =>
        client.get(`/api/v1/status-pages/${statusPageId}/subscriptions`, { page, limit }),
      ),
  );

  server.tool(
    'remove_status_page_subscriber',
    'Remove a subscriber from a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
      subscriptionId: z.string().describe('The subscription ID to remove'),
    },
    ({ statusPageId, subscriptionId }) =>
      callApi(() =>
        client.delete(
          `/api/v1/status-pages/${statusPageId}/subscriptions/${subscriptionId}`,
        ),
      ),
  );

  server.tool(
    'export_status_page_subscribers',
    'Export the subscriber list for a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
    },
    ({ statusPageId }) =>
      callApi(() => client.get(`/api/v1/status-pages/${statusPageId}/subscriptions/export`)),
  );

  server.tool(
    'get_status_page_subscription_analytics',
    'Get subscription analytics for a status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
    },
    ({ statusPageId }) =>
      callApi(() =>
        client.get(`/api/v1/status-pages/${statusPageId}/subscriptions/analytics`),
      ),
  );
}
