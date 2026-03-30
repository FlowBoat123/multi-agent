interface InputSchema {
  [k: string]: unknown;

  properties?: unknown | null;
  type: 'object';
}

export interface McpTool {
  description: string;
  inputSchema: InputSchema;
  name: string;
}

export interface McpResource {
  description?: string;
  mimeType?: string;
  name: string;
  uri: string;
}

export interface McpPromptArgument {
  description?: string;
  name: string;
  required?: boolean;
}

export interface McpPrompt {
  arguments?: McpPromptArgument[];
  description?: string;
  name: string;
}

/**
 * MCP authentication config interface
 * Supports stage 1 manual config and future OAuth 2.1 automation
 */
export interface AuthConfig {
  // C. [User Token] obtained after user authorization
  accessToken?: string;

  // User manually pasted Bearer Token
  // --- Stage 2 & 3: OAuth 2.1 automation ---
  // A. [Client Credentials] from static config or dynamic registration
  clientId?: string;

  clientSecret?: string;
  refreshToken?: string; // If confidential client
  scope?: string; // Scope to request, e.g., "repo user:email"

  // B. [Authorization Server Metadata] from server discovery
  serverMetadata?: {
    authorization_endpoint?: string;
    registration_endpoint?: string;
    token_endpoint?: string;
    // ... and other RFC8414 fields
  };

  // --- Stage 1: Manual config ---
  token?: string;
  tokenExpiresAt?: number;
  // Auth type
  type: 'none' | 'bearer' | 'oauth2'; // Expiry timestamp for accessToken
}

interface HttpMCPClientParams {
  auth?: AuthConfig;
  headers?: Record<string, string>;
  name: string;
  type: 'http';
  url: string;
}

export interface StdioMCPParams {
  args: string[];
  command: string;
  env?: Record<string, string>;
  name: string;
  type: 'stdio';
}

export type MCPClientParams = HttpMCPClientParams | StdioMCPParams;

export type MCPErrorType =
  | 'CONNECTION_FAILED'
  | 'PROCESS_SPAWN_ERROR'
  | 'INITIALIZATION_TIMEOUT'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR'
  | 'AUTHORIZATION_ERROR';
export interface MCPErrorData {
  message: string;
  /**
   * Structured error metadata
   */
  metadata?: {
    errorLog?: string;

    /**
     * Original error message
     */
    originalError?: string;
    /**
     * MCP connection params
     */
    params?: {
      args?: string[];
      command?: string;
      type?: string;
    };

    /**
     * Process-related info
     */
    process?: {
      exitCode?: number;
      signal?: string;
    };

    /**
     * Step where error occurred
     */
    step?: string;

    /**
     * Timestamp
     */
    timestamp?: number;
  };

  /**
   * Error type
   */
  type: MCPErrorType;
}

/**
 * Structured MCP error info
 */
export interface MCPError extends Error {
  data: MCPErrorData;
}

/**
 * Create structured MCP error
 */
export function createMCPError(
  type: MCPErrorData['type'],
  message: string,
  metadata?: MCPErrorData['metadata'],
): MCPError {
  const error = new Error(message) as MCPError;

  error.data = {
    message,
    metadata: {
      timestamp: Date.now(),
      ...metadata,
    },
    type,
  };

  return error;
}
