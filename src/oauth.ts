import axios, { AxiosResponse } from 'axios';
import { Request, Response, Application, RequestHandler } from 'express';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  host: string;
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

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.authUrl = 'https://login.wrike.com/oauth2/authorize/v4';
    this.tokenUrl = 'https://login.wrike.com/oauth2/token';
  }

  /**
   * Generate the authorization URL for the OAuth 2.0 flow
   * @param {string} state Optional state parameter for CSRF protection
   * @param {string} scope Optional comma-separated list of scopes
   * @returns {string} The authorization URL
   */
  getAuthorizationUrl(state: string = '', scope: string = ''): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri
    });

    if (state) {
      params.append('state', state);
    }

    if (scope) {
      params.append('scope', scope);
    }

    return `${this.authUrl}?${params.toString()}`;
  }

  /**
   * Exchange an authorization code for an access token
   * @param {string} code The authorization code received from Wrike
   * @returns {Promise<TokenResponse>} The token response containing access_token, refresh_token, etc.
   */
  async getAccessToken(code: string): Promise<TokenResponse> {
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
   * Refresh an expired access token
   * @param {string} refreshToken The refresh token
   * @param {string} scope Optional comma-separated list of scopes
   * @returns {Promise<TokenResponse>} The token response containing new access_token, refresh_token, etc.
   */
  async refreshAccessToken(refreshToken: string, scope: string = ''): Promise<TokenResponse> {
    try {
      const params: Record<string, string> = {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      };

      if (scope) {
        params.scope = scope;
      }

      const response = await axios.post<TokenResponse>(this.tokenUrl, null, { params });
      return response.data;
    } catch (error) {
      console.error('Error refreshing access token:', (error as any).response?.data || (error as Error).message);
      throw error;
    }
  }
}

// Extended Express Request interface to include session
interface RequestWithSession extends Request {
  session: {
    oauthState?: string;
    accessToken?: string;
    refreshToken?: string;
    host?: string;
  };
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
};
