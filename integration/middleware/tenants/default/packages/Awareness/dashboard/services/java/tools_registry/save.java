package packages.Awareness.dashboard.services.java.tools_registry;
import agents.core.tools.model.ToolsRegistry;
import agents.core.tools.model.ToolsRegistryAgentAccess;
import agents.core.tools.model.ToolsRegistryAuthType;
import agents.core.tools.model.ToolsRegistrySource;
import agents.core.tools.service.ToolsRegistryService;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringUtils;
import com.eka.middleware.service.ServiceUtils;

import java.util.UUID;
public final class save{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{

            ToolsRegistry tool = new ToolsRegistry();

            String uuidText = dataPipeline.getString("uuid");
            if (StringUtils.isNotBlank(uuidText)) {
                tool.setUuid(UUID.fromString(uuidText));
            }

            tool.setName(dataPipeline.getString("name"));
            tool.setDescription(dataPipeline.getString("description"));
            tool.setSource(parseSource(dataPipeline.getString("source")));
            tool.setFqn(dataPipeline.getString("fqn"));
            tool.setSchema(dataPipeline.getString("schema"));
            tool.setStaticPayload(dataPipeline.getString("staticPayload"));
           
            tool.setAgentAccess(parseAgentAccess(dataPipeline.getString("agentAccess")));
            tool.setStatus(dataPipeline.getString("status"));

            String mcpIdText = dataPipeline.getString("mcpId");
            if (StringUtils.isNotBlank(mcpIdText)) {
                tool.setMcpId(UUID.fromString(mcpIdText));
            }

            tool.setActive(Boolean.parseBoolean(dataPipeline.getString("active")));

            ToolsRegistryService toolsRegistryService = ToolsRegistryService.getInstance();
            tool = toolsRegistryService.create(tool);
			ServiceUtils.expireServiceCache("packages.Awareness.dashboard.services.api.exportAll");
  			dataPipeline.put("uuid", tool.getUuid().toString());
            dataPipeline.put("status","success");
        }catch(Exception e){
            e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
            dataPipeline.put("status","failed");
            new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
        }
	}
private static ToolsRegistrySource parseSource(String value) {
        if (StringUtils.isBlank(value)) {
            return null;
        }
        return ToolsRegistrySource.valueOf(StringUtils.upperCase(StringUtils.trim(value)));
    }

    private static ToolsRegistryAuthType parseAuthType(String value) {
        if (StringUtils.isBlank(value)) {
            return null;
        }
        String normalized = StringUtils.upperCase(StringUtils.replace(StringUtils.trim(value), " ", "_"));
        return ToolsRegistryAuthType.valueOf(normalized);
    }

    private static ToolsRegistryAgentAccess parseAgentAccess(String value) {
        if (StringUtils.isBlank(value)) {
            return null;
        }
        String normalized = StringUtils.upperCase(StringUtils.replace(StringUtils.trim(value), " ", "_"));
        return ToolsRegistryAgentAccess.valueOf(normalized);
    }
}