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

// プロジェクトのステータス用のZodスキーマ
const projectStatusSchema = z.enum([
  'Green',
  'Yellow',
  'Red',
  'Completed',
  'OnHold',
  'Cancelled'
]).describe('Project status (Green, Yellow, Red, Completed, OnHold, Cancelled)');

/**
 * Tool to create a folder or project
 * @param server McpServer instance
 */
export function registerWrikeCreateFolderProjectTool(server: McpServer): void {
  // 基本的なフォルダ作成用のスキーマ
  const baseSchema = {
    parent_folder_id: z.string().describe('Parent folder ID'),
    title: z.string().describe('Folder/Project title'),
    description: z.string().optional().describe('Folder/Project description'),
    is_project: z.boolean().default(false).describe('Whether to create as a project'),
    custom_fields: z.array(customFieldSchema).optional().describe('Array of custom fields')
  };

  // プロジェクト固有のフィールド
  const projectFields = {
    project_owner_ids_str: z.string().optional().describe('Comma-separated list of project owner IDs (e.g. "id1,id2,id3")'),
    project_status: projectStatusSchema.optional().describe('Project status'),
    project_start_date: z.string().optional().describe('Project start date (ISO format: YYYY-MM-DD)'),
    project_end_date: z.string().optional().describe('Project end date (ISO format: YYYY-MM-DD)')
  };

  server.tool(
    'wrike_create_folder_project',
    {
      ...baseSchema,
      ...projectFields
    },
    async ({ parent_folder_id, title, description, is_project, project_owner_ids_str, project_status, project_start_date, project_end_date, custom_fields }) => {
      try {
        const entityType = is_project ? 'project' : 'folder';
        logger.debug(`Creating ${entityType} under parent: ${parent_folder_id}`);
        const wrikeClient = createWrikeClient();

        const data: WrikeFolderData = {
          title,
          description
        };

        // プロジェクト情報を設定
        if (is_project) {
          // プロジェクトオブジェクトを初期化
          data.project = {};

          // オプションのプロジェクトパラメータを設定
          if (project_owner_ids_str && project_owner_ids_str.trim() !== '') {
            // カンマ区切りの文字列を配列に変換
            const ownerIds = project_owner_ids_str.split(',').map(id => id.trim()).filter(id => id !== '');
            if (ownerIds.length > 0) {
              data.project.ownerIds = ownerIds;
            }
          }

          if (project_status) {
            data.project.status = project_status;
          }

          if (project_start_date) {
            data.project.startDate = project_start_date;
          }

          if (project_end_date) {
            data.project.endDate = project_end_date;
          }
        }

        // カスタムフィールドを設定
        if (custom_fields && custom_fields.length > 0) {
          data.customFields = custom_fields as WrikeCustomField[];
        }

        const response = await wrikeClient.client.post(`/folders/${parent_folder_id}/folders`, data);
        const folders = wrikeClient.handleResponse<WrikeFolder[]>(response);
        const createdEntity = folders[0];

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(createdEntity, null, 2)
          }]
        };
      } catch (error) {
        logger.error(`Error creating ${is_project ? 'project' : 'folder'}:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error creating ${is_project ? 'project' : 'folder'}: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );
}
