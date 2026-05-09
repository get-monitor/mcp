import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GetMonitorClient } from '../client/api-client.js';
import { callApi, text, type ToolResponse } from './helpers.js';

export function registerOrganizationTools(server: McpServer, client: GetMonitorClient): void {
  server.tool(
    'check_organization_slug',
    'Check whether an organization slug is available for use.',
    {
      slug: z.string().describe('The organization slug to check for availability'),
    },
    ({ slug }) => callApi(() => client.get('/api/v1/organizations/check-slug', { slug })),
  );

  server.tool(
    'create_organization',
    'Create a new organization.',
    {
      name: z.string().describe('Display name of the organization'),
      slug: z.string().describe('URL-friendly unique identifier for the organization'),
      logo: z.string().optional().describe('URL of the organization logo image'),
      email: z.string().optional().describe('Contact email address for the organization'),
      phoneNumber: z.string().optional().describe('Contact phone number for the organization'),
    },
    ({ name, slug, logo, email, phoneNumber }) =>
      callApi(() => client.post('/api/v1/organizations', { name, slug, logo, email, phoneNumber })),
  );

  server.tool(
    'list_organizations',
    'List all organizations the authenticated user belongs to.',
    {},
    () => callApi(() => client.get('/api/v1/organizations')),
  );

  server.tool(
    'list_guest_access_organizations',
    'List organizations the authenticated user has guest access to.',
    {},
    () => callApi(() => client.get('/api/v1/organizations/guest-access')),
  );

  server.tool(
    'get_user_organization_roles',
    'Get the roles the authenticated user has across all organizations.',
    {},
    () => callApi(() => client.get('/api/v1/organizations/roles')),
  );

  server.tool(
    'list_organization_members',
    'List all members of a specific organization.',
    {
      orgId: z.string().describe('The organization ID'),
    },
    ({ orgId }) => callApi(() => client.get(`/api/v1/organizations/${orgId}/members`)),
  );

  server.tool(
    'list_organization_invitations',
    'List all pending invitations for a specific organization.',
    {
      orgId: z.string().describe('The organization ID'),
    },
    ({ orgId }) => callApi(() => client.get(`/api/v1/organizations/${orgId}/invitations`)),
  );

  server.tool(
    'get_organization',
    'Get details about a specific organization.',
    {
      orgId: z.string().describe('The organization ID'),
    },
    ({ orgId }) => callApi(() => client.get(`/api/v1/organizations/${orgId}`)),
  );

  server.tool(
    'update_organization',
    'Update details of a specific organization.',
    {
      orgId: z.string().describe('The organization ID'),
      name: z.string().optional().describe('New display name for the organization'),
      logo: z.string().optional().describe('New URL of the organization logo image'),
      email: z.string().optional().describe('New contact email address for the organization'),
      phoneNumber: z.string().optional().describe('New contact phone number for the organization'),
    },
    ({ orgId, name, logo, email, phoneNumber }) =>
      callApi(() => client.patch(`/api/v1/organizations/${orgId}`, { name, logo, email, phoneNumber })),
  );

  server.tool(
    'update_organization_language',
    'Update the default language setting for a specific organization.',
    {
      orgId: z.string().describe('The organization ID'),
      language: z.enum(['en-US', 'pt-BR']).describe('The language code to set as the organization default (en-US or pt-BR)'),
    },
    ({ orgId, language }) =>
      callApi(() => client.patch(`/api/v1/organizations/${orgId}/language`, { language })),
  );

  server.tool(
    'get_organization_status',
    'Get the current operational status of a specific organization.',
    {
      orgId: z.string().describe('The organization ID'),
    },
    ({ orgId }) => callApi(() => client.get(`/api/v1/organizations/${orgId}/status`)),
  );

  server.tool(
    'invite_organization_member',
    'Send an invitation to a user to join an organization.',
    {
      orgId: z.string().describe('The organization ID'),
      email: z.string().describe('Email address of the user to invite'),
      role: z.enum(['member', 'page_guest']).describe('Role to assign to the invited user (member or page_guest)'),
    },
    ({ orgId, email, role }) =>
      callApi(() => client.post(`/api/v1/organizations/${orgId}/members/invite`, { email, role })),
  );

  server.tool(
    'remove_organization_member',
    'Remove a member from an organization.',
    {
      orgId: z.string().describe('The organization ID'),
      userId: z.string().describe('The user ID of the member to remove'),
    },
    ({ orgId, userId }) =>
      callApi(() => client.delete(`/api/v1/organizations/${orgId}/members/${userId}`)),
  );

  server.tool(
    'update_organization_member_role',
    'Update the role of an existing organization member.',
    {
      orgId: z.string().describe('The organization ID'),
      userId: z.string().describe('The user ID of the member whose role is being updated'),
      role: z.enum(['member', 'page_guest']).describe('New role to assign to the member (member or page_guest)'),
    },
    ({ orgId, userId, role }) =>
      callApi(() => client.patch(`/api/v1/organizations/${orgId}/members/${userId}/role`, { role })),
  );

  server.tool(
    'get_organization_subscription',
    'Get subscription details for a specific organization.',
    {
      organizationId: z.string().describe('The organization ID'),
    },
    ({ organizationId }) =>
      callApi(() => client.get(`/api/v1/organizations/${organizationId}/subscription`)),
  );

  server.tool(
    'get_organization_usage',
    'Get usage statistics for a specific organization subscription.',
    {
      organizationId: z.string().describe('The organization ID'),
    },
    ({ organizationId }) =>
      callApi(() => client.get(`/api/v1/organizations/${organizationId}/subscription/usage`)),
  );

  server.tool(
    'get_invitation',
    'Get details about a specific invitation.',
    {
      invitationId: z.string().describe('The invitation ID'),
    },
    ({ invitationId }) =>
      callApi(() => client.get(`/api/v1/invitations/${invitationId}`)),
  );

  server.tool(
    'accept_invitation',
    'Accept a pending organization invitation.',
    {
      invitationId: z.string().describe('The invitation ID to accept'),
    },
    ({ invitationId }) =>
      callApi(() => client.post(`/api/v1/invitations/${invitationId}/accept`, {})),
  );
}
