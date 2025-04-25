import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WrikeSpace } from '../types/wrike.js';
import { createWrikeClient, parseOptFields } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

/**
 * Tool to get spaces information
 * @param server McpServer instance
 */
export function registerWrikeGetSpaceTool(server: McpServer): void {
  server.tool(
    'wrike_get_space',
    'Get spaces information from Wrike',
    {
      space_id: z.string().optional().describe('Space ID to get specific space. If not provided, all spaces will be returned'),
      opt_fields: z.string().optional().describe('Comma-separated list of optional fields to include')
    },
    async ({ space_id, opt_fields }) => {
      try {
        const wrikeClient = createWrikeClient();
        const params = parseOptFields(opt_fields);
        let response;
        let spaces;

        if (space_id) {
          logger.debug(`Getting Wrike space with ID: ${space_id}`);
          response = await wrikeClient.client.get(`/spaces/${space_id}`, { params });
          spaces = wrikeClient.handleResponse<WrikeSpace[]>(response);
        } else {
          logger.debug('Listing all Wrike spaces');
          response = await wrikeClient.client.get('/spaces', { params });
          spaces = wrikeClient.handleResponse<WrikeSpace[]>(response);
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(spaces, null, 2)
          }]
        };
      } catch (error) {
        const errorMessage = space_id
          ? `Error getting space with ID ${space_id}: ${(error as Error).message}`
          : `Error listing spaces: ${(error as Error).message}`;

        logger.error(errorMessage, error);
        return {
          content: [{
            type: 'text',
            text: errorMessage
          }],
          isError: true
        };
      }
    }
  );
}
