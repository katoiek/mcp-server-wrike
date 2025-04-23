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
export function registerWrikeCreateWorkFromFolderBlueprintTool(server: McpServer): void {
  server.tool(
    'wrike_create_work_from_folder_blueprint',
    {
      folder_blueprint_id: z.string().describe('ID of the folder blueprint to launch'),
      parent_id: z.string().describe('ID of the parent folder where the blueprint will be created'),
      title: z.string().describe('Title for the created work'),
      title_prefix: z.string().optional().describe('Title prefix for all copied tasks'),
      description: z.string().optional().describe('Description for the created work'),
      copy_descriptions: z.boolean().optional().describe('Copy descriptions or leave empty (default: true)'),
      notify_responsibles: z.boolean().optional().describe('Notify those responsible (default: true)'),
      copy_responsibles: z.boolean().optional().describe('Copy those responsible (default: true)'),
      copy_custom_fields: z.boolean().optional().describe('Copy custom fields (default: true)'),
      copy_attachments: z.boolean().optional().describe('Copy attachments (default: false)'),
      custom_fields: z.array(customFieldSchema).optional().describe('Array of custom fields'),
      reschedule_date: z.string().optional().describe('Date to use in task rescheduling (format: YYYY-MM-DD)'),
      reschedule_mode: z.enum(['Start', 'End', 'start', 'end']).optional().describe('Mode for rescheduling: Start/start (tasks start from reschedule date) or End/end (tasks end with reschedule date)'),
      entry_limit: z.number().min(1).max(250).optional().describe('Maximum number of tasks/folders in tree for copy (1-250, default: 250)')
    },
    async ({ folder_blueprint_id, parent_id, title, title_prefix, description, copy_descriptions, notify_responsibles, copy_responsibles, copy_custom_fields, copy_attachments, custom_fields, reschedule_date, reschedule_mode, entry_limit }) => {
      try {
        const wrikeClient = createWrikeClient();

        logger.debug(`Launching folder blueprint: ${folder_blueprint_id} with parent: ${parent_id}`);

        // Prepare launch data
        const launchData: WrikeFolderBlueprintLaunchData = {
          title,
          parent: parent_id // Now directly using the string ID
        };

        // Add optional parameters if provided
        if (title_prefix) {
          launchData.titlePrefix = title_prefix;
        }

        if (description) {
          launchData.description = description;
        }

        if (copy_descriptions !== undefined) {
          launchData.copyDescriptions = copy_descriptions;
        }

        if (notify_responsibles !== undefined) {
          launchData.notifyResponsibles = notify_responsibles;
        }

        if (copy_responsibles !== undefined) {
          launchData.copyResponsibles = copy_responsibles;
        }

        if (copy_custom_fields !== undefined) {
          launchData.copyCustomFields = copy_custom_fields;
        }

        if (copy_attachments !== undefined) {
          launchData.copyAttachments = copy_attachments;
        }

        if (custom_fields && custom_fields.length > 0) {
          launchData.customFields = custom_fields as WrikeCustomField[];
        }

        // Add reschedule parameters if provided
        if (reschedule_date) {
          launchData.rescheduleDate = reschedule_date;
        }

        if (reschedule_mode) {
          launchData.rescheduleMode = reschedule_mode;
        }

        if (entry_limit !== undefined) {
          launchData.entryLimit = entry_limit;
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
