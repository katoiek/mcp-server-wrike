import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WrikeCustomItemType } from '../types/wrike.js';
import { createWrikeClient, parseOptFields } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

/**
 * Tool to retrieve custom item types information
 * @param server McpServer instance
 */
export function registerWrikeGetCustomItemTypesTool(server: McpServer): void {
  server.tool(
    'wrike_get_custom_item_types',
    {
      id: z.string().optional().describe('Custom item type ID (if specified, retrieves a specific custom item type)'),
      opt_fields: z.string().optional().describe('Comma-separated list of field names to include')
    },
    async ({ id, opt_fields }) => {
      try {
        const wrikeClient = createWrikeClient();
        const params = parseOptFields(opt_fields);
        let customItemTypes: WrikeCustomItemType[] = [];
        let responseText = '';

        if (id) {
          // Retrieve a specific custom item type
          logger.debug(`Getting custom item type: ${id}`);
          const response = await wrikeClient.client.get(`/custom_item_types/${id}`, { params });
          customItemTypes = wrikeClient.handleResponse<WrikeCustomItemType[]>(response);
          responseText = `Custom item type with ID: ${id}`;
        } else {
          // Retrieve all custom item types
          logger.debug('Getting all custom item types');
          const response = await wrikeClient.client.get('/custom_item_types', { params });
          customItemTypes = wrikeClient.handleResponse<WrikeCustomItemType[]>(response);
          responseText = 'All custom item types';
        }

        if (customItemTypes.length === 0) {
          return {
            content: [{
              type: 'text',
              text: `No custom item types found for the given criteria`
            }],
            isError: false
          };
        }

        return {
          content: [{
            type: 'text',
            text: `${responseText}\n${JSON.stringify(customItemTypes, null, 2)}`
          }]
        };
      } catch (error) {
        logger.error(`Error getting custom item types:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error getting custom item types: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );
}
