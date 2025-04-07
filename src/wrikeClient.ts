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
  WrikeRequestParams,
  WrikeTaskParams,
  WrikeTaskData,
  WrikeFolderData,
  WrikeCommentData,
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

  async getTimelogsById(timelogIds: string[] | string, params: WrikeRequestParams = {}): Promise<WrikeTimelog[]> {
    try {
      // Convert array to comma-separated string if needed
      const ids = Array.isArray(timelogIds) ? timelogIds.join(',') : timelogIds;
      const response = await this.client.get(`/timelogs/${ids}`, { params });
      return this.handleResponse<WrikeTimelog[]>(response);
    } catch (error) {
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
}
