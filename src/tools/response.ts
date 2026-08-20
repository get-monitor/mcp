import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GetMonitorClient } from '../client/api-client.js';
import { callApi } from './helpers.js';

const SEVERITY = z.enum(['sev1', 'sev2', 'sev3', 'sev4']);
const INCIDENT_STATUS = z.enum(['open', 'investigating', 'identified', 'monitoring', 'resolved', 'closed']);
const COMPONENT_STATUS = z.enum(['operational', 'degraded', 'partial_outage', 'major_outage']);
const IMPACT = z.enum(['none', 'minor', 'major', 'critical']);

export function registerResponseTools(server: McpServer, client: GetMonitorClient): void {
  // ─── Incidents ────────────────────────────────────────────────────────────

  server.tool(
    'get_incidents_overview_stats',
    'Get incident-response overview statistics for an organization: MTTR, incident counts, and recent incidents.',
    {},
    () => callApi(() => client.get('/api/v1/response/incidents/overview-stats')),
  );

  server.tool(
    'list_incidents',
    'List response incidents, optionally filtered by status or severity.',
    {
      status: z.string().optional().describe('Filter by incident status'),
      severity: z.string().optional().describe('Filter by incident severity'),
      page: z.string().optional().describe('Page number for pagination'),
      limit: z.string().optional().describe('Maximum number of incidents to return'),
    },
    ({ status, severity, page, limit }) =>
      callApi(() => client.get('/api/v1/response/incidents', { status, severity, page, limit })),
  );

  server.tool(
    'create_incident',
    'Create a new response incident.',
    {
      title: z.string().describe('Title of the incident'),
      severity: SEVERITY.describe('Severity of the incident'),
      summary: z.string().optional().describe('Summary of the incident'),
      commanderUserId: z.string().optional().describe('User ID of the incident commander'),
      services: z
        .array(
          z.object({
            monitorId: z.string().optional().describe('Monitor ID for the affected service'),
            staticComponentId: z.string().optional().describe('Static component ID for the affected service'),
            displayName: z.string().describe('Display name for the affected service'),
          }),
        )
        .optional()
        .describe('Services affected by the incident'),
    },
    ({ title, severity, ...rest }) =>
      callApi(() => client.post('/api/v1/response/incidents', { title, severity, ...rest })),
  );

  server.tool(
    'get_incident',
    'Get details of a specific response incident.',
    {
      id: z.string().describe('The incident ID'),
    },
    ({ id }) => callApi(() => client.get(`/api/v1/response/incidents/${id}`)),
  );

  server.tool(
    'update_incident',
    'Update an existing response incident.',
    {
      id: z.string().describe('The incident ID'),
      title: z.string().optional().describe('Title of the incident'),
      summary: z.string().optional().describe('Summary of the incident'),
      severity: SEVERITY.optional().describe('Severity of the incident'),
      status: INCIDENT_STATUS.optional().describe('Status of the incident'),
    },
    ({ id, ...rest }) => callApi(() => client.patch(`/api/v1/response/incidents/${id}`, rest)),
  );

  server.tool(
    'resolve_incident',
    'Resolve a response incident.',
    {
      id: z.string().describe('The incident ID'),
    },
    ({ id }) => callApi(() => client.post(`/api/v1/response/incidents/${id}/resolve`, {})),
  );

  server.tool(
    'close_incident',
    'Close a response incident.',
    {
      id: z.string().describe('The incident ID'),
    },
    ({ id }) => callApi(() => client.post(`/api/v1/response/incidents/${id}/close`, {})),
  );

  server.tool(
    'assign_incident_role',
    'Assign a role to a user on a response incident.',
    {
      id: z.string().describe('The incident ID'),
      userId: z.string().describe('User ID to assign the role to'),
      role: z.enum(['commander', 'comms_lead', 'responder']).describe('Role to assign'),
    },
    ({ id, ...rest }) => callApi(() => client.post(`/api/v1/response/incidents/${id}/roles`, rest)),
  );

  server.tool(
    'remove_incident_role',
    'Remove a role assignment from a response incident.',
    {
      id: z.string().describe('The incident ID'),
      roleId: z.string().describe('The role assignment ID'),
    },
    ({ id, roleId }) => callApi(() => client.delete(`/api/v1/response/incidents/${id}/roles/${roleId}`)),
  );

  server.tool(
    'add_incident_service',
    'Add an affected service to a response incident.',
    {
      id: z.string().describe('The incident ID'),
      monitorId: z.string().optional().describe('Monitor ID for the affected service'),
      staticComponentId: z.string().optional().describe('Static component ID for the affected service'),
      displayName: z.string().describe('Display name for the affected service'),
    },
    ({ id, ...rest }) => callApi(() => client.post(`/api/v1/response/incidents/${id}/services`, rest)),
  );

  server.tool(
    'remove_incident_service',
    'Remove an affected service from a response incident.',
    {
      id: z.string().describe('The incident ID'),
      serviceId: z.string().describe('The service ID'),
    },
    ({ id, serviceId }) => callApi(() => client.delete(`/api/v1/response/incidents/${id}/services/${serviceId}`)),
  );

  server.tool(
    'assign_incident_type',
    'Assign an incident type to a response incident.',
    {
      id: z.string().describe('The incident ID'),
      typeId: z.string().optional().describe('The incident type ID'),
    },
    ({ id, ...rest }) => callApi(() => client.patch(`/api/v1/response/incidents/${id}/type`, rest)),
  );

  server.tool(
    'publish_incident_status_update',
    'Publish a status page update from a response incident.',
    {
      id: z.string().describe('The incident ID'),
      statusPageId: z.string().describe('The status page ID to publish the update to'),
      title: z.string().describe('Title of the status update'),
      body: z.string().describe('Body of the status update'),
      impact: IMPACT.describe('Impact level of the status update'),
      components: z
        .array(
          z.object({
            monitorId: z.string().optional().describe('Monitor ID of the affected component'),
            staticComponentId: z.string().optional().describe('Static component ID of the affected component'),
            status: COMPONENT_STATUS.describe('Status of the component'),
          }),
        )
        .describe('Components affected by the status update'),
    },
    ({ id, ...rest }) =>
      callApi(() => client.post(`/api/v1/response/incidents/${id}/publish-status-update`, rest)),
  );

  // ─── Actions ──────────────────────────────────────────────────────────────

  server.tool(
    'list_incident_actions',
    'List actions for a response incident.',
    {
      incidentId: z.string().describe('The incident ID'),
    },
    ({ incidentId }) => callApi(() => client.get(`/api/v1/response/incidents/${incidentId}/actions`)),
  );

  server.tool(
    'create_incident_action',
    'Create an action item for a response incident.',
    {
      incidentId: z.string().describe('The incident ID'),
      title: z.string().describe('Title of the action item'),
      description: z.string().optional().describe('Description of the action item'),
      assignedToUserId: z.string().optional().describe('User ID the action item is assigned to'),
    },
    ({ incidentId, ...rest }) =>
      callApi(() => client.post(`/api/v1/response/incidents/${incidentId}/actions`, rest)),
  );

  server.tool(
    'update_incident_action',
    'Update an action item on a response incident.',
    {
      incidentId: z.string().describe('The incident ID'),
      actionId: z.string().describe('The action item ID'),
      title: z.string().optional().describe('Title of the action item'),
      description: z.string().optional().describe('Description of the action item'),
      assignedToUserId: z.string().optional().describe('User ID the action item is assigned to'),
      status: z.enum(['pending', 'completed']).optional().describe('Status of the action item'),
    },
    ({ incidentId, actionId, ...rest }) =>
      callApi(() => client.patch(`/api/v1/response/incidents/${incidentId}/actions/${actionId}`, rest)),
  );

  server.tool(
    'delete_incident_action',
    'Delete an action item from a response incident.',
    {
      incidentId: z.string().describe('The incident ID'),
      actionId: z.string().describe('The action item ID'),
    },
    ({ incidentId, actionId }) =>
      callApi(() => client.delete(`/api/v1/response/incidents/${incidentId}/actions/${actionId}`)),
  );

  // ─── AI ───────────────────────────────────────────────────────────────────

  server.tool(
    'summarize_incident',
    'Generate an AI summary of a response incident.',
    {
      incidentId: z.string().describe('The incident ID'),
    },
    ({ incidentId }) => callApi(() => client.post(`/api/v1/response/incidents/${incidentId}/ai/summarize`, {})),
  );

  server.tool(
    'draft_incident_status_update',
    'Draft an AI-generated status update for a response incident.',
    {
      incidentId: z.string().describe('The incident ID'),
    },
    ({ incidentId }) =>
      callApi(() => client.post(`/api/v1/response/incidents/${incidentId}/ai/draft-update`, {})),
  );

  // ─── Custom Fields ────────────────────────────────────────────────────────

  server.tool(
    'list_custom_field_definitions',
    'List custom field definitions for response incidents.',
    {},
    () => callApi(() => client.get('/api/v1/response/custom-fields')),
  );

  server.tool(
    'create_custom_field_definition',
    'Create a custom field definition for response incidents.',
    {
      name: z.string().describe('Name of the custom field'),
      fieldType: z.enum(['text', 'number', 'date', 'select']).describe('Type of the custom field'),
      required: z.boolean().optional().describe('Whether the custom field is required'),
      options: z.array(z.string()).optional().describe('Available options for a select field'),
    },
    ({ name, fieldType, ...rest }) =>
      callApi(() => client.post('/api/v1/response/custom-fields', { name, fieldType, ...rest })),
  );

  server.tool(
    'delete_custom_field_definition',
    'Delete a custom field definition.',
    {
      fieldId: z.string().describe('The custom field definition ID'),
    },
    ({ fieldId }) => callApi(() => client.delete(`/api/v1/response/custom-fields/${fieldId}`)),
  );

  server.tool(
    'get_incident_custom_field_values',
    'Get custom field values set on a response incident.',
    {
      incidentId: z.string().describe('The incident ID'),
    },
    ({ incidentId }) => callApi(() => client.get(`/api/v1/response/incidents/${incidentId}/custom-fields`)),
  );

  server.tool(
    'set_incident_custom_field_value',
    'Set a custom field value on a response incident.',
    {
      incidentId: z.string().describe('The incident ID'),
      fieldId: z.string().describe('The custom field definition ID'),
      value: z.string().describe('Value to set for the custom field'),
    },
    ({ incidentId, fieldId, value }) =>
      callApi(() => client.put(`/api/v1/response/incidents/${incidentId}/custom-fields/${fieldId}`, { value })),
  );

  // ─── Escalations ──────────────────────────────────────────────────────────

  server.tool(
    'list_incident_escalations',
    'List escalations for a response incident.',
    {
      incidentId: z.string().describe('The incident ID'),
    },
    ({ incidentId }) => callApi(() => client.get(`/api/v1/response/incidents/${incidentId}/escalations`)),
  );

  server.tool(
    'create_incident_escalation',
    'Create an escalation for a response incident.',
    {
      incidentId: z.string().describe('The incident ID'),
      escalatedToUserId: z.string().describe('User ID the incident is escalated to'),
      reason: z.string().describe('Reason for the escalation'),
      priority: z.enum(['p0', 'p1', 'p2', 'p3']).optional().describe('Priority of the escalation'),
    },
    ({ incidentId, ...rest }) =>
      callApi(() => client.post(`/api/v1/response/incidents/${incidentId}/escalations`, rest)),
  );

  // ─── Incident Types ───────────────────────────────────────────────────────

  server.tool(
    'list_incident_types',
    'List incident types.',
    {},
    () => callApi(() => client.get('/api/v1/response/incident-types')),
  );

  server.tool(
    'create_incident_type',
    'Create an incident type.',
    {
      name: z.string().describe('Name of the incident type'),
      description: z.string().optional().describe('Description of the incident type'),
      color: z.string().optional().describe('Color associated with the incident type'),
    },
    ({ name, ...rest }) => callApi(() => client.post('/api/v1/response/incident-types', { name, ...rest })),
  );

  server.tool(
    'update_incident_type',
    'Update an incident type.',
    {
      typeId: z.string().describe('The incident type ID'),
      name: z.string().optional().describe('Name of the incident type'),
      description: z.string().optional().describe('Description of the incident type'),
      color: z.string().optional().describe('Color associated with the incident type'),
    },
    ({ typeId, ...rest }) => callApi(() => client.patch(`/api/v1/response/incident-types/${typeId}`, rest)),
  );

  server.tool(
    'delete_incident_type',
    'Delete an incident type.',
    {
      typeId: z.string().describe('The incident type ID'),
    },
    ({ typeId }) => callApi(() => client.delete(`/api/v1/response/incident-types/${typeId}`)),
  );

  // ─── Notebook ─────────────────────────────────────────────────────────────

  server.tool(
    'create_incident_notebook',
    'Create and link a notebook for a response incident.',
    {
      incidentId: z.string().describe('The incident ID'),
    },
    ({ incidentId }) => callApi(() => client.post(`/api/v1/response/incidents/${incidentId}/notebook`, {})),
  );

  server.tool(
    'get_incident_notebook',
    'Get the notebook linked to a response incident.',
    {
      incidentId: z.string().describe('The incident ID'),
    },
    ({ incidentId }) => callApi(() => client.get(`/api/v1/response/incidents/${incidentId}/notebook`)),
  );

  // ─── Participants ─────────────────────────────────────────────────────────

  server.tool(
    'list_incident_participants',
    'List participants of a response incident.',
    {
      incidentId: z.string().describe('The incident ID'),
    },
    ({ incidentId }) => callApi(() => client.get(`/api/v1/response/incidents/${incidentId}/participants`)),
  );

  server.tool(
    'join_incident',
    'Join a response incident as a participant.',
    {
      incidentId: z.string().describe('The incident ID'),
      userId: z.string().optional().describe('User ID to add as a participant (defaults to the caller)'),
    },
    ({ incidentId, ...rest }) =>
      callApi(() => client.post(`/api/v1/response/incidents/${incidentId}/participants`, rest)),
  );

  server.tool(
    'leave_incident',
    'Leave a response incident (remove a participant).',
    {
      incidentId: z.string().describe('The incident ID'),
      userId: z.string().describe('User ID of the participant to remove'),
    },
    ({ incidentId, userId }) =>
      callApi(() => client.delete(`/api/v1/response/incidents/${incidentId}/participants/${userId}`)),
  );

  // ─── Related Incidents ────────────────────────────────────────────────────

  server.tool(
    'list_related_incidents',
    'List incidents related to a response incident.',
    {
      incidentId: z.string().describe('The incident ID'),
    },
    ({ incidentId }) => callApi(() => client.get(`/api/v1/response/incidents/${incidentId}/related`)),
  );

  server.tool(
    'add_related_incident',
    'Link a related incident to a response incident.',
    {
      incidentId: z.string().describe('The incident ID'),
      relatedIncidentId: z.string().describe('ID of the related incident'),
      relationshipType: z
        .enum(['related', 'duplicate', 'parent', 'child'])
        .optional()
        .describe('Type of relationship between the incidents'),
    },
    ({ incidentId, ...rest }) => callApi(() => client.post(`/api/v1/response/incidents/${incidentId}/related`, rest)),
  );

  server.tool(
    'remove_related_incident',
    'Remove a related incident link.',
    {
      incidentId: z.string().describe('The incident ID'),
      relatedId: z.string().describe('The related incident link ID'),
    },
    ({ incidentId, relatedId }) =>
      callApi(() => client.delete(`/api/v1/response/incidents/${incidentId}/related/${relatedId}`)),
  );

  // ─── Timeline ─────────────────────────────────────────────────────────────

  server.tool(
    'list_incident_timeline',
    'List timeline events for a response incident.',
    {
      incidentId: z.string().describe('The incident ID'),
      page: z.string().optional().describe('Page number for pagination'),
      limit: z.string().optional().describe('Maximum number of timeline events to return'),
    },
    ({ incidentId, page, limit }) =>
      callApi(() => client.get(`/api/v1/response/incidents/${incidentId}/timeline`, { page, limit })),
  );

  server.tool(
    'add_incident_timeline_note',
    'Add a note to the timeline of a response incident.',
    {
      incidentId: z.string().describe('The incident ID'),
      content: z.string().describe('Content of the note'),
    },
    ({ incidentId, content }) =>
      callApi(() => client.post(`/api/v1/response/incidents/${incidentId}/timeline/notes`, { content })),
  );
}
