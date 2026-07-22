package packages.Awareness.dashboard.services.java.mcp;
import agents.core.tools.model.MCP;
import agents.core.tools.model.ToolsRegistryAuthType;
import agents.core.tools.service.MCPService;
import com.eka.middleware.service.DataPipeline;
import org.apache.commons.lang3.StringUtils;

import agents.core.tools.model.ToolsRegistry;
import agents.core.tools.model.ToolsRegistryAgentAccess;
import agents.core.tools.model.ToolsRegistrySource;
import agents.core.tools.service.ToolsRegistryService;
import com.eka.middleware.template.SnippetException;

import java.util.UUID;
public final class listMCPTools{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    MCP mcp = new MCP();

    mcp.setMcpEndpoint(dataPipeline.getString("mcpEndpoint"));
    mcp.setMcpName(dataPipeline.getString("mcpName"));
    mcp.setAuthInfo(dataPipeline.getString("authInfo"));
    mcp.setAuthType(parseAuthType(dataPipeline.getString("authType")));

     ToolsRegistryService toolsRegistryService = ToolsRegistryService.getInstance();
      Object Tool = toolsRegistryService.listMcpTools(mcp);
    
  if (Tool != null) {
        dataPipeline.put("tools", Tool);
    } 
  else {
        dataPipeline.put("tools", new java.util.ArrayList<>());
    }
  
    dataPipeline.put("status", "success");
  
} catch (Exception e) {
    e.printStackTrace();
    dataPipeline.clear();
    dataPipeline.put("error", e.getMessage());
    dataPipeline.put("status", "failed");
    new SnippetException(dataPipeline, "Snippet exception", new Exception(e));
}
	}
private static ToolsRegistryAuthType parseAuthType(String value) {
        if (StringUtils.isBlank(value)) {
            return null;
        }
        String normalized = StringUtils.upperCase(StringUtils.replace(StringUtils.trim(value), " ", "_"));
        return ToolsRegistryAuthType.valueOf(normalized);
    }
}