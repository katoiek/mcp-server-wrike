import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WrikeFolder, WrikeFolderData, WrikeCustomField } from '../types/wrike.js';
import { createWrikeClient } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

// Define Zod schema for custom fields
const customFieldSchema = z.object({
  id: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()])
}).strict();

/**
 * Tool to create a folder
 * @param server McpServer instance
 */
export function registerWrikeCreateFolderTool(server: McpServer): void {
  server.tool(
    'wrike_create_folder',
    {
      parent_folder_id: z.string().describe('Parent folder ID'),
      title: z.string().describe('Folder title'),
      description: z.string().optional().describe('Folder description'),
      is_project: z.boolean().optional().describe('Whether to create as a project'),
      project_owner_ids: z.array(z.string()).optional().describe('Array of project owner IDs'),
      project_status: z.string().optional().describe('Project status'),
      project_start_date: z.string().optional().describe('Project start date'),
      project_end_date: z.string().optional().describe('Project end date'),
      custom_fields: z.array(customFieldSchema).optional().describe('Array of custom fields')
    },
    async ({ parent_folder_id, title, description, is_project, project_owner_ids, project_status, project_start_date, project_end_date, custom_fields }) => {
      try {
        logger.debug(`Creating folder under parent: ${parent_folder_id}`);
        const wrikeClient = createWrikeClient();

        const data: WrikeFolderData = {
          title,
          description
        };

        // プロジェクト情報を設定
        if (is_project && project_owner_ids && project_owner_ids.length > 0) {
          data.project = {
            ownerIds: project_owner_ids,
            status: project_status,
            startDate: project_start_date,
            endDate: project_end_date
          };
        }

        // カスタムフィールドを設定
        if (custom_fields) {
          data.customFields = custom_fields as WrikeCustomField[];
        }

        const response = await wrikeClient.client.post(`/folders/${parent_folder_id}/folders`, data);
        const folders = wrikeClient.handleResponse<WrikeFolder[]>(response);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(folders[0], null, 2)
          }]
        };
      } catch (error) {
        logger.error(`Error creating folder:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error creating folder: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );
}
