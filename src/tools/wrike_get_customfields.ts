import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createWrikeClient, parseOptFields } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';
import { WrikeCustomFieldDefinition } from '../types/wrike.js';

/**
 * Register the wrike_get_customfields tool with the MCP server
 * @param server McpServer instance
 */
export function registerWrikeGetCustomfieldsTool(server: McpServer): void {
  server.tool(
    'wrike_get_customfields',
    {
      customfield_ids: z.array(z.string()).optional().describe('Array of custom field IDs to retrieve (up to 100)'),
      opt_fields: z.string().optional().describe('Comma-separated list of optional fields to include')
    },
    async ({ customfield_ids, opt_fields }) => {
      try {
        const wrikeClient = createWrikeClient();
        const params = parseOptFields(opt_fields);
        let customFields: WrikeCustomFieldDefinition[] = [];
        let responseText = '';

        if (customfield_ids && customfield_ids.length > 0) {
          if (customfield_ids.length > 100) {
            return {
              content: [{
                type: 'text',
                text: 'Error: Maximum of 100 custom field IDs allowed'
              }],
              isError: true
            };
          }

          logger.debug(`Getting custom fields by IDs: ${customfield_ids.join(',')}`);
          const response = await wrikeClient.client.get(`/customfields/${customfield_ids.join(',')}`, { params });
          customFields = wrikeClient.handleResponse<WrikeCustomFieldDefinition[]>(response);
          responseText = `Custom fields with IDs: ${customfield_ids.join(',')}`;
        } else {
          logger.debug('Getting all custom fields');
          const response = await wrikeClient.client.get('/customfields', { params });
          customFields = wrikeClient.handleResponse<WrikeCustomFieldDefinition[]>(response);
          responseText = 'All custom fields';
        }

        if (customFields.length === 0) {
          return {
            content: [{
              type: 'text',
              text: 'No custom fields found for the given criteria'
            }],
            isError: false
          };
        }

        return {
          content: [{
            type: 'text',
            text: `${responseText}\n${JSON.stringify(customFields, null, 2)}`
          }]
        };
      } catch (error) {
        logger.error(`Error getting custom fields:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error getting custom fields: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );
}
