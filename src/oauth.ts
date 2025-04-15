import axios, { AxiosResponse } from 'axios';
import { Request, Response, Application, RequestHandler } from 'express';
import { AuthorizationCode, ClientCredentials, ResourceOwnerPassword } from 'simple-oauth2';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  host: string;
}

/**
 * 認証タイプの列挙型
 */
export enum AuthType {
  PERMANENT_TOKEN = 'permanent_token',
  OAUTH = 'oauth'
}

/**
 * OAuth 2.0 helper functions for Wrike API authentication
 */
export class WrikeOAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private authUrl: string;
  private tokenUrl: string;
  private oauth2Client: AuthorizationCode;

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.authUrl = 'https://login.wrike.com/oauth2/authorize/v4';
    this.tokenUrl = 'https://login.wrike.com/oauth2/token';

    // simple-oauth2クライアントの初期化
    this.oauth2Client = new AuthorizationCode({
      client: {
        id: clientId,
        secret: clientSecret,
      },
      auth: {
        tokenHost: 'https://login.wrike.com',
        tokenPath: '/oauth2/token',
        authorizePath: '/oauth2/authorize/v4',
      }
    });
  }

  /**
   * Generate the authorization URL for the OAuth 2.0 flow
   * @param {string} state Optional state parameter for CSRF protection
   * @param {string} scope Optional comma-separated list of scopes
   * @returns {string} The authorization URL
   */
  getAuthorizationUrl(state: string = '', scope: string = ''): string {
    const options: any = {
      redirect_uri: this.redirectUri,
      response_type: 'code',
    };

    if (state) {
      options.state = state;
    }

    if (scope) {
      options.scope = scope;
    }

    return this.oauth2Client.authorizeURL(options);
  }

  /**
   * Exchange an authorization code for an access token using simple-oauth2
   * @param {string} code The authorization code received from Wrike
   * @returns {Promise<TokenResponse>} The token response containing access_token, refresh_token, etc.
   */
  async getAccessToken(code: string): Promise<TokenResponse> {
    try {
      const tokenParams = {
        code,
        redirect_uri: this.redirectUri,
      };

      const result = await this.oauth2Client.getToken(tokenParams);
      const tokenData = result.token as any;

      return {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        host: tokenData.host
      };
    } catch (error) {
      console.error('Error getting access token:', (error as any).response?.data || (error as Error).message);
      throw error;
    }
  }

  /**
   * 従来のaxiosを使用したアクセストークン取得メソッド
   * @param {string} code The authorization code received from Wrike
   * @returns {Promise<TokenResponse>} The token response containing access_token, refresh_token, etc.
   */
  async getAccessTokenWithAxios(code: string): Promise<TokenResponse> {
    try {
      const response = await axios.post<TokenResponse>(this.tokenUrl, null, {
        params: {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting access token:', (error as any).response?.data || (error as Error).message);
      throw error;
    }
  }

  /**
   * Refresh an expired access token using simple-oauth2
   * @param {string} refreshToken The refresh token
   * @param {string} scope Optional comma-separated list of scopes
   * @returns {Promise<TokenResponse>} The token response containing new access_token, refresh_token, etc.
   */
  async refreshAccessToken(refreshToken: string, scope: string = ''): Promise<TokenResponse> {
    try {
      // 既存のトークンからAccessTokenインスタンスを作成
      const existingToken = {
        refresh_token: refreshToken,
      };

      const accessToken = this.oauth2Client.createToken(existingToken);

      const tokenParams: any = {};
      if (scope) {
        tokenParams.scope = scope;
      }

      const result = await accessToken.refresh(tokenParams);
      const tokenData = result.token as any;

      return {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        host: tokenData.host
      };
    } catch (error) {
      console.error('Error refreshing access token:', (error as any).response?.data || (error as Error).message);
      throw error;
    }
  }

  /**
   * 永続トークンを使用した認証
   * @param {string} permanentToken 永続トークン
   * @returns {Promise<{ access_token: string, host: string }>} アクセストークンとホスト情報
   */
  async authenticateWithPermanentToken(permanentToken: string): Promise<{ access_token: string, host: string }> {
    // 永続トークンはそのままアクセストークンとして使用できます
    return {
      access_token: permanentToken,
      host: 'www.wrike.com' // デフォルトのホスト
    };
  }
}

// Extended Express Request interface to include session
interface RequestWithSession extends Request {
  session: any; // Using any to avoid type conflicts with express-sessionany; // Using any to avoid type conflicts with express-session
  query: {
    code?: string;
    state?: string;
    [key: string]: string | string[] | undefined;
  };
}

/**
 * Example of how to set up OAuth routes in an Express server
 * This is not used directly in the MCP server but provided as a reference
 * for implementing OAuth in a separate web server if needed.
 */
export const setupOAuthRoutes = (app: Application, oauth: WrikeOAuth): void => {
  // Redirect to Wrike authorization page
  const authorizeHandler: RequestHandler = (req, res) => {
    const request = req as RequestWithSession;
    const state = Math.random().toString(36).substring(2, 15);
    // Store state in session for CSRF protection
    request.session.oauthState = state;
    request.session.authType = AuthType.OAUTH;

    const authUrl = oauth.getAuthorizationUrl(state);
    res.redirect(authUrl);
  };

  app.get('/oauth/authorize', authorizeHandler);

  // Handle OAuth callback
  const callbackHandler: RequestHandler = (req, res) => {
    const request = req as RequestWithSession;
    const { code, state } = request.query;

    // Verify state for CSRF protection
    if (!code || !state || state !== request.session.oauthState) {
      return res.status(403).send('Invalid state parameter or missing code');
    }

    oauth.getAccessToken(code as string)
      .then(tokenData => {
        // Store token data securely
        // This is just an example - in a real app, store tokens securely
        request.session.accessToken = tokenData.access_token;
        request.session.refreshToken = tokenData.refresh_token;
        request.session.host = tokenData.host;

        res.redirect('/');
      })
      .catch(error => {
        res.status(500).send(`Authentication failed: ${(error as Error).message}`);
      });
  };

  app.get('/oauth/callback', callbackHandler);

  // 永続トークンを使用した認証ルート
  const permanentTokenHandler: RequestHandler = async (req, res) => {
    const request = req as RequestWithSession;
    const permanentToken = req.body.permanentToken;

    if (!permanentToken) {
      return res.status(400).send('Permanent token is required');
    }

    try {
      const tokenData = await oauth.authenticateWithPermanentToken(permanentToken);

      // セッションに認証情報を保存
      request.session.accessToken = tokenData.access_token;
      request.session.host = tokenData.host;
      request.session.authType = AuthType.PERMANENT_TOKEN;

      res.redirect('/');
    } catch (error) {
      res.status(500).send(`Authentication failed: ${(error as Error).message}`);
    }
  };

  app.post('/oauth/permanent-token', permanentTokenHandler);

  // トークンリフレッシュルート
  const refreshTokenHandler: RequestHandler = async (req, res) => {
    const request = req as RequestWithSession;

    if (!request.session.refreshToken) {
      return res.status(400).send('No refresh token available');
    }

    try {
      const tokenData = await oauth.refreshAccessToken(request.session.refreshToken);

      // セッションに新しい認証情報を保存
      request.session.accessToken = tokenData.access_token;
      request.session.refreshToken = tokenData.refresh_token;

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  };

  app.post('/oauth/refresh', refreshTokenHandler);
};
