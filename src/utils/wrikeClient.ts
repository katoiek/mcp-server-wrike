import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { logger } from './logger.js';
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
} from '../types/wrike.js';

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
    const { logger } = await import('./logger.js');

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

  async createTimelog(taskId: string, data: WrikeTimelogData, params: WrikeRequestParams = {}): Promise<WrikeTimelog> {
    try {
      const response = await this.client.post(`/tasks/${taskId}/timelogs`, data, { params });
      const timelogs = this.handleResponse<WrikeTimelog[]>(response);
      return timelogs[0];
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  async updateTimelog(timelogId: string, data: WrikeTimelogData, params: WrikeRequestParams = {}): Promise<WrikeTimelog> {
    try {
      const response = await this.client.put(`/timelogs/${timelogId}`, data, { params });
      const timelogs = this.handleResponse<WrikeTimelog[]>(response);
      return timelogs[0];
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  async deleteTimelog(timelogId: string): Promise<void> {
    try {
      const response = await this.client.delete(`/timelogs/${timelogId}`);
      this.handleResponse(response);
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  /**
   * Convert a permalink ID to an API ID
   * @param id The permalink ID or numeric ID
   * @param type The type of entity (task, folder, etc.)
   * @returns The API ID
   */
  async convertPermalinkId(id: string, type: 'task' | 'folder' | 'contact' | 'timelog'): Promise<string> {
    try {
      // If it's already in the API format (IEABC123), return it
      if (/^[A-Z0-9]{8,}$/.test(id)) {
        return id;
      }

      // Extract ID from permalink if needed
      let numericId = id;
      if (id.includes('open.htm?id=')) {
        const match = id.match(/id=(\d+)/);
        if (!match) {
          throw new Error(`Invalid permalink format: ${id}`);
        }
        numericId = match[1];
      }

      // Ensure we have a numeric ID
      if (!/^\d+$/.test(numericId)) {
        throw new Error(`ID must be numeric or a valid permalink: ${id}`);
      }

      // Make the conversion request
      logger.debug(`Converting ${type} ID: ${numericId}`);
      const response = await this.client.get('/ids', {
        params: {
          ids: [numericId],
          type
        }
      });

      const conversions = this.handleResponse<WrikeIdConversion[]>(response);
      if (!conversions || conversions.length === 0) {
        throw new Error(`No conversion found for ${type} ID: ${numericId}`);
      }

      logger.debug(`Converted ${type} ID ${numericId} to ${conversions[0].id}`);
      return conversions[0].id;
    } catch (error) {
      logger.error(`Error converting ${type} ID: ${(error as Error).message}`);
      return this.handleError(error as AxiosError);
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
