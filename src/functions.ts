import { WrikeClient } from './wrikeClient.js';
import {
  WrikeRequestParams,
  WrikeTaskData,
  WrikeSpace,
  WrikeFolder,
  WrikeTask,
  WrikeComment,
  WrikeContact
} from './types/wrike.js';
import { parseOptFields } from './utils/helpers.js';

// MCP Functions
export const functions = {
  // List spaces
  wrike_list_spaces: async ({ opt_fields }: { opt_fields?: string }): Promise<WrikeSpace[]> => {
    // Initialize Wrike client for each request
    const accessToken = process.env.WRIKE_ACCESS_TOKEN as string;
    const host = process.env.WRIKE_HOST || 'www.wrike.com';
    const wrikeClient = new WrikeClient(accessToken, host);

    const params = parseOptFields(opt_fields);
    const spaces = await wrikeClient.getSpaces(params);
    return spaces;
  },

  // Search projects
  wrike_search_projects: async ({
    space_id,
    name_pattern,
    archived = false,
    opt_fields
  }: {
    space_id: string;
    name_pattern: string;
    archived?: boolean;
    opt_fields?: string
  }): Promise<WrikeFolder[]> => {
    // Initialize Wrike client for each request
    const accessToken = process.env.WRIKE_ACCESS_TOKEN as string;
    const host = process.env.WRIKE_HOST || 'www.wrike.com';
    const wrikeClient = new WrikeClient(accessToken, host);

    if (!space_id) {
      throw new Error('space_id is required');
    }
    if (!name_pattern) {
      throw new Error('name_pattern is required');
    }

    const params = {
      ...parseOptFields(opt_fields)
    };

    // Get all folders in the space
    const folders = await wrikeClient.getFoldersBySpace(space_id, params);

    // Filter folders that are projects and match the name pattern
    const regex = new RegExp(name_pattern, 'i');
    const projects = folders.filter(folder => {
      const isProject = folder.project !== undefined;
      const nameMatches = regex.test(folder.title);
      const archiveMatches = archived ? folder.archived : !folder.archived;
      return isProject && nameMatches && archiveMatches;
    });

    return projects;
  },

  // Search tasks
  wrike_search_tasks: async ({
    folder_id,
    title,
    status,
    importance,
    completed = false,
    subtasks = false,
    opt_fields,
    custom_fields
  }: {
    folder_id: string;
    title?: string;
    status?: string;
    importance?: string;
    completed?: boolean;
    subtasks?: boolean;
    opt_fields?: string;
    custom_fields?: any
  }): Promise<WrikeTask[]> => {
    // Initialize Wrike client for each request
    const accessToken = process.env.WRIKE_ACCESS_TOKEN as string;
    const host = process.env.WRIKE_HOST || 'www.wrike.com';
    const wrikeClient = new WrikeClient(accessToken, host);

    if (!folder_id) {
      throw new Error('folder_id is required');
    }

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
  },

  // Get task details
  wrike_get_task: async ({
    task_id,
    opt_fields
  }: {
    task_id: string;
    opt_fields?: string
  }): Promise<WrikeTask> => {
    // Initialize Wrike client for each request
    const accessToken = process.env.WRIKE_ACCESS_TOKEN as string;
    const host = process.env.WRIKE_HOST || 'www.wrike.com';
    const wrikeClient = new WrikeClient(accessToken, host);

    if (!task_id) {
      throw new Error('task_id is required');
    }

    const params = parseOptFields(opt_fields);
    const task = await wrikeClient.getTask(task_id, params);
    return task;
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

  // Get folder details
  wrike_get_folder: async ({
    folder_id,
    opt_fields
  }: {
    folder_id: string;
    opt_fields?: string
  }): Promise<WrikeFolder> => {
    // Initialize Wrike client for each request
    const accessToken = process.env.WRIKE_ACCESS_TOKEN as string;
    const host = process.env.WRIKE_HOST || 'www.wrike.com';
    const wrikeClient = new WrikeClient(accessToken, host);

    if (!folder_id) {
      throw new Error('folder_id is required');
    }

    const params = parseOptFields(opt_fields);
    const folder = await wrikeClient.getFolder(folder_id, params);
    return folder;
  },

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
