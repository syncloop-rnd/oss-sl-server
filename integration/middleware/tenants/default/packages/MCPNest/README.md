# MCPNest

Syncloop package exposing `agents.core.tools.api.MCPGateway` through Java services, REST wrapper APIs, and MCP tool wrapper APIs.

## Public Endpoints

REST APIs are exposed only from:

```text
packages/MCPNest/wrapper/api
```

MCP tools are exposed only from:

```text
packages/MCPNest/wrapper/mcp
```

The package MCP endpoint is:

```text
<http|https>://<host>:<port>/tenant/<tenantId>/MCPNest/mcp
```

Example:

```text
https://dev-new-api.syncloop.com/tenant/1782168784544462123/MCPNest/mcp
```

## REST Wrapper APIs

These APIs are intended for REST/swagger exposure:

```text
packages/MCPNest/wrapper/api/addMcpEndpoint
packages/MCPNest/wrapper/api/enableDisableMcpEndpoint
packages/MCPNest/wrapper/api/enableDisableTool
packages/MCPNest/wrapper/api/createToolCollection
packages/MCPNest/wrapper/api/listCollections
packages/MCPNest/wrapper/api/addToolToCollection
packages/MCPNest/wrapper/api/removeToolFromCollection
packages/MCPNest/wrapper/api/listMcps
packages/MCPNest/wrapper/api/listToolsByMcpId
packages/MCPNest/wrapper/api/listToolsByCollectionId
packages/MCPNest/wrapper/api/getToolUsageDetails
packages/MCPNest/wrapper/api/callTool
```

## MCP Tool APIs

These APIs are intended for MCP tool exposure:

```text
packages/MCPNest/wrapper/mcp/tools/list_enabled_tools
packages/MCPNest/wrapper/mcp/tools/tool_details
packages/MCPNest/wrapper/mcp/tools/execute_tool
```

## Implementation Services

Java services under `services/java` are implementation details. Wrapper APIs invoke these services, but they are not the public REST or MCP exposure surface:

```text
packages/MCPNest/services/java/addMcpEndpoint
packages/MCPNest/services/java/enableDisableMcpEndpoint
packages/MCPNest/services/java/enableDisableTool
packages/MCPNest/services/java/createToolCollection
packages/MCPNest/services/java/listCollections
packages/MCPNest/services/java/addToolToCollection
packages/MCPNest/services/java/removeToolFromCollection
packages/MCPNest/services/java/listMcps
packages/MCPNest/services/java/listToolsByMcpId
packages/MCPNest/services/java/listToolsByCollectionId
packages/MCPNest/services/java/getToolUsageDetails
packages/MCPNest/services/java/callTool
```

## JSON Map Contracts

- Map inputs are declared as Syncloop `document`, representing `Map<String,Object>`.
- List-of-map outputs are declared as `documentList`, representing `List<Map<String,Object>>`.
- Primitive inputs/outputs use `string`, `boolean`, `integer`, or `stringList`.
- Known `document` and `documentList` payloads are expanded with child fields in both API and Java service schemas so the designer shows XPath-style fields such as `*payload/request/mcpAlias` and `result/toolId`.
- Every service returns `status`, `result`, and `error`.
