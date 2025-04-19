import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerWrikeListSpacesTool } from './wrike_list_spaces.js';
import { registerWrikeCreateFolderTool } from './wrike_create_folder.js';
import { registerWrikeGetTimelogsTool } from './wrike_get_timelogs.js';
import { registerWrikeGetFolderProjectTool } from './wrike_get_folder_project.js';
import { registerWrikeGetTaskTool } from './wrike_get_task.js';
import { registerWrikeCreateTaskTool } from './wrike_create_task.js';
import { registerWrikeUpdateTaskTool } from './wrike_update_task.js';
import { registerWrikeGetCommentsTool } from './wrike_get_comments.js';
import { registerWrikeCreateCommentTool } from './wrike_create_comment.js';
import { registerWrikeGetContactsTool } from './wrike_get_contacts.js';
import { registerWrikeGetTaskCommentsTool } from './wrike_get_task_comments.js';
import { registerWrikeCreateTimelogTool } from './wrike_create_timelog.js';
import { registerWrikeUpdateTimelogTool } from './wrike_update_timelog.js';
import { registerWrikeDeleteTimelogTool } from './wrike_delete_timelog.js';
import { registerWrikeGetTimelogCategoriesTool } from './wrike_get_timelog_categories.js';

/**
 * Register all Wrike-related tools to the MCP server
 * @param server McpServer instance
 */
export function registerAllWrikeTools(server: McpServer): void {
  // Register individual tools
  registerWrikeListSpacesTool(server);
  registerWrikeCreateFolderTool(server);
  registerWrikeGetTimelogsTool(server);
  registerWrikeGetFolderProjectTool(server);
  registerWrikeGetTaskTool(server);
  registerWrikeCreateTaskTool(server);
  registerWrikeUpdateTaskTool(server);
  registerWrikeGetCommentsTool(server);
  registerWrikeCreateCommentTool(server);
  registerWrikeGetContactsTool(server);
  registerWrikeGetTaskCommentsTool(server);
  registerWrikeCreateTimelogTool(server);
  registerWrikeUpdateTimelogTool(server);
  registerWrikeDeleteTimelogTool(server);
  registerWrikeGetTimelogCategoriesTool(server);
}

// Export individual tool modules
export * from './wrike_list_spaces.js';
export * from './wrike_create_folder.js';
export * from './wrike_get_timelogs.js';
export * from './wrike_get_folder_project.js';
export * from './wrike_get_task.js';
export * from './wrike_create_task.js';
export * from './wrike_update_task.js';
export * from './wrike_get_comments.js';
export * from './wrike_create_comment.js';
export * from './wrike_get_contacts.js';
export * from './wrike_get_task_comments.js';
export * from './wrike_create_timelog.js';
export * from './wrike_update_timelog.js';
export * from './wrike_delete_timelog.js';
export * from './wrike_get_timelog_categories.js';
export * from './client.js';
