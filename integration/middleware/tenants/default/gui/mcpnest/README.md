# MCP Nest GUI

Static AngularJS single-page application for `MCPNest-swagger.json`.

Run from the repository root with any static server, for example:

```powershell
npx serve gui
```

Login stores the server host, port, protocol, and tenant in `localStorage`. The bearer token is stored only in `sessionStorage`; logout clears the token and keeps the last server values.
