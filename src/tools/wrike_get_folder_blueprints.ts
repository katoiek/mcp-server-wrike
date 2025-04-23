import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WrikeFolderBlueprint } from '../types/wrike.js';
import { createWrikeClient } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';
import { parseOptFields } from '../utils/helpers.js';

/**
 * Tool to get folder blueprints from Wrike
 * @param server McpServer instance
 */
export function registerWrikeGetFolderBlueprintsTool(server: McpServer): void {
  server.tool(
    'wrike_get_folder_blueprints',
    {
      space_id: z.string().optional().describe('Space ID to get folder blueprints from (optional)'),
      opt_fields: z.string().optional().describe('Optional fields to include in the response (comma-separated)')
    },
    async ({ space_id, opt_fields }) => {
      try {
        const wrikeClient = createWrikeClient();
        const params = parseOptFields(opt_fields);

        let blueprints: WrikeFolderBlueprint[];

        if (space_id) {
          logger.debug(`Getting folder blueprints for space: ${space_id}`);
          blueprints = await wrikeClient.getFolderBlueprintsBySpace(space_id, params);
        } else {
          logger.debug('Getting all folder blueprints');
          blueprints = await wrikeClient.getFolderBlueprints(params);
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(blueprints, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Error getting folder blueprints:', error);
        return {
          content: [{
            type: 'text',
            text: `Error getting folder blueprints: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );
}
