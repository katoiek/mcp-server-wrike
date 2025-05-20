import { z } from 'zod';

// Base schema for common optional fields
const optionalFieldsSchema = z.object({
  opt_fields: z.string().optional().describe('Comma-separated list of optional fields to include')
});

// Tool schemas
export const echoSchema = z.object({
  message: z.string().describe('Message to echo back')
});

export const createFolderSchema = optionalFieldsSchema.extend({
  parent_id: z.string().describe('ID of the parent folder'),
  title: z.string().describe('Title of the folder'),
  description: z.string().optional().describe('Description of the folder'),
  shareds: z.array(z.string()).optional().describe('Array of user IDs to share the folder with')
});

export const searchFoldersProjectsSchema = optionalFieldsSchema.extend({
  space_id: z.string().optional().describe('ID of the space to search in'),
  folder_id: z.string().optional().describe('ID of the parent folder to search in'),
  folder_ids: z.array(z.string()).optional().describe('Specific folder IDs to retrieve (up to 100)'),
  single_folder_id: z.string().optional().describe('ID of a specific folder, project, or space to retrieve'),
  name_pattern: z.string().optional().describe('Pattern to match folder/project names'),
  project_only: z.boolean().optional().default(false).describe('Only return folders that are projects'),
  archived: z.boolean().optional().default(false).describe('Include archived folders/projects'),
  include_history: z.boolean().optional().default(false).describe('Include folder history when using folder_ids')
});

// searchProjectsSchema is now integrated into searchFoldersProjectsSchema

// searchTasksSchema is now integrated into getTaskSchema

export const getTaskSchema = optionalFieldsSchema.extend({
  task_id: z.string().optional().describe('ID of a specific task to retrieve'),
  folder_id: z.string().optional().describe('ID of the folder to search tasks in'),
  title: z.string().optional().describe('Filter by task title'),
  status: z.string().optional().describe('Filter by task status (Active, Completed, Deferred, Cancelled)'),
  importance: z.string().optional().describe('Filter by task importance (High, Normal, Low)'),
  completed: z.boolean().optional().default(false).describe('Filter by completion status'),
  subtasks: z.boolean().optional().default(false).describe('Include subtasks'),
  custom_fields: z.any().optional().describe('Custom fields to filter by')
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

// getFolderProjectSchema is now integrated into searchFoldersProjectsSchema

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

export const createTimelogSchema = z.object({
  task_id: z.string().describe('ID of the task to add the timelog to'),
  hours: z.number().positive().describe('Number of hours to log'),
  tracked_date: z.string().describe('Date when the time was spent (YYYY-MM-DD)'),
  comment: z.string().optional().describe('Comment for the timelog'),
  category_id: z.string().optional().describe('ID of the timelog category')
});

export const updateTimelogSchema = z.object({
  timelog_id: z.string().describe('ID of the timelog to update'),
  hours: z.number().positive().optional().describe('New number of hours'),
  tracked_date: z.string().optional().describe('New date when the time was spent (YYYY-MM-DD)'),
  comment: z.string().optional().describe('New comment for the timelog'),
  category_id: z.string().optional().describe('New ID of the timelog category')
});

export const deleteTimelogSchema = z.object({
  timelog_id: z.string().describe('ID of the timelog to delete')
});

export const getTimelogCategoriesSchema = optionalFieldsSchema.extend({});

export const getCustomFieldsSchema = optionalFieldsSchema.extend({
  customfield_ids: z.array(z.string()).optional().describe('Array of custom field IDs to retrieve (up to 100)')
});

// Tool types
export type EchoInput = z.infer<typeof echoSchema>;
// ListSpacesInput has been removed
export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type SearchFoldersProjectsInput = z.infer<typeof searchFoldersProjectsSchema>;
// SearchTasksInput is now integrated into GetTaskInput
export type GetTaskInput = z.infer<typeof getTaskSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type GetCommentsInput = z.infer<typeof getCommentsSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
// GetFolderProjectInput is now integrated into SearchFoldersProjectsInput
export type GetContactsInput = z.infer<typeof getContactsSchema>;
export type GetTimelogsInput = z.infer<typeof getTimelogsSchema>;
export type CreateTimelogInput = z.infer<typeof createTimelogSchema>;
export type UpdateTimelogInput = z.infer<typeof updateTimelogSchema>;
export type DeleteTimelogInput = z.infer<typeof deleteTimelogSchema>;
export type GetTimelogCategoriesInput = z.infer<typeof getTimelogCategoriesSchema>;
export type GetCustomFieldsInput = z.infer<typeof getCustomFieldsSchema>;

// Tool interface
export interface Tool {
  name: string;
  description: string;
  schema: z.ZodObject<any>;
}

// Tool definitions
export const tools: Tool[] = [
  // wrike_list_spaces tool has been removed
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
    name: 'wrike_get_folder_project',
    description: 'Unified tool for working with Wrike folders, projects, and spaces. Can search for multiple items or get a specific one.',
    schema: searchFoldersProjectsSchema
  },
  // wrike_search_projects and wrike_search_tasks are now integrated into wrike_get_folder_project and wrike_get_task
  {
    name: 'wrike_get_task',
    description: 'Unified tool for working with Wrike tasks. Can get a specific task by ID or search for tasks in a folder.',
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
  // wrike_get_folder_project now includes the functionality of wrike_search_folders_projects
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
    name: 'wrike_create_timelog',
    description: 'Create a new timelog entry for a task in Wrike',
    schema: createTimelogSchema
  },
  {
    name: 'wrike_update_timelog',
    description: 'Update an existing timelog entry in Wrike',
    schema: updateTimelogSchema
  },
  {
    name: 'wrike_delete_timelog',
    description: 'Delete a timelog entry in Wrike',
    schema: deleteTimelogSchema
  },
  {
    name: 'wrike_get_timelog_categories',
    description: 'Get all timelog categories from Wrike',
    schema: getTimelogCategoriesSchema
  },
  {
    name: 'echo',
    description: 'Echo a message back',
    schema: echoSchema
  },
  {
    name: 'wrike_get_customfields',
    description: 'Get custom fields from Wrike',
    schema: getCustomFieldsSchema
  }
];
