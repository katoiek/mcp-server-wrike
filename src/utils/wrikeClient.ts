import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { logger } from './logger.js';
import { removeUndefinedValues } from './helpers.js';
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

  /**
   * Create a new Wrike API client
   * @param accessToken Wrike API access token
   * @param host Wrike API host (default: www.wrike.com)
   */
  constructor(accessToken: string, host: string = 'www.wrike.com') {
    if (!accessToken) {
      throw new Error('Access token is required');
    }

    this.accessToken = accessToken;
    this.baseUrl = `https://${host}/api/v4`;

    // Create axios instance with default configuration
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 seconds timeout
    });

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      response => response,
      error => this.handleApiError(error)
    );
  }

  /**
   * Handle API error and convert to a more useful format
   * @param error Axios error
   * @returns Rejected promise with formatted error
   */
  private handleApiError(error: any): Promise<never> {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const data = axiosError.response?.data as any;

      let message = 'API request failed';
      if (data?.error) {
        message = `API error: ${data.error}`;
      } else if (axiosError.message) {
        message = axiosError.message;
      }

      logger.error('Wrike API error', {
        status,
        message,
        url: axiosError.config?.url
      });

      return Promise.reject(new Error(message));
    }

    logger.error('Unknown API error', { error });
    return Promise.reject(error);
  }

  /**
   * Extract data from Wrike API response
   * @param response Axios response from Wrike API
   * @returns Extracted data of type T
   */
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

  /**
   * Get all spaces
   * @param params Optional request parameters
   * @returns Promise resolving to array of WrikeSpace objects
   */
  async getSpaces(params: WrikeRequestParams = {}): Promise<WrikeSpace[]> {
    const response = await this.client.get('/spaces', {
      params: removeUndefinedValues(params)
    });
    return this.handleResponse<WrikeSpace[]>(response);
  }

  /**
   * Get a specific space by ID
   * @param spaceId ID of the space to retrieve
   * @param params Optional request parameters
   * @returns Promise resolving to a WrikeSpace object
   */
  async getSpace(spaceId: string, params: WrikeRequestParams = {}): Promise<WrikeSpace> {
    if (!spaceId) {
      throw new Error('Space ID is required');
    }

    const response = await this.client.get(`/spaces/${spaceId}`, {
      params: removeUndefinedValues(params)
    });
    const spaces = this.handleResponse<WrikeSpace[]>(response);

    if (!spaces || spaces.length === 0) {
      throw new Error(`Space with ID ${spaceId} not found`);
    }

    return spaces[0];
  }

  /**
   * Get all folders
   * @param params Optional request parameters
   * @returns Promise resolving to array of WrikeFolder objects
   */
  async getFolders(params: WrikeRequestParams = {}): Promise<WrikeFolder[]> {
    const response = await this.client.get('/folders', {
      params: removeUndefinedValues(params)
    });
    return this.handleResponse<WrikeFolder[]>(response);
  }

  /**
   * Get folders in a specific space
   * @param spaceId ID of the space
   * @param params Optional request parameters
   * @returns Promise resolving to array of WrikeFolder objects
   */
  async getFoldersBySpace(spaceId: string, params: WrikeRequestParams = {}): Promise<WrikeFolder[]> {
    if (!spaceId) {
      throw new Error('Space ID is required');
    }

    const response = await this.client.get(`/spaces/${spaceId}/folders`, {
      params: removeUndefinedValues(params)
    });
    return this.handleResponse<WrikeFolder[]>(response);
  }

  async getFoldersByParent(parentFolderId: string, params: WrikeRequestParams = {}): Promise<WrikeFolder[]> {
    try {
      const response = await this.client.get(`/folders/${parentFolderId}/folders`, { params });
      return this.handleResponse<WrikeFolder[]>(response);
    } catch (error) {
      return this.handleApiError(error);
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
      return this.handleApiError(error);
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
      return this.handleApiError(error);
    }
  }

  async getFolder(folderId: string, params: WrikeRequestParams = {}): Promise<WrikeFolder> {
    try {
      const response = await this.client.get(`/folders/${folderId}`, { params });
      const folders = this.handleResponse<WrikeFolder[]>(response);
      return folders[0];
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  async createFolder(parentFolderId: string, data: WrikeFolderData): Promise<WrikeFolder> {
    try {
      const response = await this.client.post(`/folders/${parentFolderId}/folders`, data);
      const folders = this.handleResponse<WrikeFolder[]>(response);
      return folders[0];
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  async updateFolder(folderId: string, data: WrikeFolderData): Promise<WrikeFolder> {
    try {
      const response = await this.client.put(`/folders/${folderId}`, data);
      const folders = this.handleResponse<WrikeFolder[]>(response);
      return folders[0];
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // Tasks
  async getTasks(params: WrikeTaskParams = {}): Promise<WrikeTask[]> {
    try {
      const response = await this.client.get('/tasks', { params });
      return this.handleResponse<WrikeTask[]>(response);
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  async getTasksByFolder(folderId: string, params: WrikeRequestParams = {}): Promise<WrikeTask[]> {
    try {
      const response = await this.client.get(`/folders/${folderId}/tasks`, { params });
      return this.handleResponse<WrikeTask[]>(response);
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  async getTask(taskId: string, params: WrikeRequestParams = {}): Promise<WrikeTask> {
    try {
      const response = await this.client.get(`/tasks/${taskId}`, { params });
      const tasks = this.handleResponse<WrikeTask[]>(response);
      return tasks[0];
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  async createTask(folderId: string, data: WrikeTaskData, params: WrikeRequestParams = {}): Promise<WrikeTask> {
    try {
      const response = await this.client.post(`/folders/${folderId}/tasks`, data, { params });
      const tasks = this.handleResponse<WrikeTask[]>(response);
      return tasks[0];
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  async updateTask(taskId: string, data: WrikeTaskData, params: WrikeRequestParams = {}): Promise<WrikeTask> {
    try {
      const response = await this.client.put(`/tasks/${taskId}`, data, { params });
      const tasks = this.handleResponse<WrikeTask[]>(response);
      return tasks[0];
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    try {
      const response = await this.client.delete(`/tasks/${taskId}`);
      this.handleResponse(response);
    } catch (error) {
      this.handleApiError(error);
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
      return this.handleApiError(error);
    }
  }

  // Comments
  // Get all comments
  async getAllComments(params: WrikeRequestParams = {}): Promise<WrikeComment[]> {
    try {
      const response = await this.client.get('/comments', { params });
      return this.handleResponse<WrikeComment[]>(response);
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // Get comments by task ID
  async getCommentsByTask(taskId: string, params: WrikeRequestParams = {}): Promise<WrikeComment[]> {
    try {
      const response = await this.client.get(`/tasks/${taskId}/comments`, { params });
      return this.handleResponse<WrikeComment[]>(response);
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // Get comments by folder ID
  async getCommentsByFolder(folderId: string, params: WrikeRequestParams = {}): Promise<WrikeComment[]> {
    try {
      const response = await this.client.get(`/folders/${folderId}/comments`, { params });
      return this.handleResponse<WrikeComment[]>(response);
    } catch (error) {
      return this.handleApiError(error);
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
      return this.handleApiError(error);
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
      return this.handleApiError(error);
    }
  }

  // Contacts
  async getContacts(params: WrikeRequestParams = {}): Promise<WrikeContact[]> {
    try {
      const response = await this.client.get('/contacts', { params });
      return this.handleResponse<WrikeContact[]>(response);
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // Timelogs
  async getTimelogs(params: WrikeRequestParams = {}): Promise<WrikeTimelog[]> {
    try {
      const response = await this.client.get('/timelogs', { params });
      return this.handleResponse<WrikeTimelog[]>(response);
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  async getTimelogsByTask(taskId: string, params: WrikeRequestParams = {}): Promise<WrikeTimelog[]> {
    try {
      const response = await this.client.get(`/tasks/${taskId}/timelogs`, { params });
      return this.handleResponse<WrikeTimelog[]>(response);
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  async getTimelogsByContact(contactId: string, params: WrikeRequestParams = {}): Promise<WrikeTimelog[]> {
    try {
      const response = await this.client.get(`/contacts/${contactId}/timelogs`, { params });
      return this.handleResponse<WrikeTimelog[]>(response);
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  async getTimelogsByFolder(folderId: string, params: WrikeRequestParams = {}): Promise<WrikeTimelog[]> {
    try {
      const response = await this.client.get(`/folders/${folderId}/timelogs`, { params });
      return this.handleResponse<WrikeTimelog[]>(response);
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  async getTimelogsByCategory(categoryId: string, params: WrikeRequestParams = {}): Promise<WrikeTimelog[]> {
    try {
      const response = await this.client.get(`/timelog_categories/${categoryId}/timelogs`, { params });
      return this.handleResponse<WrikeTimelog[]>(response);
    } catch (error) {
      return this.handleApiError(error);
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
      return this.handleApiError(error);
    }
  }

  async getTimelogsById(timelogIds: string | string[], params: WrikeRequestParams = {}): Promise<WrikeTimelog[]> {
    try {
      const ids = Array.isArray(timelogIds) ? timelogIds.join(',') : timelogIds;
      const response = await this.client.get(`/timelogs/${ids}`, { params });
      return this.handleResponse<WrikeTimelog[]>(response);
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  async createTimelog(taskId: string, data: WrikeTimelogData, params: WrikeRequestParams = {}): Promise<WrikeTimelog> {
    try {
      const response = await this.client.post(`/tasks/${taskId}/timelogs`, data, { params });
      const timelogs = this.handleResponse<WrikeTimelog[]>(response);
      return timelogs[0];
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  async updateTimelog(timelogId: string, data: WrikeTimelogData, params: WrikeRequestParams = {}): Promise<WrikeTimelog> {
    try {
      const response = await this.client.put(`/timelogs/${timelogId}`, data, { params });
      const timelogs = this.handleResponse<WrikeTimelog[]>(response);
      return timelogs[0];
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  async deleteTimelog(timelogId: string): Promise<void> {
    try {
      const response = await this.client.delete(`/timelogs/${timelogId}`);
      this.handleResponse(response);
    } catch (error) {
      this.handleApiError(error);
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
      return this.handleApiError(error);
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
