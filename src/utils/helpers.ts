import { WrikeClient } from '../wrikeClient.js';
import { WrikeRequestParams, WrikeTimelogData } from '../types/wrike.js';

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

/**
 * Create a Wrike client instance
 * @returns A new WrikeClient instance
 */
export const createWrikeClient = (): WrikeClient => {
  const accessToken = process.env.WRIKE_ACCESS_TOKEN as string;
  const host = process.env.WRIKE_HOST || 'www.wrike.com';
  return new WrikeClient(accessToken, host);
};

/**
 * Create a timelog data object from parameters
 * @param hours Number of hours
 * @param tracked_date Date when the time was spent
 * @param comment Comment for the timelog
 * @param category_id ID of the timelog category
 * @returns WrikeTimelogData object
 */
export const createTimelogData = (
  hours?: number,
  tracked_date?: string,
  comment?: string,
  category_id?: string
): WrikeTimelogData => {
  const data: WrikeTimelogData = {
    hours,
    trackedDate: tracked_date,
    comment,
    categoryId: category_id
  };

  // Remove undefined values
  removeUndefinedValues(data);

  return data;
};
