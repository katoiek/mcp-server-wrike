import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WrikeFolder, WrikeRequestParams, WrikeFolderData, WrikeCustomField, WrikeSpace } from '../types/wrike.js';
import { createWrikeClient } from '../utils/helpers.js';
import { parseOptFields } from './client.js';
import { logger } from '../utils/logger.js';

// カスタムフィールドのZodスキーマを定義
const customFieldSchema = z.object({
  id: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()])
}).strict();

/**
 * フォルダ関連のツールを登録する関数
 * @param server McpServerインスタンス
 */
export function registerFolderTools(server: McpServer): void {
  // フォルダ一覧を取得するツール
  server.tool(
    'wrike_list_folders',
    {
      opt_fields: z.string().optional().describe('カンマ区切りのフィールド名リスト')
    },
    async ({ opt_fields }) => {
      try {
        logger.debug('Listing Wrike folders');
        const wrikeClient = createWrikeClient();
        const params = parseOptFields(opt_fields);

        const response = await wrikeClient.client.get('/folders', { params });
        const folders = wrikeClient.handleResponse<WrikeFolder[]>(response);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(folders, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Error listing folders:', error);
        return {
          content: [{
            type: 'text',
            text: `Error listing folders: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  // スペース内のフォルダを取得するツール
  server.tool(
    'wrike_get_folders_by_space',
    {
      space_id: z.string().describe('スペースID'),
      opt_fields: z.string().optional().describe('カンマ区切りのフィールド名リスト')
    },
    async ({ space_id, opt_fields }) => {
      try {
        logger.debug(`Getting folders for space: ${space_id}`);
        const wrikeClient = createWrikeClient();
        const params = parseOptFields(opt_fields);

        const response = await wrikeClient.client.get(`/spaces/${space_id}/folders`, { params });
        const folders = wrikeClient.handleResponse<WrikeFolder[]>(response);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(folders, null, 2)
          }]
        };
      } catch (error) {
        logger.error(`Error getting folders for space ${space_id}:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error getting folders: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  // 親フォルダ内のフォルダを取得するツール
  server.tool(
    'wrike_get_folders_by_parent',
    {
      parent_folder_id: z.string().describe('親フォルダID'),
      opt_fields: z.string().optional().describe('カンマ区切りのフィールド名リスト')
    },
    async ({ parent_folder_id, opt_fields }) => {
      try {
        logger.debug(`Getting folders for parent folder: ${parent_folder_id}`);
        const wrikeClient = createWrikeClient();
        const params = parseOptFields(opt_fields);

        const response = await wrikeClient.client.get(`/folders/${parent_folder_id}/folders`, { params });
        const folders = wrikeClient.handleResponse<WrikeFolder[]>(response);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(folders, null, 2)
          }]
        };
      } catch (error) {
        logger.error(`Error getting folders for parent ${parent_folder_id}:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error getting folders: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  // 複数のフォルダをIDで取得するツール
  server.tool(
    'wrike_get_folders_by_ids',
    {
      folder_ids: z.array(z.string()).describe('フォルダIDの配列（最大100件）'),
      opt_fields: z.string().optional().describe('カンマ区切りのフィールド名リスト')
    },
    async ({ folder_ids, opt_fields }) => {
      try {
        if (!folder_ids || folder_ids.length === 0) {
          return {
            content: [{
              type: 'text',
              text: 'Folder IDs are required'
            }],
            isError: true
          };
        }

        if (folder_ids.length > 100) {
          return {
            content: [{
              type: 'text',
              text: 'Maximum of 100 folder IDs allowed'
            }],
            isError: true
          };
        }

        logger.debug(`Getting folders by IDs: ${folder_ids.join(',')}`);
        const wrikeClient = createWrikeClient();
        const params = parseOptFields(opt_fields);

        const response = await wrikeClient.client.get(`/folders/${folder_ids.join(',')}`, { params });
        const folders = wrikeClient.handleResponse<WrikeFolder[]>(response);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(folders, null, 2)
          }]
        };
      } catch (error) {
        logger.error(`Error getting folders by IDs:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error getting folders: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  // 単一のフォルダを取得するツール
  server.tool(
    'wrike_get_folder',
    {
      folder_id: z.string().describe('フォルダID'),
      opt_fields: z.string().optional().describe('カンマ区切りのフィールド名リスト')
    },
    async ({ folder_id, opt_fields }) => {
      try {
        logger.debug(`Getting folder: ${folder_id}`);
        const wrikeClient = createWrikeClient();
        const params = parseOptFields(opt_fields);

        const response = await wrikeClient.client.get(`/folders/${folder_id}`, { params });
        const folders = wrikeClient.handleResponse<WrikeFolder[]>(response);

        if (folders.length === 0) {
          return {
            content: [{
              type: 'text',
              text: `Folder with ID ${folder_id} not found`
            }],
            isError: true
          };
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(folders[0], null, 2)
          }]
        };
      } catch (error) {
        logger.error(`Error getting folder ${folder_id}:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error getting folder: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  // フォルダを作成するツール
  server.tool(
    'wrike_create_folder',
    {
      parent_folder_id: z.string().describe('親フォルダID'),
      title: z.string().describe('フォルダのタイトル'),
      description: z.string().optional().describe('フォルダの説明'),
      is_project: z.boolean().optional().describe('プロジェクトとして作成するかどうか'),
      project_owner_ids: z.array(z.string()).optional().describe('プロジェクトオーナーのID配列'),
      project_status: z.string().optional().describe('プロジェクトのステータス'),
      project_start_date: z.string().optional().describe('プロジェクトの開始日'),
      project_end_date: z.string().optional().describe('プロジェクトの終了日'),
      custom_fields: z.array(customFieldSchema).optional().describe('カスタムフィールドの配列')
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

  // フォルダ/プロジェクト情報を取得するツール（汎用）
  server.tool(
    'wrike_get_folder_project',
    {
      id: z.string().optional().describe('フォルダ/プロジェクト/スペースID（指定しない場合はルートフォルダを取得）'),
      parent_id: z.string().optional().describe('親フォルダID（指定した場合は親フォルダ内のフォルダを取得）'),
      space_id: z.string().optional().describe('スペースID（指定した場合はスペース内のフォルダを取得）'),
      folder_ids: z.array(z.string()).optional().describe('複数のフォルダIDを指定（最大100件）'),
      opt_fields: z.string().optional().describe('カンマ区切りのフィールド名リスト')
    },
    async ({ id, parent_id, space_id, folder_ids, opt_fields }) => {
      try {
        const wrikeClient = createWrikeClient();
        const params = parseOptFields(opt_fields);
        let folders: WrikeFolder[] = [];
        let responseText = '';

        // 優先順位: id > folder_ids > parent_id > space_id > ルートフォルダ
        if (id) {
          // 単一のフォルダ/プロジェクトを取得
          logger.debug(`Getting folder/project: ${id}`);
          const response = await wrikeClient.client.get(`/folders/${id}`, { params });
          folders = wrikeClient.handleResponse<WrikeFolder[]>(response);
          responseText = `Folder/Project with ID: ${id}`;
        }
        else if (folder_ids && folder_ids.length > 0) {
          // 複数のフォルダ/プロジェクトをIDで取得
          if (folder_ids.length > 100) {
            return {
              content: [{
                type: 'text',
                text: 'Maximum of 100 folder IDs allowed'
              }],
              isError: true
            };
          }

          logger.debug(`Getting folders by IDs: ${folder_ids.join(',')}`);
          const response = await wrikeClient.client.get(`/folders/${folder_ids.join(',')}`, { params });
          folders = wrikeClient.handleResponse<WrikeFolder[]>(response);
          responseText = `Folders/Projects with IDs: ${folder_ids.join(', ')}`;
        }
        else if (parent_id) {
          // 親フォルダ内のフォルダを取得
          logger.debug(`Getting folders for parent folder: ${parent_id}`);
          const response = await wrikeClient.client.get(`/folders/${parent_id}/folders`, { params });
          folders = wrikeClient.handleResponse<WrikeFolder[]>(response);
          responseText = `Folders/Projects in parent folder: ${parent_id}`;
        }
        else if (space_id) {
          // スペース内のフォルダを取得
          logger.debug(`Getting folders for space: ${space_id}`);
          const response = await wrikeClient.client.get(`/spaces/${space_id}/folders`, { params });
          folders = wrikeClient.handleResponse<WrikeFolder[]>(response);
          responseText = `Folders/Projects in space: ${space_id}`;
        }
        else {
          // ルートフォルダを取得
          logger.debug('Getting root folders');
          const response = await wrikeClient.client.get('/folders', { params });
          folders = wrikeClient.handleResponse<WrikeFolder[]>(response);
          responseText = 'Root folders/projects';
        }

        if (folders.length === 0) {
          return {
            content: [{
              type: 'text',
              text: `No folders/projects found for the given criteria`
            }],
            isError: false
          };
        }

        return {
          content: [{
            type: 'text',
            text: `${responseText}\n${JSON.stringify(folders, null, 2)}`
          }]
        };
      } catch (error) {
        logger.error(`Error getting folder/project:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error getting folder/project: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  ),

  // フォルダを更新するツール
  server.tool(
    'wrike_update_folder',
    {
      folder_id: z.string().describe('フォルダID'),
      title: z.string().optional().describe('フォルダのタイトル'),
      description: z.string().optional().describe('フォルダの説明'),
      project_owner_ids: z.array(z.string()).optional().describe('プロジェクトオーナーのID配列'),
      project_status: z.string().optional().describe('プロジェクトのステータス'),
      project_start_date: z.string().optional().describe('プロジェクトの開始日'),
      project_end_date: z.string().optional().describe('プロジェクトの終了日'),
      custom_fields: z.array(customFieldSchema).optional().describe('カスタムフィールドの配列')
    },
    async ({ folder_id, title, description, project_owner_ids, project_status, project_start_date, project_end_date, custom_fields }) => {
      try {
        logger.debug(`Updating folder: ${folder_id}`);
        const wrikeClient = createWrikeClient();

        const data: WrikeFolderData = {};
        if (title !== undefined) data.title = title;
        if (description !== undefined) data.description = description;

        // プロジェクト情報を設定
        if (project_owner_ids && project_owner_ids.length > 0) {
          data.project = {
            ownerIds: project_owner_ids,
            status: project_status,
            startDate: project_start_date,
            endDate: project_end_date
          };
        }

        // カスタムフィールドを設定
        if (custom_fields !== undefined) data.customFields = custom_fields as WrikeCustomField[];

        const response = await wrikeClient.client.put(`/folders/${folder_id}`, data);
        const folders = wrikeClient.handleResponse<WrikeFolder[]>(response);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(folders[0], null, 2)
          }]
        };
      } catch (error) {
        logger.error(`Error updating folder ${folder_id}:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error updating folder: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );
}
