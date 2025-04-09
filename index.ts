import dotenv from 'dotenv';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { WrikeClient } from './src/wrikeClient.js';
import { z } from 'zod';
import { parseOptFields } from './src/utils/helpers.js';
import { WrikeRequestParams, WrikeTaskData, WrikeTimelogData, WrikeFolder } from './src/types/wrike.js';
import * as wrikeFunctions from './src/functions.js';

// Initialize environment variables
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load from multiple possible locations
const envPaths = [
  path.join(__dirname, '.env'),
  path.join(process.cwd(), '.env'),
  path.join(path.dirname(process.execPath), '.env')
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    console.error(`Loading environment from: ${envPath}`);
    dotenv.config({ path: envPath });
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.error('Warning: No .env file found. Checking environment variables directly.');
}

// Check for required environment variables
if (!process.env.WRIKE_ACCESS_TOKEN) {
  console.error('Error: WRIKE_ACCESS_TOKEN environment variable is required');
  console.error('Please set it in .env file or in the Claude Desktop configuration');
  console.error('Current environment variables:', Object.keys(process.env).join(', '));
  process.exit(1);
}

// Create MCP server
const port = process.env.PORT || 3000;

const server = new McpServer({
  name: 'wrike',
  version: '1.0.0',
  description: 'Wrike API integration for MCP'
});

// Register tools using the new format
// List spaces
server.tool(
  'wrike_list_spaces',
  z.object({
    opt_fields: z.string().optional().describe('Optional fields to include in the response')
  }),
  async ({ opt_fields }: { opt_fields?: string }) => {
    // Initialize Wrike client for each request
    const accessToken = process.env.WRIKE_ACCESS_TOKEN as string;
    const host = process.env.WRIKE_HOST || 'www.wrike.com';
    const wrikeClient = new WrikeClient(accessToken, host);

    const params = parseOptFields(opt_fields);
    const spaces = await wrikeClient.getSpaces(params);
    return spaces;
  },
  { description: 'List all spaces in Wrike' }
);

