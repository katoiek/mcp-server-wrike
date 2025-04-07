import { WrikeClient } from '../wrikeClient.js';
import { WrikeRequestParams } from '../types/wrike.js';

/**
 * Parse optional fields from a comma-separated string
 */
export const parseOptFields = (optFields?: string): WrikeRequestParams => {
  if (!optFields) return {};

  const fields = optFields.split(',').map(field => field.trim());
  return { fields: fields.join(',') };
};

/**
 * Convert task ID to API v4 format
 */
export const convertTaskId = async (wrikeClient: WrikeClient, taskId: string): Promise<string> => {
  let apiTaskId = taskId;

  if (taskId.includes('open.htm?id=') || /^\d+$/.test(taskId)) {
    try {
      console.error(JSON.stringify({
        message: "Converting permalink ID",
        task_id: taskId
      }));

      apiTaskId = await wrikeClient.convertPermalinkId(taskId, 'task');

      console.error(JSON.stringify({
        message: "Converted to API v4 ID",
        api_task_id: apiTaskId
      }));
    } catch (error) {
      console.error(JSON.stringify({
        message: "Error converting permalink ID",
        error: (error as Error).message
      }));

      throw new Error(`Failed to convert permalink ID: ${(error as Error).message}`);
    }
  }

  return apiTaskId;
};

/**
 * Remove undefined values from an object
 * This is a utility function to clean up objects before sending to API
 * @param obj The object to clean
 */
export const removeUndefinedValues = <T extends Record<string, any>>(obj: T): void => {
  Object.keys(obj).forEach(key => {
    if (obj[key] === undefined) {
      delete obj[key];
    }
  });
};
