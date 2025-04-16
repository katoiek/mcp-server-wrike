import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WrikeFolder } from '../types/wrike.js';
import { createWrikeClient, parseOptFields } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

/**
 * フォルダ/プロジェクト情報を取得するツール
 * @param server McpServerインスタンス
 */
export function registerWrikeGetFolderProjectTool(server: McpServer): void {
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
  );
}
