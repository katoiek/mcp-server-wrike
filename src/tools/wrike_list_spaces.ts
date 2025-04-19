import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WrikeSpace } from '../types/wrike.js';
import { createWrikeClient, parseOptFields } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

/**
 * Tool to list all spaces
 * @param server McpServer instance
 */
export function registerWrikeListSpacesTool(server: McpServer): void {
  server.tool(
    'wrike_list_spaces',
    'List all available spaces in Wrike',
    {
      opt_fields: z.string().optional().describe('Comma-separated list of optional fields to include')
    },
    async ({ opt_fields }) => {
      try {
        logger.debug('Listing Wrike spaces');
        const wrikeClient = createWrikeClient();
        const params = parseOptFields(opt_fields);

        const response = await wrikeClient.client.get('/spaces', { params });
        const spaces = wrikeClient.handleResponse<WrikeSpace[]>(response);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(spaces, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Error listing spaces:', error);
        return {
          content: [{
            type: 'text',
            text: `Error listing spaces: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );
}
