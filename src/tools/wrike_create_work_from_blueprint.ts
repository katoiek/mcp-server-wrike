import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WrikeFolderBlueprintLaunchData, WrikeCustomField } from '../types/wrike.js';
import { createWrikeClient } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

// Custom field schema for validation
const customFieldSchema = z.object({
  id: z.string().describe('Custom field ID'),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]).describe('Custom field value')
});

/**
 * Tool to create work from a folder blueprint in Wrike
 * @param server McpServer instance
 */
export function registerWrikeCreateWorkFromBlueprintTool(server: McpServer): void {
  server.tool(
    'wrike_create_work_from_blueprint',
    {
      folder_blueprint_id: z.string().describe('ID of the folder blueprint to launch'),
      parent_id: z.string().describe('ID of the parent folder where the blueprint will be created'),
      title: z.string().describe('Title for the created work'),
      description: z.string().optional().describe('Description for the created work'),
      project: z.object({
        ownerIds: z.array(z.string()).optional().describe('Array of user IDs who will be project owners'),
        status: z.string().optional().describe('Project status'),
        startDate: z.string().optional().describe('Project start date in ISO format (YYYY-MM-DD)'),
        endDate: z.string().optional().describe('Project end date in ISO format (YYYY-MM-DD)')
      }).optional().describe('Project specific settings'),
      shareds: z.array(z.string()).optional().describe('Array of user IDs to share the folder with'),
      custom_fields: z.array(customFieldSchema).optional().describe('Array of custom fields'),
      follow: z.boolean().optional().describe('Whether the current user should follow the created work'),
      copy_descriptions: z.boolean().optional().describe('Whether to copy descriptions from the blueprint'),
      copy_responsibles: z.boolean().optional().describe('Whether to copy responsibles from the blueprint'),
      copy_custom_fields: z.boolean().optional().describe('Whether to copy custom fields from the blueprint'),
      copy_custom_statuses: z.boolean().optional().describe('Whether to copy custom statuses from the blueprint')
    },
    async ({ folder_blueprint_id, parent_id, title, description, project, shareds, custom_fields, follow, copy_descriptions, copy_responsibles, copy_custom_fields, copy_custom_statuses }) => {
      try {
        const wrikeClient = createWrikeClient();

        logger.debug(`Launching folder blueprint: ${folder_blueprint_id} with parent: ${parent_id}`);

        // Prepare launch data
        const launchData: WrikeFolderBlueprintLaunchData = {
          title,
          parent: parent_id // Now directly using the string ID
        };

        // Add optional parameters if provided
        if (description) {
          launchData.description = description;
        }

        if (project) {
          launchData.project = {};
          if (project.ownerIds) launchData.project.ownerIds = project.ownerIds;
          if (project.status) launchData.project.status = project.status;
          if (project.startDate) launchData.project.startDate = project.startDate;
          if (project.endDate) launchData.project.endDate = project.endDate;
        }

        if (shareds && shareds.length > 0) {
          launchData.shareds = shareds;
        }

        if (custom_fields && custom_fields.length > 0) {
          launchData.customFields = custom_fields as WrikeCustomField[];
        }

        if (follow !== undefined) {
          launchData.follow = follow;
        }

        if (copy_descriptions !== undefined) {
          launchData.copyDescriptions = copy_descriptions;
        }

        if (copy_responsibles !== undefined) {
          launchData.copyResponsibles = copy_responsibles;
        }

        if (copy_custom_fields !== undefined) {
          launchData.copyCustomFields = copy_custom_fields;
        }

        if (copy_custom_statuses !== undefined) {
          launchData.copyCustomStatuses = copy_custom_statuses;
        }

        logger.debug('Launch data:', launchData);

        // Launch the blueprint asynchronously
        const asyncJobId = await wrikeClient.launchFolderBlueprintAsync(folder_blueprint_id, launchData);

        return {
          content: [{
            type: 'text',
            text: `Successfully launched folder blueprint. Async job ID: ${asyncJobId}`
          }]
        };
      } catch (error) {
        logger.error('Error launching folder blueprint:', error);

        // Provide more detailed error information
        let errorMessage = (error as Error).message;
        if ((error as any).response && (error as any).response.data) {
          errorMessage += ` - Details: ${JSON.stringify((error as any).response.data)}`;
        }

        return {
          content: [{
            type: 'text',
            text: `Error launching folder blueprint: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );
}
