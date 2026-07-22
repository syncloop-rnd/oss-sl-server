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
public final class updateStaticPayloadByUuid{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
//String uuidText = dataPipeline.getString("uuid");
//String staticPayload = dataPipeline.getString("staticPayload");
//ToolsRegistryService toolsRegistryService = new ToolsRegistryService(dataPipeline);
//toolsRegistryService.updateStaticPayload(UUID.fromString(uuidText) ,staticPayload);

try {
    String uuidText = dataPipeline.getString("uuid");
    String staticPayload = dataPipeline.getString("staticPayload");

    UUID uuid = null;
    if (StringUtils.isNotBlank(uuidText)) {
        uuid = UUID.fromString(uuidText);
    }
  
    ToolsRegistryService toolsRegistryService = ToolsRegistryService.getInstance();
    toolsRegistryService.updateStaticPayload(uuid, staticPayload);
    dataPipeline.put("status", "success");
  ServiceUtils.expireServiceCache("packages.Awareness.dashboard.services.api.exportAll");
} 
catch (Exception e) {
    e.printStackTrace();
    dataPipeline.clear();
    dataPipeline.put("error", e.getMessage());
    dataPipeline.put("status", "failed");
    new SnippetException(dataPipeline, "Snippet exception", new Exception(e));
}
	}

}