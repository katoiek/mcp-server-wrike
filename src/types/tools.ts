import { z } from 'zod';

// Base schema for common optional fields
const optionalFieldsSchema = z.object({
  opt_fields: z.string().optional().describe('Comma-separated list of optional fields to include')
});

// Tool schemas
export const echoSchema = z.object({
  message: z.string().describe('Message to echo back')
});

export const listSpacesSchema = optionalFieldsSchema.extend({});

export const createFolderSchema = optionalFieldsSchema.extend({
  parent_id: z.string().describe('ID of the parent folder'),
  title: z.string().describe('Title of the folder'),
  description: z.string().optional().describe('Description of the folder'),
  shareds: z.array(z.string()).optional().describe('Array of user IDs to share the folder with')
});

export const searchProjectsSchema = optionalFieldsSchema.extend({
  space_id: z.string().describe('ID of the space to search in'),
  name_pattern: z.string().describe('Pattern to match project names'),
  archived: z.boolean().default(false).describe('Include archived projects')
});

export const searchTasksSchema = optionalFieldsSchema.extend({
  space_id: z.string().describe('ID of the space to search in'),
  title: z.string().optional().describe('Text to search for in task titles'),
  status: z.string().optional().describe('Filter by task status (Active, Completed, Deferred, Cancelled)'),
  importance: z.string().optional().describe('Filter by task importance (High, Normal, Low)'),
  scheduled: z.boolean().optional().describe('Filter for tasks with scheduled dates'),
  completed: z.boolean().optional().describe('Filter for completed tasks'),
  authors: z.array(z.string()).optional().describe('Filter by task authors (array of user IDs)'),
  responsibles: z.array(z.string()).optional().describe('Filter by task responsibles (array of user IDs)')
});

export const getTaskSchema = optionalFieldsSchema.extend({
  task_id: z.string().describe('ID of the task to retrieve')
});

export const createTaskSchema = optionalFieldsSchema.extend({
  folder_id: z.string().describe('ID of the folder/project to create the task in'),
  title: z.string().describe('Title of the task'),
  description: z.string().optional().describe('Description of the task'),
  status: z.string().optional().describe('Status of the task (Active, Completed, Deferred, Cancelled)'),
  importance: z.string().optional().describe('Importance of the task (High, Normal, Low)'),
  dates: z.object({
    start: z.string().optional().describe('Start date in YYYY-MM-DD format'),
    due: z.string().optional().describe('Due date in YYYY-MM-DD format')
  }).optional().describe('Task dates object with start and due dates'),
  responsibles: z.array(z.string()).optional().describe('Array of user IDs to assign as responsibles')
});

export const updateTaskSchema = optionalFieldsSchema.extend({
  task_id: z.string().describe('ID of the task to update'),
  title: z.string().optional().describe('New title for the task'),
  description: z.string().optional().describe('New description for the task'),
  status: z.string().optional().describe('New status for the task (Active, Completed, Deferred, Cancelled)'),
  importance: z.string().optional().describe('New importance for the task (High, Normal, Low)'),
  dates: z.object({
    start: z.string().optional().describe('Start date in YYYY-MM-DD format'),
    due: z.string().optional().describe('Due date in YYYY-MM-DD format')
  }).optional().describe('Task dates object with start and due dates'),
  responsibles: z.array(z.string()).optional().describe('Array of user IDs to assign as responsibles')
});

export const getCommentsSchema = optionalFieldsSchema.extend({
  task_id: z.string().optional().describe('Get comments for a specific task ID'),
  folder_id: z.string().optional().describe('Get comments for a specific folder ID'),
  comment_ids: z.array(z.string()).optional().describe('Get specific comments by IDs (up to 100)')
});

export const createCommentSchema = optionalFieldsSchema.extend({
  task_id: z.string().describe('ID of the task to add the comment to'),
  text: z.string().describe('Text content of the comment')
});

export const getProjectSchema = optionalFieldsSchema.extend({
  project_id: z.string().describe('ID of the project to retrieve')
});

export const getContactsSchema = optionalFieldsSchema.extend({});

export const getTimelogsSchema = optionalFieldsSchema.extend({
  task_id: z.string().optional().describe('Filter timelogs by task ID'),
  contact_id: z.string().optional().describe('Filter timelogs by contact/user ID'),
  folder_id: z.string().optional().describe('Filter timelogs by folder ID'),
  category_id: z.string().optional().describe('Filter timelogs by timelog category ID'),
  timelog_ids: z.string().optional().describe('Comma-separated list of timelog IDs to retrieve (up to 100)'),
  start_date: z.string().optional().describe('Filter timelogs by start date (YYYY-MM-DD)'),
  end_date: z.string().optional().describe('Filter timelogs by end date (YYYY-MM-DD)')
});

// Tool types
export type EchoInput = z.infer<typeof echoSchema>;
export type ListSpacesInput = z.infer<typeof listSpacesSchema>;
export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type SearchProjectsInput = z.infer<typeof searchProjectsSchema>;
export type SearchTasksInput = z.infer<typeof searchTasksSchema>;
export type GetTaskInput = z.infer<typeof getTaskSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type GetCommentsInput = z.infer<typeof getCommentsSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type GetProjectInput = z.infer<typeof getProjectSchema>;
export type GetContactsInput = z.infer<typeof getContactsSchema>;
export type GetTimelogsInput = z.infer<typeof getTimelogsSchema>;

// Tool interface
export interface Tool {
  name: string;
  description: string;
  schema: z.ZodObject<any>;
}

// Tool definitions
export const tools: Tool[] = [
  {
    name: 'wrike_list_spaces',
    description: 'List all available spaces in Wrike',
    schema: listSpacesSchema
  },
  {
    name: 'wrike_create_folder',
    description: 'Create a new folder in Wrike',
    schema: createFolderSchema
  },
  {
    name: 'wrike_get_timelogs',
    description: 'Get timelogs from Wrike with filtering options',
    schema: getTimelogsSchema
  },
  {
    name: 'wrike_search_projects',
    description: 'Search for projects in a Wrike space',
    schema: searchProjectsSchema
  },
  {
    name: 'wrike_search_tasks',
    description: 'Search tasks in a Wrike space with filtering options',
    schema: searchTasksSchema
  },
  {
    name: 'wrike_get_task',
    description: 'Get detailed information about a specific Wrike task',
    schema: getTaskSchema
  },
  {
    name: 'wrike_create_task',
    description: 'Create a new task in a Wrike project/folder',
    schema: createTaskSchema
  },
  {
    name: 'wrike_update_task',
    description: 'Update an existing Wrike task',
    schema: updateTaskSchema
  },
  {
    name: 'wrike_get_comments',
    description: 'Get comments from Wrike with various filtering options',
    schema: getCommentsSchema
  },
  {
    name: 'wrike_create_comment',
    description: 'Create a comment on a Wrike task',
    schema: createCommentSchema
  },
  {
    name: 'wrike_get_project',
    description: 'Get detailed information about a specific Wrike project',
    schema: getProjectSchema
  },
  {
    name: 'wrike_get_contacts',
    description: 'Get contacts/users in Wrike',
    schema: getContactsSchema
  },
  {
    name: 'wrike_get_task_comments',
    description: 'Get comments for a specific Wrike task (legacy method)',
    schema: getTaskSchema.extend({
      task_id: z.string().describe('ID of the task to get comments for')
    })
  },
  {
    name: 'echo',
    description: 'Echo a message back',
    schema: echoSchema
  }
];
