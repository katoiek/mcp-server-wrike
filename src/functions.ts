import { WrikeClient } from './utils/wrikeClient.js';
import {
  WrikeRequestParams,
  WrikeTaskData,
  WrikeTimelogData,
  WrikeSpace,
  WrikeFolder,
  WrikeTask,
  WrikeComment,
  WrikeContact,
  WrikeTimelog,
  WrikeTimelogCategory
} from './types/wrike.js';
import { parseOptFields, createWrikeClient, createTimelogData } from './utils/helpers.js';
import { logger } from './utils/logger.js';

// MCP Functions

// List spaces
export async function wrike_list_spaces({ opt_fields }: { opt_fields?: string }): Promise<WrikeSpace[]> {
  // Initialize Wrike client for each request
  const accessToken = process.env.WRIKE_ACCESS_TOKEN as string;
  const host = process.env.WRIKE_HOST || 'www.wrike.com';
  const wrikeClient = new WrikeClient(accessToken, host);

  const params = parseOptFields(opt_fields);
  const spaces = await wrikeClient.getSpaces(params);
  return spaces;
}

// For backward compatibility
export const functions = {
  wrike_list_spaces,
  wrike_create_timelog,
  wrike_update_timelog,
  wrike_delete_timelog,
  wrike_get_timelog_categories,

  // Get space by ID
  wrike_get_space: async ({
    space_id,
    opt_fields
  }: {
    space_id: string;
    opt_fields?: string
  }): Promise<WrikeSpace> => {
    // Initialize Wrike client for each request
    const accessToken = process.env.WRIKE_ACCESS_TOKEN as string;
    const host = process.env.WRIKE_HOST || 'www.wrike.com';
    const wrikeClient = new WrikeClient(accessToken, host);

    if (!space_id) {
      throw new Error('space_id is required');
    }

    const params = parseOptFields(opt_fields);
    const space = await wrikeClient.getSpace(space_id, params);
    return space;
  },

  /**
   * Unified tool for working with Wrike folders, projects, and spaces
   * This function can be used in two modes:
   * 1. Search mode: Find multiple folders/projects based on criteria
   * 2. Get mode: Retrieve a single folder, project, or space by ID
   */
  wrike_get_folder_project: async ({
    space_id,
    folder_id,
    folder_ids,
    single_folder_id,
    name_pattern,
    project_only = false,
    archived = false,
    include_history = false,
    opt_fields
  }: {
    space_id?: string;
    folder_id?: string;
    folder_ids?: string[];
    single_folder_id?: string;  // New parameter for getting a single folder/project/space
    name_pattern?: string;
    project_only?: boolean;
    archived?: boolean;
    include_history?: boolean;
    opt_fields?: string
  }): Promise<WrikeFolder[] | WrikeFolder | WrikeSpace> => {
    // Initialize Wrike client for each request
    const wrikeClient = createWrikeClient();
    const params = parseOptFields(opt_fields);

    // MODE 1: Get a single folder, project, or space by ID
    if (single_folder_id) {
      try {
        // Strategy 1: Try as a space first
        try {
          logger.debug(`Attempting to retrieve as space: ${single_folder_id}`);
          const space = await wrikeClient.getSpace(single_folder_id, params);

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
            apiFolder_id = await wrikeClient.convertPermalinkId(single_folder_id, 'folder');
            logger.debug(`Converted to: ${apiFolder_id}`);
          } catch (error) {
            logger.error(`ID conversion error: ${(error as Error).message}`);
            // Continue with original ID if conversion fails
          }
        }

        // Get folder details
        logger.debug(`Retrieving folder: ${apiFolder_id}`);
        const folder = await wrikeClient.getFolder(apiFolder_id, params);
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
        folders = await wrikeClient.getFoldersBySpace(space_id, params);
      } else if (folder_id) {
        // Get all subfolders of a parent folder
        folders = await wrikeClient.getFoldersByParent(folder_id, params);
      } else if (folder_ids && folder_ids.length > 0) {
        // Get specific folders by IDs
        if (include_history) {
          folders = await wrikeClient.getFoldersHistory(folder_ids, params);
        } else {
          folders = await wrikeClient.getFoldersByIds(folder_ids, params);
        }
      } else {
        // Get all folders
        folders = await wrikeClient.getFolders(params);
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
  },

  // Search projects function has been removed and integrated into wrike_get_folder_project

  // Search tasks function has been removed and integrated into wrike_get_task

  /**
   * Unified tool for working with Wrike tasks
   * This function can be used in two modes:
   * 1. Get mode: Retrieve a single task by ID
   * 2. Search mode: Find tasks in a folder with filtering
   */
  wrike_get_task: async ({
    task_id,
    folder_id,
    title,
    status,
    importance,
    completed = false,
    subtasks = false,
    custom_fields,
    opt_fields
  }: {
    task_id?: string;
    folder_id?: string;
    title?: string;
    status?: string;
    importance?: string;
    completed?: boolean;
    subtasks?: boolean;
    custom_fields?: any;
    opt_fields?: string
  }): Promise<WrikeTask | WrikeTask[]> => {
    // Initialize Wrike client for each request
    const accessToken = process.env.WRIKE_ACCESS_TOKEN as string;
    const host = process.env.WRIKE_HOST || 'www.wrike.com';
    const wrikeClient = new WrikeClient(accessToken, host);

    // MODE 1: Get a specific task by ID
    if (task_id) {
      // Convert task ID if it's a permalink or numeric ID
      if (task_id.includes('open.htm?id=') || /^\d+$/.test(task_id)) {
        try {
          task_id = await wrikeClient.convertPermalinkId(task_id, 'task');
        } catch (error) {
          throw new Error(`Failed to convert task ID: ${(error as Error).message}`);
        }
      }

      const params = parseOptFields(opt_fields);
      const task = await wrikeClient.getTask(task_id, params);
      return task;
    }

    // MODE 2: Search for tasks in a folder
    if (folder_id) {
      const params: WrikeRequestParams = {
        ...parseOptFields(opt_fields)
      };

      // Add filters if provided
      if (title) params.title = title;
      if (status) params.status = status;
      if (importance) params.importance = importance;
      if (completed !== undefined) params.completed = completed;
      if (subtasks !== undefined) params.subtasks = subtasks;
      if (custom_fields) params.customFields = JSON.stringify(custom_fields);

      const tasks = await wrikeClient.getTasksByFolder(folder_id, params);
      return tasks;
    }

    throw new Error('Either task_id or folder_id must be provided');
  },

  // Get tasks history
  wrike_get_tasks_history: async ({
    task_ids,
    opt_fields
  }: {
    task_ids: string[] | string;
    opt_fields?: string
  }): Promise<WrikeTask[]> => {
    // Initialize Wrike client for each request
    const accessToken = process.env.WRIKE_ACCESS_TOKEN as string;
    const host = process.env.WRIKE_HOST || 'www.wrike.com';
    const wrikeClient = new WrikeClient(accessToken, host);

    if (!task_ids || (Array.isArray(task_ids) && task_ids.length === 0)) {
      throw new Error('task_ids is required');
    }

    const params = parseOptFields(opt_fields);
    const tasksHistory = await wrikeClient.getTasksHistory(task_ids, params);
    return tasksHistory;
  },

  // Create task
  wrike_create_task: async ({
    folder_id,
    title,
    description,
    status,
    importance,
    dates,
    assignees,
    followers,
    parent_id
  }: {
    folder_id: string;
    title: string;
    description?: string;
    status?: string;
    importance?: string;
    dates?: {
      start?: string;
      due?: string;
      type?: string;
    };
    assignees?: string[];
    followers?: string[];
    parent_id?: string
  }): Promise<WrikeTask> => {
    // Initialize Wrike client for each request
    const accessToken = process.env.WRIKE_ACCESS_TOKEN as string;
    const host = process.env.WRIKE_HOST || 'www.wrike.com';
    const wrikeClient = new WrikeClient(accessToken, host);

    if (!folder_id) {
      throw new Error('folder_id is required');
    }
    if (!title) {
      throw new Error('title is required');
    }

    const data: WrikeTaskData = { title };
    if (description) data.description = description;
    if (status) data.status = status;
    if (importance) data.importance = importance;
    if (dates) data.dates = dates;
    if (assignees) data.responsibles = assignees;
    if (followers) data.followers = followers;
    if (parent_id) data.superTaskIds = [parent_id];

    const task = await wrikeClient.createTask(folder_id, data, {});
    return task;
  },

  // Get comments
  wrike_get_comments: async ({
    task_id,
    folder_id,
    comment_ids,
    opt_fields
  }: {
    task_id?: string;
    folder_id?: string;
    comment_ids?: string[];
    opt_fields?: string
  }): Promise<WrikeComment[]> => {
    // Initialize Wrike client for each request
    const accessToken = process.env.WRIKE_ACCESS_TOKEN as string;
    const host = process.env.WRIKE_HOST || 'www.wrike.com';
    const wrikeClient = new WrikeClient(accessToken, host);

    const params = parseOptFields(opt_fields);

    // Determine which API endpoint to use based on provided parameters
    if (task_id) {
      return await wrikeClient.getCommentsByTask(task_id, params);
    } else if (folder_id) {
      return await wrikeClient.getCommentsByFolder(folder_id, params);
    } else if (comment_ids && comment_ids.length > 0) {
      return await wrikeClient.getCommentsByIds(comment_ids, params);
    } else {
      // If no specific filter is provided, get all comments
      return await wrikeClient.getAllComments(params);
    }
  },

  // Get task comments (for backward compatibility)
  wrike_get_task_comments: async ({
    task_id,
    opt_fields
  }: {
    task_id: string;
    opt_fields?: string
  }): Promise<WrikeComment[]> => {
    // Initialize Wrike client for each request
    const accessToken = process.env.WRIKE_ACCESS_TOKEN as string;
    const host = process.env.WRIKE_HOST || 'www.wrike.com';
    const wrikeClient = new WrikeClient(accessToken, host);

    if (!task_id) {
      throw new Error('task_id is required');
    }

    const params = parseOptFields(opt_fields);
    const comments = await wrikeClient.getCommentsByTask(task_id, params);
    return comments;
  },

  // Update task
  wrike_update_task: async ({
    task_id,
    title,
    description,
    status,
    importance,
    dates,
    completed
  }: {
    task_id: string;
    title?: string;
    description?: string;
    status?: string;
    importance?: string;
    dates?: {
      start?: string;
      due?: string;
      type?: string;
    };
    completed?: boolean
  }): Promise<WrikeTask> => {
    // Initialize Wrike client for each request
    const accessToken = process.env.WRIKE_ACCESS_TOKEN as string;
    const host = process.env.WRIKE_HOST || 'www.wrike.com';
    const wrikeClient = new WrikeClient(accessToken, host);

    if (!task_id) {
      throw new Error('task_id is required');
    }

    const data: WrikeTaskData = {};
    if (title) data.title = title;
    if (description) data.description = description;
    if (status) data.status = status;
    if (importance) data.importance = importance;
    if (dates) data.dates = dates;
    if (completed !== undefined) data.completed = completed;

    const task = await wrikeClient.updateTask(task_id, data, {});
    return task;
  },

  // Get folder or project details function has been removed and integrated into wrike_get_folder_project

  // Create comment
  wrike_create_comment: async ({
    task_id,
    text,
    opt_fields
  }: {
    task_id: string;
    text: string;
    opt_fields?: string
  }): Promise<WrikeComment> => {
    // Initialize Wrike client for each request
    const accessToken = process.env.WRIKE_ACCESS_TOKEN as string;
    const host = process.env.WRIKE_HOST || 'www.wrike.com';
    const wrikeClient = new WrikeClient(accessToken, host);

    if (!task_id) {
      throw new Error('task_id is required');
    }
    if (!text) {
      throw new Error('text is required');
    }

    const data = { text };
    const comment = await wrikeClient.createComment(task_id, data, parseOptFields(opt_fields));
    return comment;
  },

  // Create subtask
  wrike_create_subtask: async ({
    parent_task_id,
    title,
    description,
    status,
    importance,
    dates,
    assignees,
    opt_fields
  }: {
    parent_task_id: string;
    title: string;
    description?: string;
    status?: string;
    importance?: string;
    dates?: {
      start?: string;
      due?: string;
      type?: string;
    };
    assignees?: string[];
    opt_fields?: string
  }): Promise<WrikeTask> => {
    // Initialize Wrike client for each request
    const accessToken = process.env.WRIKE_ACCESS_TOKEN as string;
    const host = process.env.WRIKE_HOST || 'www.wrike.com';
    const wrikeClient = new WrikeClient(accessToken, host);

    if (!parent_task_id) {
      throw new Error('parent_task_id is required');
    }
    if (!title) {
      throw new Error('title is required');
    }

    // First, get the parent task to find its folder
    const parentTaskResponse = await wrikeClient.getTask(parent_task_id);
    if (!parentTaskResponse || !parentTaskResponse.parentIds || parentTaskResponse.parentIds.length === 0) {
      throw new Error('Could not determine folder for parent task');
    }

    const folderId = parentTaskResponse.parentIds[0];

    const data: WrikeTaskData = {
      title,
      superTaskIds: [parent_task_id]
    };

    if (description) data.description = description;
    if (status) data.status = status;
    if (importance) data.importance = importance;
    if (dates) data.dates = dates;
    if (assignees) data.responsibles = assignees;

    const subtask = await wrikeClient.createTask(folderId, data, {});
    return subtask;
  },

  // Get contacts
  wrike_get_contacts: async ({
    me = false,
    opt_fields
  }: {
    me?: boolean;
    opt_fields?: string
  }): Promise<WrikeContact[]> => {
    // Initialize Wrike client for each request
    const accessToken = process.env.WRIKE_ACCESS_TOKEN as string;
    const host = process.env.WRIKE_HOST || 'www.wrike.com';
    const wrikeClient = new WrikeClient(accessToken, host);

    const params: WrikeRequestParams = parseOptFields(opt_fields);
    if (me) params.me = true;

    const contacts = await wrikeClient.getContacts(params);
    return contacts;
  }
};

// Create timelog
export async function wrike_create_timelog({
  task_id,
  hours,
  tracked_date,
  comment,
  category_id
}: {
  task_id: string;
  hours: number;
  tracked_date: string;
  comment?: string;
  category_id?: string;
}): Promise<WrikeTimelog> {
  // Initialize Wrike client
  const wrikeClient = createWrikeClient();

  // Validate required fields
  if (!task_id) {
    throw new Error('task_id is required');
  }
  if (hours <= 0) {
    throw new Error('hours must be a positive number');
  }
  if (!tracked_date) {
    throw new Error('tracked_date is required (format: YYYY-MM-DD)');
  }

  // Create timelog data
  const data = createTimelogData(hours, tracked_date, comment, category_id);

  // Create timelog
  return await wrikeClient.createTimelog(task_id, data);
}

// Update timelog
export async function wrike_update_timelog({
  timelog_id,
  hours,
  tracked_date,
  comment,
  category_id
}: {
  timelog_id: string;
  hours?: number;
  tracked_date?: string;
  comment?: string;
  category_id?: string;
}): Promise<WrikeTimelog> {
  // Initialize Wrike client
  const wrikeClient = createWrikeClient();

  // Validate required fields
  if (!timelog_id) {
    throw new Error('timelog_id is required');
  }

  // Create timelog data
  const data = createTimelogData(hours, tracked_date, comment, category_id);

  // Update timelog
  return await wrikeClient.updateTimelog(timelog_id, data);
}

// Delete timelog
export async function wrike_delete_timelog({
  timelog_id
}: {
  timelog_id: string;
}) {
  // Initialize Wrike client
  const wrikeClient = createWrikeClient();

  // Validate required fields
  if (!timelog_id) {
    throw new Error('timelog_id is required');
  }

  // Delete timelog
  const success = await wrikeClient.deleteTimelog(timelog_id);
  return { success };
}

// Get timelog categories
export async function wrike_get_timelog_categories({
  opt_fields
}: {
  opt_fields?: string;
}): Promise<WrikeTimelogCategory[]> {
  // Initialize Wrike client
  const wrikeClient = createWrikeClient();

  // Get timelog categories
  const params = parseOptFields(opt_fields);
  return await wrikeClient.getTimelogCategories(params);
}
