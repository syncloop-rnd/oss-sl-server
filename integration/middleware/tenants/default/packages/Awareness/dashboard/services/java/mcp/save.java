package packages.Awareness.dashboard.services.java.mcp;
import agents.core.tools.model.MCP;
import agents.core.tools.model.ToolsRegistryAuthType;
import agents.core.tools.service.MCPService;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.service.ServiceUtils;
import org.apache.commons.lang3.StringUtils;
import agents.core.tools.service.ToolsRegistryService;
import com.eka.middleware.flow.KeywordResolver;

import java.util.UUID;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
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
public final class save{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
            MCP mcp = new MCP();
  			
  			boolean saveWithoutTools = dataPipeline.getAsBoolean("saveWithoutTools");
  			List<String> allowedToolsList = (List<String>)dataPipeline.get("allowedTools");
  			Set<String> allowedTools = allowedToolsList.stream().collect(Collectors.toSet());

            String idText = dataPipeline.getString("id");
            if (StringUtils.isNotBlank(idText)) {
                mcp.setId(UUID.fromString(StringUtils.trim(idText)));
            }

            mcp.setMcpEndpoint(resolveMcpEndpoint(dataPipeline.getString("mcpEndpoint"), dataPipeline));
            mcp.setMcpName(dataPipeline.getString("mcpName"));
  			mcp.setAuthInfo(dataPipeline.getString("authInfo"));
  			mcp.setDescription(dataPipeline.getString("description"));
            mcp.setAuthType(parseAuthType(dataPipeline.getString("authType")));

            MCPService service = MCPService.getInstance();
            mcp = service.create(mcp);

  			dataPipeline.put("mcpId", mcp.getId());
            dataPipeline.put("status", "success");
  
  			try {
              	if (!saveWithoutTools) {
                	ToolsRegistryService.getInstance().importToolsFromMcp(mcp.getId(), allowedTools);  
                }
            	
            } catch (Exception e) {
                e.printStackTrace();
                dataPipeline.clear();
                dataPipeline.put("error",e.getMessage());
                dataPipeline.put("status","failed");
                new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
              
            }
   ServiceUtils.expireServiceCache("packages.Awareness.dashboard.services.api.exportAll");
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
  
  		if (StringUtils.equals(value, "{}")) {
            return ToolsRegistryAuthType.NONE;
        }
  
        String normalized = StringUtils.upperCase(StringUtils.replace(StringUtils.trim(value), " ", "_"));
        return ToolsRegistryAuthType.valueOf(normalized);
    }

private static String resolveMcpEndpoint(String value, DataPipeline dataPipeline) {
    if (StringUtils.isBlank(value)) {
        return value;
    }

    String endpoint = KeywordResolver.find("*pub.middleware.host.name", dataPipeline);
    final String tenantName = dataPipeline.rp.getTenant().getName();

    return StringUtils.replaceEach(
        value,
        new String[] { "#{endpoint}", "#{tenantName}" },
        new String[] {
            StringUtils.defaultString(endpoint),
            StringUtils.defaultString(tenantName)
        }
    );
}

}