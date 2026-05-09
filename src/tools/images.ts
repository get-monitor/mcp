import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GetMonitorClient } from '../client/api-client.js';
import { callApi, text, type ToolResponse } from './helpers.js';

export function registerImageTools(server: McpServer, client: GetMonitorClient): void {
  server.tool(
    'record_image_upload',
    'Record an uploaded image in the database.',
    {
      url: z.string().describe('URL of the uploaded image'),
      filename: z.string().describe('Original filename of the image'),
      size: z.number().describe('File size in bytes'),
      type: z.enum(['profile', 'logo', 'status-page']).describe('Type of image (profile, logo, or status-page)'),
      entityId: z.string().describe('ID of the entity the image belongs to'),
      entityType: z.enum(['user', 'organization', 'status_page']).describe('Type of entity (user, organization, or status_page)'),
    },
    ({ url, filename, size, type, entityId, entityType }) =>
      callApi(() => client.post('/api/v1/images/record', { url, filename, size, type, entityId, entityType })),
  );

  server.tool(
    'delete_image',
    'Delete an image.',
    {
      url: z.string().describe('URL of the image to delete'),
      entityType: z.enum(['user', 'organization', 'status_page']).describe('Type of entity the image belongs to (user, organization, or status_page)'),
      entityId: z.string().describe('ID of the entity the image belongs to'),
    },
    ({ url, entityType, entityId }) =>
      callApi(() => client.delete('/api/v1/images', { url, entityType, entityId })),
  );

  server.tool(
    'replace_image',
    'Replace an image with a new one.',
    {
      oldUrl: z.string().optional().describe('URL of the old image to replace'),
      newUrl: z.string().describe('URL of the new image'),
      entityType: z.enum(['user', 'organization', 'status_page']).describe('Type of entity (user, organization, or status_page)'),
      entityId: z.string().describe('ID of the entity the image belongs to'),
    },
    ({ oldUrl, newUrl, entityType, entityId }) =>
      callApi(() => client.put('/api/v1/images/replace', { oldUrl, newUrl, entityType, entityId })),
  );

  server.tool(
    'get_image_placeholder',
    'Get a placeholder image URL.',
    {
      type: z.string().describe('Type of placeholder image'),
      size: z.string().describe('Size of the placeholder'),
      name: z.string().describe('Name or identifier for the placeholder'),
    },
    ({ type, size, name }) =>
      callApi(() => client.get('/api/v1/images/placeholder', { type, size, name })),
  );

  server.tool(
    'get_image_constraints',
    'Get constraints for image uploads.',
    {
      type: z.string().describe('Type of image to get constraints for'),
    },
    ({ type }) =>
      callApi(() => client.get('/api/v1/images/constraints', { type })),
  );

  server.tool(
    'update_entity_image',
    'Update the image for an entity.',
    {
      entityType: z.enum(['user', 'organization', 'status_page']).describe('Type of entity (user, organization, or status_page)'),
      entityId: z.string().describe('ID of the entity'),
      imageUrl: z.string().nullable().optional().describe('URL of the new image, or null to remove the image'),
    },
    ({ entityType, entityId, imageUrl }) =>
      callApi(() => client.patch('/api/v1/images/entity', { entityType, entityId, imageUrl })),
  );

  server.tool(
    'cleanup_image_database',
    'Clean up unused images in the database.',
    {},
    () => callApi(() => client.post('/api/v1/images/cleanup', {})),
  );
}
