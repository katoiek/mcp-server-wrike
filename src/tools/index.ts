import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// 参照系（list & get）
import { registerWrikeListSpacesTool } from './wrike_list_spaces.js';
import { registerWrikeGetFolderProjectTool } from './wrike_get_folder_project.js';
import { registerWrikeGetTaskTool } from './wrike_get_task.js';
import { registerWrikeGetCommentsTool } from './wrike_get_comments.js';
import { registerWrikeGetTaskCommentsTool } from './wrike_get_task_comments.js';
import { registerWrikeGetContactsTool } from './wrike_get_contacts.js';
import { registerWrikeGetTimelogsTool } from './wrike_get_timelogs.js';
import { registerWrikeGetTimelogCategoriesTool } from './wrike_get_timelog_categories.js';
import { registerWrikeGetCustomItemTypesTool } from './wrike_get_custom_item_types.js';
// 更新系（create, update, delete）
import { registerWrikeCreateFolderProjectTool } from './wrike_create_folder_project.js';
import { registerWrikeCreateTaskTool } from './wrike_create_task.js';
import { registerWrikeUpdateTaskTool } from './wrike_update_task.js';
import { registerWrikeCreateCommentTool } from './wrike_create_comment.js';
import { registerWrikeCreateTimelogTool } from './wrike_create_timelog.js';
import { registerWrikeUpdateTimelogTool } from './wrike_update_timelog.js';
import { registerWrikeDeleteTimelogTool } from './wrike_delete_timelog.js';
import { registerWrikeCreateWorkFromCustomItemTool } from './wrike_create_work_from_custom_item.js';

/**
 * Register all Wrike-related tools to the MCP server
 * @param server McpServer instance
 */
export function registerAllWrikeTools(server: McpServer): void {
  // 参照系（list & get）ツールの登録
  registerWrikeListSpacesTool(server);
  registerWrikeGetFolderProjectTool(server);
  registerWrikeGetTaskTool(server);
  registerWrikeGetCommentsTool(server);
  registerWrikeGetTaskCommentsTool(server);
  registerWrikeGetContactsTool(server);
  registerWrikeGetTimelogsTool(server);
  registerWrikeGetTimelogCategoriesTool(server);
  registerWrikeGetCustomItemTypesTool(server);

  // 更新系（create, update, delete）ツールの登録
  registerWrikeCreateFolderProjectTool(server);
  registerWrikeCreateTaskTool(server);
  registerWrikeUpdateTaskTool(server);
  registerWrikeCreateCommentTool(server);
  registerWrikeCreateTimelogTool(server);
  registerWrikeUpdateTimelogTool(server);
  registerWrikeDeleteTimelogTool(server);
  registerWrikeCreateWorkFromCustomItemTool(server);
}

// Export individual tool modules
// 参照系（list & get）
export * from './wrike_list_spaces.js';
export * from './wrike_get_folder_project.js';
export * from './wrike_get_task.js';
export * from './wrike_get_comments.js';
export * from './wrike_get_task_comments.js';
export * from './wrike_get_contacts.js';
export * from './wrike_get_timelogs.js';
export * from './wrike_get_timelog_categories.js';
export * from './wrike_get_custom_item_types.js';
// 更新系（create, update, delete）
export * from './wrike_create_folder_project.js';
export * from './wrike_create_task.js';
export * from './wrike_update_task.js';
export * from './wrike_create_comment.js';
export * from './wrike_create_timelog.js';
export * from './wrike_update_timelog.js';
export * from './wrike_delete_timelog.js';
export * from './wrike_create_work_from_custom_item.js';
// その他
export * from './client.js';