// Get space by ID
server.tool(
  'wrike_get_space',
  z.object({
    space_id: z.string().describe('ID of the space to retrieve'),
    opt_fields: z.string().optional().describe('Optional fields to include in the response')
  }),
  async ({ space_id, opt_fields }: { space_id: string; opt_fields?: string }) => {
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
  { description: 'Get details of a specific Wrike space' }
);

// Unified tool for working with Wrike folders, projects, and spaces
server.tool(
  'wrike_get_folder_project',
  z.object({
    space_id: z.string().optional().describe('ID of the space to search in'),
    folder_id: z.string().optional().describe('ID of the parent folder to search in'),
    folder_ids: z.array(z.string()).optional().describe('Specific folder IDs to retrieve (up to 100)'),
    single_folder_id: z.string().optional().describe('ID of a specific folder, project, or space to retrieve'),
    name_pattern: z.string().optional().describe('Pattern to match folder/project names'),
    project_only: z.boolean().optional().default(false).describe('Only return folders that are projects'),
    archived: z.boolean().optional().default(false).describe('Include archived folders/projects'),
    include_history: z.boolean().optional().default(false).describe('Include folder history when using folder_ids'),
    opt_fields: z.string().optional().describe('Optional fields to include in the response')
  }),
  async ({ space_id, folder_id, folder_ids, single_folder_id, name_pattern, project_only = false, archived = false, include_history = false, opt_fields }: {
    space_id?: string;
    folder_id?: string;
    folder_ids?: string[];
    single_folder_id?: string;
    name_pattern?: string;
    project_only?: boolean;
    archived?: boolean;
    include_history?: boolean;
    opt_fields?: string
  }) => {
    // Initialize Wrike client for each request
    const accessToken = process.env.WRIKE_ACCESS_TOKEN as string;
    const host = process.env.WRIKE_HOST || 'www.wrike.com';
    const wrikeClient = new WrikeClient(accessToken, host);

    // Use the enhanced searchFoldersProjects method
    return await wrikeClient.searchFoldersProjects({
      space_id,
      folder_id,
      folder_ids,
      single_folder_id,
      name_pattern,
      project_only,
      archived,
      include_history,
      opt_fields
    });
  },
  {
    description: 'Unified tool for working with Wrike folders, projects, and spaces. Can search for multiple items or get a specific one.',
    examples: [
      // Example 1: Search for folders in a space
      {
        input: { space_id: 'IEAAAAAQ' },
        output: [{ id: 'IEAAAAAQI', title: 'Marketing Campaign', scope: 'WsFolder' }]
      },
      // Example 2: Get a specific folder/project/space by ID
      {
        input: { single_folder_id: 'IEAAAAAQ' },
        output: { id: 'IEAAAAAQ', title: 'Marketing', childIds: ['IEAAAAAQI', 'IEAAAAAQII'], scope: 'WsFolder' }
      },
      // Example 3: Search for projects only
      {
        input: { space_id: 'IEAAAAAQ', project_only: true, name_pattern: 'Marketing' },
        output: [{ id: 'IEAAAAAQI', title: 'Marketing Campaign', project: { status: 'Green' }, scope: 'WsFolder' }]
      }
    ]
  }
);

// Search projects (for backward compatibility)
// This tool is now deprecated in favor of wrike_get_folder_project with project_only=true

// Search tasks (for backward compatibility)
// This functionality is now integrated into wrike_get_task with folder_id parameter

// Unified tool for working with Wrike tasks
server.tool(
  'wrike_get_task',
  z.object({
    task_id: z.string().optional().describe('ID of a specific task to retrieve'),
    folder_id: z.string().optional().describe('ID of the folder to search tasks in'),
    title: z.string().optional().describe('Filter by task title'),
    status: z.string().optional().describe('Filter by task status'),
    importance: z.string().optional().describe('Filter by task importance'),
    completed: z.boolean().optional().default(false).describe('Filter by completion status'),
    subtasks: z.boolean().optional().default(false).describe('Include subtasks'),
    custom_fields: z.any().optional().describe('Custom fields to filter by'),
    opt_fields: z.string().optional().describe('Optional fields to include in the response')
  }),
  async ({ task_id, folder_id, title, status, importance, completed = false, subtasks = false, custom_fields, opt_fields }: {
    task_id?: string;
    folder_id?: string;
    title?: string;
    status?: string;
    importance?: string;
    completed?: boolean;
    subtasks?: boolean;
    custom_fields?: any;
    opt_fields?: string;
  }) => {
    // Initialize Wrike client for each request
    const accessToken = process.env.WRIKE_ACCESS_TOKEN as string;
    const host = process.env.WRIKE_HOST || 'www.wrike.com';
    const wrikeClient = new WrikeClient(accessToken, host);

    // MODE 1: Get a specific task by ID
    if (task_id) {
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
  {
    description: 'Unified tool for working with Wrike tasks. Can get a specific task by ID or search for tasks in a folder.',
    examples: [
      // Example 1: Get a specific task by ID
      {
        input: { task_id: 'IEAAAAAQIIIII' },
        output: { id: 'IEAAAAAQIIIII', title: 'Complete project documentation', status: 'Active' }
      },
      // Example 2: Search for tasks in a folder
      {
        input: { folder_id: 'IEAAAAAQI', status: 'Active', completed: false },
        output: [{ id: 'IEAAAAAQIIIII', title: 'Complete project documentation', status: 'Active' }]
      }
    ]
  }
);

// Get tasks history
server.tool(
  'wrike_get_tasks_history',
  z.object({
    task_ids: z.union([z.string(), z.array(z.string())]).describe('Task ID or comma-separated list of task IDs (up to 100)'),
    opt_fields: z.string().optional().describe('Optional fields to include in the response')
  }),
  async ({ task_ids, opt_fields }: {
    task_ids: string[] | string;
    opt_fields?: string;
  }) => {
    // Initialize Wrike client for each request
    const accessToken = process.env.WRIKE_ACCESS_TOKEN as string;
    const host = process.env.WRIKE_HOST || 'www.wrike.com';
    const wrikeClient = new WrikeClient(accessToken, host);

    if (!task_ids || (Array.isArray(task_ids) && task_ids.length === 0)) {
      throw new Error('task_ids is required');
    }

    // Handle single task ID case
    if (typeof task_ids === 'string' && task_ids.includes('open.htm?id=')) {
      // Extract the ID from the URL
      const matches = task_ids.match(/id=(\d+)/);
      if (matches && matches[1]) {
        task_ids = matches[1];
        console.error(`Extracted task ID: ${task_ids}`);
      }
    }

    const params = parseOptFields(opt_fields);

    try {
      const tasksHistory = await wrikeClient.getTasksHistory(task_ids, params);
      return tasksHistory;
    } catch (error) {
      console.error(`Error getting task history: ${(error as Error).message}`);
      throw error;
    }
  },
  { description: 'Get field history for specific Wrike tasks' }
);

// Create task
server.tool(
  'wrike_create_task',
  z.object({
    folder_id: z.string().describe('ID of the folder to create the task in'),
    title: z.string().describe('Title of the task'),
    description: z.string().optional().describe('Description of the task'),
    status: z.string().optional().describe('Status of the task'),
    importance: z.string().optional().describe('Importance of the task'),
    dates: z.any().optional().describe('Due dates for the task'),
    assignees: z.array(z.string()).optional().describe('IDs of users to assign to the task'),
    followers: z.array(z.string()).optional().describe('IDs of users to add as followers'),
    parent_id: z.string().optional().describe('ID of the parent task')
  }),
  async ({ folder_id, title, description, status, importance, dates, assignees, followers, parent_id }: {
    folder_id: string;
    title: string;
    description?: string;
    status?: string;
    importance?: string;
    dates?: any;
    assignees?: string[];
    followers?: string[];
    parent_id?: string;
  }) => {
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
  { description: 'Create a new task in Wrike' }
);

// Get task comments
server.tool(
  'wrike_get_task_comments',
  z.object({
    task_id: z.string().describe('ID of the task to get comments for'),
    opt_fields: z.string().optional().describe('Optional fields to include in the response')
  }),
  async ({ task_id, opt_fields }: {
    task_id: string;
    opt_fields?: string;
  }) => {
    // Initialize Wrike client for each request
    const accessToken = process.env.WRIKE_ACCESS_TOKEN as string;
    const host = process.env.WRIKE_HOST || 'www.wrike.com';
    const wrikeClient = new WrikeClient(accessToken, host);

    if (!task_id) {
      throw new Error('task_id is required');
    }

    const params = parseOptFields(opt_fields);
    const comments = await wrikeClient.getComments(task_id, params);
    return comments;
  },
  { description: 'Get comments for a specific Wrike task' }
);

// Update task
server.tool(
  'wrike_update_task',
  z.object({
    task_id: z.string().describe('ID of the task to update'),
    title: z.string().optional().describe('New title for the task'),
    description: z.string().optional().describe('New description for the task'),
    status: z.string().optional().describe('New status for the task'),
    importance: z.string().optional().describe('New importance for the task'),
    dates: z.any().optional().describe('New due dates for the task'),
    completed: z.boolean().optional().describe('Mark task as completed')
  }),
  async ({ task_id, title, description, status, importance, dates, completed }: {
    task_id: string;
    title?: string;
    description?: string;
    status?: string;
    importance?: string;
    dates?: any;
    completed?: boolean;
  }) => {
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
  { description: 'Update an existing Wrike task' }
);

// Get folder, project, or space details
// This functionality is now integrated into wrike_get_folder_project with single_folder_id parameter
// The implementation is kept for backward compatibility but will be removed in a future version

// Create comment
server.tool(
  'wrike_create_comment',
  z.object({
    task_id: z.string().describe('ID of the task to comment on'),
    text: z.string().describe('Text of the comment'),
    opt_fields: z.string().optional().describe('Optional fields to include in the response')
  }),
  async ({ task_id, text, opt_fields }: {
    task_id: string;
    text: string;
    opt_fields?: string;
  }) => {
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
  { description: 'Create a comment on a Wrike task' }
);

// Create subtask
server.tool(
  'wrike_create_subtask',
  z.object({
    parent_task_id: z.string().describe('ID of the parent task'),
    title: z.string().describe('Title of the subtask'),
    description: z.string().optional().describe('Description of the subtask'),
    status: z.string().optional().describe('Status of the subtask'),
    importance: z.string().optional().describe('Importance of the subtask'),
    dates: z.any().optional().describe('Due dates for the subtask'),
    assignees: z.array(z.string()).optional().describe('IDs of users to assign to the subtask'),
    opt_fields: z.string().optional().describe('Optional fields to include in the response')
  }),
  async ({ parent_task_id, title, description, status, importance, dates, assignees, opt_fields }: {
    parent_task_id: string;
    title: string;
    description?: string;
    status?: string;
    importance?: string;
    dates?: any;
    assignees?: string[];
    opt_fields?: string;
  }) => {
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
  { description: 'Create a subtask under a parent task in Wrike' }
);

// Get contacts
server.tool(
  'wrike_get_contacts',
  z.object({
    me: z.boolean().optional().default(false).describe('Only return the current user'),
    opt_fields: z.string().optional().describe('Optional fields to include in the response')
  }),
  async ({ me = false, opt_fields }: {
    me?: boolean;
    opt_fields?: string;
  }) => {
    // Initialize Wrike client for each request
    const accessToken = process.env.WRIKE_ACCESS_TOKEN as string;
    const host = process.env.WRIKE_HOST || 'www.wrike.com';
    const wrikeClient = new WrikeClient(accessToken, host);

    const params: WrikeRequestParams = parseOptFields(opt_fields);
    if (me) params.me = true;

    const contacts = await wrikeClient.getContacts(params);
    return contacts;
  },
  { description: 'Get contacts from Wrike' }
);

// Create timelog
server.tool(
  'wrike_create_timelog',
  z.object({
    task_id: z.string().describe('ID of the task to add the timelog to'),
    hours: z.number().positive().describe('Number of hours to log'),
    tracked_date: z.string().describe('Date when the time was spent (YYYY-MM-DD)'),
    comment: z.string().optional().describe('Comment for the timelog'),
    category_id: z.string().optional().describe('ID of the timelog category')
  }),
  async (params: {
    task_id: string;
    hours: number;
    tracked_date: string;
    comment?: string;
    category_id?: string;
  }) => {
    return await wrikeFunctions.wrike_create_timelog(params);
  },
  { description: 'Create a new timelog entry for a task in Wrike' }
);

// Update timelog
server.tool(
  'wrike_update_timelog',
  z.object({
    timelog_id: z.string().describe('ID of the timelog to update'),
    hours: z.number().positive().optional().describe('New number of hours'),
    tracked_date: z.string().optional().describe('New date when the time was spent (YYYY-MM-DD)'),
    comment: z.string().optional().describe('New comment for the timelog'),
    category_id: z.string().optional().describe('New ID of the timelog category')
  }),
  async (params: {
    timelog_id: string;
    hours?: number;
    tracked_date?: string;
    comment?: string;
    category_id?: string;
  }) => {
    return await wrikeFunctions.wrike_update_timelog(params);
  },
  { description: 'Update an existing timelog entry in Wrike' }
);

// Delete timelog
server.tool(
  'wrike_delete_timelog',
  z.object({
    timelog_id: z.string().describe('ID of the timelog to delete')
  }),
  async (params: {
    timelog_id: string;
  }) => {
    return await wrikeFunctions.wrike_delete_timelog(params);
  },
  { description: 'Delete a timelog entry in Wrike' }
);

// Get timelog categories
server.tool(
  'wrike_get_timelog_categories',
  z.object({
    opt_fields: z.string().optional().describe('Optional fields to include in the response')
  }),
  async (params: {
    opt_fields?: string;
  }) => {
    return await wrikeFunctions.wrike_get_timelog_categories(params);
  },
  { description: 'Get all timelog categories from Wrike' }
);

// Start server with stdio transport
const transport = new StdioServerTransport();

// Connect to the transport
server.connect(transport).then(() => {
  console.log(`MCP Server for Wrike is running with stdio transport`);
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
