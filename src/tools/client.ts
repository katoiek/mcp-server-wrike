import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { logger } from '../utils/logger.js';

/**
 * Wrikeクライアントの基本機能を提供するクラス
 * ModelContextProtocolのTypeScript SDKに準拠
 */
export class WrikeClientBase {
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
}

/**
 * Wrikeクライアントのインスタンスを作成する関数
 * 環境変数からアクセストークンとホストを取得
 */
export function createWrikeClient(): WrikeClientBase {
  const accessToken = process.env.WRIKE_ACCESS_TOKEN as string;
  const host = process.env.WRIKE_HOST || 'www.wrike.com';

  if (!accessToken) {
    throw new Error('WRIKE_ACCESS_TOKEN environment variable is required');
  }

  return new WrikeClientBase(accessToken, host);
}

/**
 * リクエストパラメータからopt_fieldsを解析する関数
 */
export function parseOptFields(opt_fields?: string): Record<string, any> {
  const params: Record<string, any> = {};

  if (opt_fields) {
    params.fields = opt_fields.split(',').map(field => field.trim());
  }

  return params;
}
