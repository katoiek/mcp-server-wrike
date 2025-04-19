import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WrikeFolder } from '../types/wrike.js';
import { createWrikeClient, parseOptFields } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

/**
 * Tool to retrieve folder/project information
 * @param server McpServer instance
 */
export function registerWrikeGetFolderProjectTool(server: McpServer): void {
  server.tool(
    'wrike_get_folder_project',
    {
      id: z.string().optional().describe('Folder/project/space ID (if not specified, root folders will be retrieved)'),
      parent_id: z.string().optional().describe('Parent folder ID (if specified, folders within the parent folder will be retrieved)'),
      space_id: z.string().optional().describe('Space ID (if specified, folders within the space will be retrieved)'),
      folder_ids: z.array(z.string()).optional().describe('Specify multiple folder IDs (maximum 100)'),
      opt_fields: z.string().optional().describe('Comma-separated list of field names to include')
    },
    async ({ id, parent_id, space_id, folder_ids, opt_fields }) => {
      try {
        const wrikeClient = createWrikeClient();
        const params = parseOptFields(opt_fields);
        let folders: WrikeFolder[] = [];
        let responseText = '';

        // Priority: id > folder_ids > parent_id > space_id > root folders
        // Priority: id > folder_ids > parent_id > space_id > root folders
        if (id) {
          // Retrieve a single folder/project
          // Retrieve a single folder/project
          logger.debug(`Getting folder/project: ${id}`);
          const response = await wrikeClient.client.get(`/folders/${id}`, { params });
          folders = wrikeClient.handleResponse<WrikeFolder[]>(response);
          responseText = `Folder/Project with ID: ${id}`;
        }
        else if (folder_ids && folder_ids.length > 0) {
          // Retrieve multiple folders/projects by IDs
          // Retrieve multiple folders/projects by IDs
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
          // Retrieve folders within the parent folder
          // Retrieve folders within the parent folder
          logger.debug(`Getting folders for parent folder: ${parent_id}`);
          const response = await wrikeClient.client.get(`/folders/${parent_id}/folders`, { params });
          folders = wrikeClient.handleResponse<WrikeFolder[]>(response);
          responseText = `Folders/Projects in parent folder: ${parent_id}`;
        }
        else if (space_id) {
          // Retrieve folders within the space
          // Retrieve folders within the space
          logger.debug(`Getting folders for space: ${space_id}`);
          const response = await wrikeClient.client.get(`/spaces/${space_id}/folders`, { params });
          folders = wrikeClient.handleResponse<WrikeFolder[]>(response);
          responseText = `Folders/Projects in space: ${space_id}`;
        }
        else {
          // Retrieve root folders
          // Retrieve root folders
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
