import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { logger } from './utils/logger.js';
import {
  WrikeApiResponse,
  WrikeSpace,
  WrikeFolder,
  WrikeTask,
  WrikeComment,
  WrikeContact,
  WrikeTimelog,
  WrikeTimelogCategory,
  WrikeRequestParams,
  WrikeTaskParams,
  WrikeTaskData,
  WrikeFolderData,
  WrikeCommentData,
  WrikeTimelogData,
  WrikeIdConversion
} from './types/wrike.js';

export class WrikeClient {
  private accessToken: string;
  private baseUrl: string;
  public client: AxiosInstance;

  constructor(accessToken: string, host: string = 'www.wrike.com') {
    this.accessToken = accessToken;
    this.baseUrl = `https://${host}/api/v4`;
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // Helper method to handle API responses
  handleResponse<T>(response: AxiosResponse): T {
    // Avoid memory leaks by not storing the entire response
    if (response.data && response.data.data) {
      const result = response.data.data as T;
      // Clear references to large objects
      response.data = null;
      return result;
    }
    const result = response.data as T;
    response.data = null;
    return result;
  }

  // Helper method to handle API errors
  async handleError(error: AxiosError): Promise<never> {
    // Import logger dynamically to avoid circular dependencies
    const { logger } = await import('./utils/logger.js');

    logger.error('Wrike API Error:', error);

    if (error.response && error.response.data) {
      const responseData = error.response.data as any;
      logger.debug('Wrike API Response Data:', responseData);

      if (error.response.status === 401) {
        logger.error('Authentication error: Your Wrike API token may be invalid or expired.');
        logger.error('Please check your token and make sure it has the necessary permissions.');
        logger.error('You can generate a new token in your Wrike account under Apps & Integrations > API.');
        throw new Error(`Wrike API Authentication Error: ${responseData.error} - ${responseData.errorDescription}. Please check your API token.`);
      }

      throw new Error(`Wrike API Error: ${responseData.error} - ${responseData.errorDescription}`);
    }

    if (error.request) {
      logger.error('Wrike API Request Error - No Response Received');
      throw new Error(`Wrike API Request Error: No response received - ${error.message}`);
    }

    logger.error('Wrike API Error - Request Setup Failed:', error.message);
    throw error;
  }

  // Spaces
  async getSpaces(params: WrikeRequestParams = {}): Promise<WrikeSpace[]> {
    try {
      const response = await this.client.get('/spaces', { params });
      return this.handleResponse<WrikeSpace[]>(response);
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  async getSpace(spaceId: string, params: WrikeRequestParams = {}): Promise<WrikeSpace> {
    try {
      const response = await this.client.get(`/spaces/${spaceId}`, { params });
      const spaces = this.handleResponse<WrikeSpace[]>(response);
      return spaces[0];
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  // Folders & Projects
  async getFolders(params: WrikeRequestParams = {}): Promise<WrikeFolder[]> {
    try {
      const response = await this.client.get('/folders', { params });
      return this.handleResponse<WrikeFolder[]>(response);
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  async getFoldersBySpace(spaceId: string, params: WrikeRequestParams = {}): Promise<WrikeFolder[]> {
    try {
      const response = await this.client.get(`/spaces/${spaceId}/folders`, { params });
      return this.handleResponse<WrikeFolder[]>(response);
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  async getFoldersByParent(parentFolderId: string, params: WrikeRequestParams = {}): Promise<WrikeFolder[]> {
    try {
      const response = await this.client.get(`/folders/${parentFolderId}/folders`, { params });
      return this.handleResponse<WrikeFolder[]>(response);
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  async getFoldersByIds(folderIds: string[], params: WrikeRequestParams = {}): Promise<WrikeFolder[]> {
    try {
      if (!folderIds || folderIds.length === 0) {
        throw new Error('Folder IDs are required');
      }

      if (folderIds.length > 100) {
        throw new Error('Maximum of 100 folder IDs allowed');
      }

      const response = await this.client.get(`/folders/${folderIds.join(',')}`, { params });
      return this.handleResponse<WrikeFolder[]>(response);
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  async getFoldersHistory(folderIds: string[], params: WrikeRequestParams = {}): Promise<WrikeFolder[]> {
    try {
      if (!folderIds || folderIds.length === 0) {
        throw new Error('Folder IDs are required');
      }

      if (folderIds.length > 100) {
        throw new Error('Maximum of 100 folder IDs allowed');
      }

      // Add history=true parameter to get folder history
      const historyParams = {
        ...params,
        history: true
      };

      const response = await this.client.get(`/folders/${folderIds.join(',')}`, { params: historyParams });
      return this.handleResponse<WrikeFolder[]>(response);
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  async getFolder(folderId: string, params: WrikeRequestParams = {}): Promise<WrikeFolder> {
    try {
      const response = await this.client.get(`/folders/${folderId}`, { params });
      const folders = this.handleResponse<WrikeFolder[]>(response);
      return folders[0];
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  async createFolder(parentFolderId: string, data: WrikeFolderData): Promise<WrikeFolder> {
    try {
      const response = await this.client.post(`/folders/${parentFolderId}/folders`, data);
      const folders = this.handleResponse<WrikeFolder[]>(response);
      return folders[0];
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  async updateFolder(folderId: string, data: WrikeFolderData): Promise<WrikeFolder> {
    try {
      const response = await this.client.put(`/folders/${folderId}`, data);
      const folders = this.handleResponse<WrikeFolder[]>(response);
      return folders[0];
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  // Tasks
  async getTasks(params: WrikeTaskParams = {}): Promise<WrikeTask[]> {
    try {
      const response = await this.client.get('/tasks', { params });
      return this.handleResponse<WrikeTask[]>(response);
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  async getTasksByFolder(folderId: string, params: WrikeRequestParams = {}): Promise<WrikeTask[]> {
    try {
      const response = await this.client.get(`/folders/${folderId}/tasks`, { params });
      return this.handleResponse<WrikeTask[]>(response);
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  async getTask(taskId: string, params: WrikeRequestParams = {}): Promise<WrikeTask> {
    try {
      const response = await this.client.get(`/tasks/${taskId}`, { params });
      const tasks = this.handleResponse<WrikeTask[]>(response);
      return tasks[0];
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  async createTask(folderId: string, data: WrikeTaskData, params: WrikeRequestParams = {}): Promise<WrikeTask> {
    try {
      const response = await this.client.post(`/folders/${folderId}/tasks`, data, { params });
      const tasks = this.handleResponse<WrikeTask[]>(response);
      return tasks[0];
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  async updateTask(taskId: string, data: WrikeTaskData, params: WrikeRequestParams = {}): Promise<WrikeTask> {
    try {
      const response = await this.client.put(`/tasks/${taskId}`, data, { params });
      const tasks = this.handleResponse<WrikeTask[]>(response);
      return tasks[0];
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    try {
      const response = await this.client.delete(`/tasks/${taskId}`);
      this.handleResponse(response);
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  /**
   * Get tasks history
   * @param taskIds Task ID or array of task IDs (up to 100)
   * @param params Request parameters
   * @returns Task history information
   */
  async getTasksHistory(taskIds: string[] | string, params: WrikeRequestParams = {}): Promise<any[]> {
    try {
      if (!taskIds || (Array.isArray(taskIds) && taskIds.length === 0)) {
        throw new Error('Task IDs are required');
      }

      // Convert array to comma-separated string if needed
      let ids = Array.isArray(taskIds) ? taskIds.join(',') : taskIds;

      if (ids.split(',').length > 100) {
        throw new Error('Maximum of 100 task IDs allowed');
      }

      // Log the request for debugging
      logger.debug(`Getting history for tasks: ${ids}`);

      // Try to convert task IDs if they are in numeric format
      try {
        if (/^\d+$/.test(ids) || ids.includes('open.htm?id=')) {
          logger.debug(`Converting task ID from permalink format: ${ids}`);
          const convertedId = await this.convertPermalinkId(ids, 'task');
          ids = convertedId;
          logger.debug(`Converted task ID: ${ids}`);
        }
      } catch (conversionError) {
        logger.error(`Error converting task ID: ${(conversionError as Error).message}`);
        // Continue with the original ID if conversion fails
      }

      // Use the correct endpoint for task history
      const response = await this.client.get(`/tasks/${ids}/history`, { params });
      logger.debug(`Task history response status: ${response.status}`);
      return this.handleResponse<any[]>(response);
    } catch (error) {
      logger.error(`Error getting task history: ${(error as Error).message}`);
      if ((error as AxiosError).response) {
        logger.error(`Response status: ${(error as AxiosError).response?.status}`);
        logger.error(`Response data: ${JSON.stringify((error as AxiosError).response?.data)}`);
      }
      return this.handleError(error as AxiosError);
    }
  }

  // Comments
  // Get all comments
  async getAllComments(params: WrikeRequestParams = {}): Promise<WrikeComment[]> {
    try {
      const response = await this.client.get('/comments', { params });
      return this.handleResponse<WrikeComment[]>(response);
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  // Get comments by task ID
  async getCommentsByTask(taskId: string, params: WrikeRequestParams = {}): Promise<WrikeComment[]> {
    try {
      const response = await this.client.get(`/tasks/${taskId}/comments`, { params });
      return this.handleResponse<WrikeComment[]>(response);
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  // Get comments by folder ID
  async getCommentsByFolder(folderId: string, params: WrikeRequestParams = {}): Promise<WrikeComment[]> {
    try {
      const response = await this.client.get(`/folders/${folderId}/comments`, { params });
      return this.handleResponse<WrikeComment[]>(response);
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  // Get comments by IDs (up to 100)
  async getCommentsByIds(commentIds: string[], params: WrikeRequestParams = {}): Promise<WrikeComment[]> {
    try {
      if (!commentIds || commentIds.length === 0) {
        throw new Error('Comment IDs are required');
      }

      if (commentIds.length > 100) {
        throw new Error('Maximum of 100 comment IDs allowed');
      }

      const response = await this.client.get(`/comments/${commentIds.join(',')}`, { params });
      return this.handleResponse<WrikeComment[]>(response);
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  // For backward compatibility
  async getComments(taskId: string, params: WrikeRequestParams = {}): Promise<WrikeComment[]> {
    return this.getCommentsByTask(taskId, params);
  }

  async createComment(taskId: string, data: WrikeCommentData | string, params: WrikeRequestParams = {}): Promise<WrikeComment> {
    try {
      // If data is a string, convert it to an object with text property
      const commentData: WrikeCommentData = typeof data === 'string' ? { text: data } : data;

      const response = await this.client.post(`/tasks/${taskId}/comments`, commentData, { params });
      const comments = this.handleResponse<WrikeComment[]>(response);
      return comments[0];
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  // Contacts
  async getContacts(params: WrikeRequestParams = {}): Promise<WrikeContact[]> {
    try {
      const response = await this.client.get('/contacts', { params });
      return this.handleResponse<WrikeContact[]>(response);
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  // Timelogs
  async getTimelogs(params: WrikeRequestParams = {}): Promise<WrikeTimelog[]> {
    try {
      const response = await this.client.get('/timelogs', { params });
      return this.handleResponse<WrikeTimelog[]>(response);
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  async getTimelogsByTask(taskId: string, params: WrikeRequestParams = {}): Promise<WrikeTimelog[]> {
    try {
      const response = await this.client.get(`/tasks/${taskId}/timelogs`, { params });
      return this.handleResponse<WrikeTimelog[]>(response);
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  async getTimelogsByContact(contactId: string, params: WrikeRequestParams = {}): Promise<WrikeTimelog[]> {
    try {
      const response = await this.client.get(`/contacts/${contactId}/timelogs`, { params });
      return this.handleResponse<WrikeTimelog[]>(response);
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  async getTimelogsByFolder(folderId: string, params: WrikeRequestParams = {}): Promise<WrikeTimelog[]> {
    try {
      const response = await this.client.get(`/folders/${folderId}/timelogs`, { params });
      return this.handleResponse<WrikeTimelog[]>(response);
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  async getTimelogsByCategory(categoryId: string, params: WrikeRequestParams = {}): Promise<WrikeTimelog[]> {
    try {
      const response = await this.client.get(`/timelog_categories/${categoryId}/timelogs`, { params });
      return this.handleResponse<WrikeTimelog[]>(response);
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  /**
   * Get all timelog categories
   * @param params Request parameters
   * @returns List of timelog categories
   */
  async getTimelogCategories(params: WrikeRequestParams = {}): Promise<WrikeTimelogCategory[]> {
    try {
      logger.debug('Getting timelog categories');
      const response = await this.client.get('/timelog_categories', { params });
      logger.debug(`Timelog categories response status: ${response.status}`);
      return this.handleResponse<WrikeTimelogCategory[]>(response);
    } catch (error) {
      logger.error(`Error getting timelog categories: ${(error as Error).message}`);
      if ((error as AxiosError).response) {
        logger.error(`Response status: ${(error as AxiosError).response?.status}`);
        logger.error(`Response data: ${JSON.stringify((error as AxiosError).response?.data)}`);
      }
      return this.handleError(error as AxiosError);
    }
  }

  async getTimelogsById(timelogIds: string | string[], params: WrikeRequestParams = {}): Promise<WrikeTimelog[]> {
    try {
      const ids = Array.isArray(timelogIds) ? timelogIds.join(',') : timelogIds;
      const response = await this.client.get(`/timelogs/${ids}`, { params });
      return this.handleResponse<WrikeTimelog[]>(response);
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  /**
   * Create a timelog entry for a task
   * @param taskId ID of the task to add the timelog to
   * @param data Timelog data
   * @returns Created timelog
   */
  async createTimelog(taskId: string, data: WrikeTimelogData): Promise<WrikeTimelog> {
    try {
      logger.debug(`Creating timelog for task ${taskId} with data:`, data);
      const response = await this.client.post(`/tasks/${taskId}/timelogs`, data);
      logger.debug(`Timelog creation response status: ${response.status}`);
      const timelogs = this.handleResponse<WrikeTimelog[]>(response);
      return timelogs[0];
    } catch (error) {
      logger.error(`Error creating timelog: ${(error as Error).message}`);
      if ((error as AxiosError).response) {
        logger.error(`Response status: ${(error as AxiosError).response?.status}`);
        logger.error(`Response data: ${JSON.stringify((error as AxiosError).response?.data)}`);
      }
      return this.handleError(error as AxiosError);
    }
  }

  /**
   * Update a timelog entry
   * @param timelogId ID of the timelog to update
   * @param data Updated timelog data
   * @returns Updated timelog
   */
  async updateTimelog(timelogId: string, data: WrikeTimelogData): Promise<WrikeTimelog> {
    try {
      logger.debug(`Updating timelog ${timelogId} with data:`, data);
      const response = await this.client.put(`/timelogs/${timelogId}`, data);
      logger.debug(`Timelog update response status: ${response.status}`);
      const timelogs = this.handleResponse<WrikeTimelog[]>(response);
      return timelogs[0];
    } catch (error) {
      logger.error(`Error updating timelog: ${(error as Error).message}`);
      if ((error as AxiosError).response) {
        logger.error(`Response status: ${(error as AxiosError).response?.status}`);
        logger.error(`Response data: ${JSON.stringify((error as AxiosError).response?.data)}`);
      }
      return this.handleError(error as AxiosError);
    }
  }

  /**
   * Delete a timelog entry
   * @param timelogId ID of the timelog to delete
   * @returns True if deletion was successful
   */
  async deleteTimelog(timelogId: string): Promise<boolean> {
    try {
      logger.debug(`Deleting timelog ${timelogId}`);
      const response = await this.client.delete(`/timelogs/${timelogId}`);
      logger.debug(`Timelog deletion response status: ${response.status}`);
      return response.status === 200;
    } catch (error) {
      logger.error(`Error deleting timelog: ${(error as Error).message}`);
      if ((error as AxiosError).response) {
        logger.error(`Response status: ${(error as AxiosError).response?.status}`);
        logger.error(`Response data: ${JSON.stringify((error as AxiosError).response?.data)}`);
      }
      return this.handleError(error as AxiosError);
    }
  }

  // ID Conversion
  async convertLegacyIds(type: string, legacyIds: string[] | string): Promise<WrikeIdConversion[]> {
    try {
      // Convert comma-separated string to array if needed
      const ids = Array.isArray(legacyIds)
        ? legacyIds
        : legacyIds.split(',').map(id => id.trim());

      // Log conversion attempt at debug level
      logger.debug(`Converting legacy IDs: ${ids.join(',')} of type ${type}`);

      // Call the Wrike API to convert IDs using the correct format
      // Format: /api/v4/ids?ids=[ID]&type=ApiV2Task
      const apiType = type === 'task' ? 'ApiV2Task' :
                     type === 'folder' ? 'ApiV2Folder' :
                     type === 'comment' ? 'ApiV2Comment' : type;

      const response = await this.client.get('/ids', {
        params: {
          ids: `[${ids.join(',')}]`,
          type: apiType
        }
      });

      // Log conversion response at debug level
      logger.debug("ID conversion response received");

      return this.handleResponse<WrikeIdConversion[]>(response);
    } catch (error) {
      // Log error at error level
      logger.error(`Error converting legacy IDs: ${(error as Error).message}`);

      return this.handleError(error as AxiosError);
    }
  }

  // Helper method to convert a permalink ID to API v4 ID
  async convertPermalinkId(permalinkId: string, type: string = 'task'): Promise<string> {
    logger.debug(`Converting permalink ID: ${permalinkId} of type ${type}`);

    // Extract the numeric ID from the permalink
    // Permalink format: https://www.wrike.com/open.htm?id=1633695731
    let legacyId: string;

    if (typeof permalinkId === 'string' && permalinkId.includes('open.htm?id=')) {
      // Extract ID from permalink URL
      const match = permalinkId.match(/id=(\d+)/);
      if (match && match[1]) {
        legacyId = match[1];
        logger.debug(`Extracted legacy ID from permalink: ${legacyId}`);
      } else {
        throw new Error('Invalid permalink format');
      }
    } else if (typeof permalinkId === 'string' && /^\d+$/.test(permalinkId)) {
      // If it's already a numeric ID, use it directly
      legacyId = permalinkId;
      logger.debug(`Using numeric ID directly: ${legacyId}`);
    } else {
      // If it's already in the API v4 format (IEAAXXXXX), return it directly
      if (typeof permalinkId === 'string' && permalinkId.startsWith('IEAA')) {
        logger.debug(`ID already in API v4 format: ${permalinkId}`);
        return permalinkId;
      }

      throw new Error(`Invalid permalink or ID format: ${permalinkId}`);
    }

    try {
      // Use the correct API endpoint format to convert the ID
      logger.debug(`Converting legacy ID to API v4 format: ${legacyId}`);

      // Determine the correct API type based on the provided type
      const apiType = type === 'task' ? 'ApiV2Task' :
                     type === 'folder' ? 'ApiV2Folder' :
                     type === 'comment' ? 'ApiV2Comment' : type;

      // Make a direct request to the IDs endpoint with the correct format
      const response = await this.client.get('/ids', {
        params: {
          ids: `[${legacyId}]`,
          type: apiType
        }
      });

      logger.debug("ID conversion response received");

      // Extract the converted ID from the response
      if (response.data &&
          response.data.data &&
          response.data.data.length > 0 &&
          response.data.data[0].id) {
        const convertedId = response.data.data[0].id;
        logger.debug(`Successfully converted to API v4 ID: ${convertedId}`);
        return convertedId;
      }

      // If conversion fails, try to use the task ID directly as a fallback
      logger.debug(`ID conversion did not return expected result, trying direct task retrieval for ID: ${legacyId}`);

      try {
        const taskResponse = await this.client.get(`/tasks/${legacyId}`);
        if (taskResponse.data && taskResponse.data.data) {
          logger.debug(`Successfully retrieved task with ID: ${legacyId}`);
          return legacyId;
        }
      } catch (directError) {
        logger.debug(`Direct task retrieval failed: ${(directError as Error).message}`);
      }

      // As a last resort, return the original ID
      logger.debug(`All conversion attempts failed, returning original ID: ${legacyId}`);

      return legacyId;
    } catch (error) {
      logger.error(`Error in convertPermalinkId: ${(error as Error).message}`);

      // As a last resort, try to use the legacy ID directly
      logger.debug(`Falling back to using the legacy ID directly: ${legacyId}`);

      return legacyId;
    }
  }

  /**
   * Enhanced search for folders, projects, and spaces
   * This method can be used in two modes:
   * 1. Search mode: Find multiple folders/projects based on criteria
   * 2. Get mode: Retrieve a single folder, project, or space by ID
   */
  async searchFoldersProjects(options: {
    space_id?: string;
    folder_id?: string;
    folder_ids?: string[];
    single_folder_id?: string;
    name_pattern?: string;
    project_only?: boolean;
    archived?: boolean;
    include_history?: boolean;
    opt_fields?: string;
  }): Promise<WrikeFolder[] | WrikeFolder | WrikeSpace> {
    const {
      space_id,
      folder_id,
      folder_ids,
      single_folder_id,
      name_pattern,
      project_only = false,
      archived = false,
      include_history = false,
      opt_fields
    } = options;

    const params = this.parseOptFields(opt_fields);

    // MODE 1: Get a single folder, project, or space by ID
    if (single_folder_id) {
      try {
        // Strategy 1: Try as a space first
        try {
          logger.debug(`Attempting to retrieve as space: ${single_folder_id}`);
          const space = await this.getSpace(single_folder_id, params);

          if (space) {
            logger.debug(`Successfully retrieved as space: ${single_folder_id}`);
            return space;
          }
        } catch (spaceError) {
          // Not a space, continue to folder logic
          logger.debug(`Not a space ID, trying as folder: ${(spaceError as Error).message}`);
        }

        // Strategy 2: Try as a folder/project
        // Convert folder ID if needed
        let apiFolder_id = single_folder_id;

        if (single_folder_id.includes('open.htm?id=') || /^\d+$/.test(single_folder_id)) {
          try {
            logger.debug(`Converting folder ID: ${single_folder_id}`);
            apiFolder_id = await this.convertPermalinkId(single_folder_id, 'folder');
            logger.debug(`Converted to: ${apiFolder_id}`);
          } catch (error) {
            logger.error(`ID conversion error: ${(error as Error).message}`);
            // Continue with original ID if conversion fails
          }
        }

        // Get folder details
        logger.debug(`Retrieving folder: ${apiFolder_id}`);
        const folder = await this.getFolder(apiFolder_id, params);
        return folder;
      } catch (error) {
        logger.error(`Error retrieving single folder/project/space: ${(error as Error).message}`);
        throw new Error(`Failed to get folder/project/space: ${(error as Error).message}`);
      }
    }

    // MODE 2: Search for multiple folders/projects
    try {
      let folders: WrikeFolder[] = [];

      // Determine which API endpoint to use based on provided parameters
      if (space_id) {
        // Get all folders in the space
        folders = await this.getFoldersBySpace(space_id, params);
      } else if (folder_id) {
        // Get all subfolders of a parent folder
        folders = await this.getFoldersByParent(folder_id, params);
      } else if (folder_ids && folder_ids.length > 0) {
        // Get specific folders by IDs
        if (include_history) {
          folders = await this.getFoldersHistory(folder_ids, params);
        } else {
          folders = await this.getFoldersByIds(folder_ids, params);
        }
      } else {
        // Get all folders
        folders = await this.getFolders(params);
      }

      // Apply filters if provided
      if (name_pattern || project_only || archived !== undefined) {
        const regex = name_pattern ? new RegExp(name_pattern, 'i') : null;

        folders = folders.filter(folder => {
          // Filter by project status if requested
          if (project_only && folder.project === undefined) {
            return false;
          }

          // Filter by name pattern if provided
          if (regex && !regex.test(folder.title)) {
            return false;
          }

          // Filter by archive status
          if (archived !== undefined) {
            const archiveMatches = archived ? folder.archived : !folder.archived;
            if (!archiveMatches) {
              return false;
            }
          }

          return true;
        });
      }

      return folders;
    } catch (error) {
      logger.error(`Error searching folders/projects: ${(error as Error).message}`);
      throw new Error(`Failed to search folders/projects: ${(error as Error).message}`);
    }
  }

  /**
   * Helper method to parse optional fields
   */
  private parseOptFields(optFields?: string): WrikeRequestParams {
    if (!optFields) return {};
    const fields = optFields.split(',').map(field => field.trim());
    return { fields: fields.join(',') };
  }
}
