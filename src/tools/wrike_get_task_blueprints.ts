import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WrikeTaskBlueprint } from '../types/wrike.js';
import { createWrikeClient } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

/**
 * Tool to get task blueprints from Wrike
 * @param server McpServer instance
 */
export function registerWrikeGetTaskBlueprintsTool(server: McpServer): void {
  server.tool(
    'wrike_get_task_blueprints',
    {
      space_id: z.string().optional().describe('Space ID (if specified, retrieves task blueprints from this space)')
    },
    async ({ space_id }) => {
      try {
        const wrikeClient = createWrikeClient();

        // Prepare parameters (empty as API doesn't support query parameters for these endpoints)
        const params: Record<string, any> = {};

        let taskBlueprints: WrikeTaskBlueprint[] = [];

        // If space_id is provided, get task blueprints from that space
        if (space_id) {
          logger.debug(`Getting task blueprints from space: ${space_id}`);
          taskBlueprints = await wrikeClient.getTaskBlueprintsBySpace(space_id, params);
        }
        // Otherwise, get all task blueprints
        else {
          logger.debug('Getting all task blueprints');
          taskBlueprints = await wrikeClient.getTaskBlueprints(params);
        }

        return {
          content: [{
            type: 'text',
            text: `Found ${taskBlueprints.length} task blueprint(s):\n${JSON.stringify(taskBlueprints, null, 2)}`
          }]
        };
      } catch (error) {
        logger.error('Error getting task blueprints:', error);

        // Provide more detailed error information
        let errorMessage = (error as Error).message;
        if ((error as any).response && (error as any).response.data) {
          errorMessage += ` - Details: ${JSON.stringify((error as any).response.data)}`;
        }

        return {
          content: [{
            type: 'text',
            text: `Error getting task blueprints: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );
}
