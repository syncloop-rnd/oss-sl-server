

// Defaults
 const defaultEnv = {
 
  API_BASE_URL: 'http://localhost:8080',
  APP_BASE_URL: 'http://localhost:3000',
  CDN_API_BASE_URL: 'http://localhost:3000',
  WS_BASE_URL: 'ws://localhost:8080',
  TENANT_ID: '',
  DEBUG_MCP_OAUTH: true,
}

// Build window.env using individual localStorage keys
window.env = {
    API_BASE_URL: localStorage.getItem("API_BASE_URL") || defaultEnv.API_BASE_URL,
    CDN_API_BASE_URL: localStorage.getItem("CDN_API_BASE_URL") || defaultEnv.CDN_API_BASE_URL,
    WS_BASE_URL: localStorage.getItem("WS_BASE_URL") || defaultEnv.WS_BASE_URL,
    APP_BASE_URL: localStorage.getItem("APP_BASE_URL") || defaultEnv.APP_BASE_URL,
    TENANT_ID: localStorage.getItem("TENANT_ID") || defaultEnv.TENANT_ID,
    DEBUG_MCP_OAUTH: localStorage.getItem("DEBUG_MCP_OAUTH") || defaultEnv.DEBUG_MCP_OAUTH,
};

