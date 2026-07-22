package packages.Awareness.dashboard.services.java.tools_registry;
import agents.core.tools.model.ToolsRegistry;
import agents.core.tools.service.ToolsRegistryService;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringUtils;
import com.eka.middleware.service.ServiceUtils;

import java.util.UUID;
import java.util.Set;
public final class delete{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
            String uuidText = dataPipeline.getString("uuid");
            if (StringUtils.isBlank(uuidText)) {
                throw new IllegalArgumentException("uuid is required");
            }
  
  			boolean deleteTools = dataPipeline.getAsBoolean("deleteTools");

            UUID uuid = UUID.fromString(StringUtils.trim(uuidText));
            ToolsRegistryService toolsRegistryService = ToolsRegistryService.getInstance();
            ToolsRegistry tool = toolsRegistryService.get(uuid);

            if (tool == null) {
                throw new IllegalArgumentException("ToolsRegistry not found for uuid: " + uuid);
            }

            Set<String> deletedTools = toolsRegistryService.delete(uuid, deleteTools);
  			dataPipeline.put("deletedTools", deletedTools);
            dataPipeline.put("deletedUuid", uuid.toString());
            dataPipeline.put("status", "success");
   ServiceUtils.expireServiceCache("packages.Awareness.dashboard.services.api.exportAll");
        } catch (Exception e) {
            e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
            dataPipeline.put("status", "failed");
            new SnippetException(dataPipeline, "Snippet exception", new Exception(e));
        }
	}

}