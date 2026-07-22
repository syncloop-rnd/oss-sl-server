package packages.Awareness.dashboard.services.java.agent_tools;
import agents.core.tools.model.AgentTools;
import agents.core.tools.service.AgentToolsService;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringUtils;
import com.eka.middleware.service.ServiceUtils;

import java.util.UUID;
public final class delete{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
 try {
            String uuidText = dataPipeline.getString("uuid");
            if (StringUtils.isBlank(uuidText)) {
                throw new IllegalArgumentException("uuid is required");
            }

            UUID uuid = UUID.fromString(StringUtils.trim(uuidText));
            AgentToolsService service = AgentToolsService.getInstance();
            AgentTools tool = service.get(uuid);

            if (tool == null) {
                throw new IllegalArgumentException("AgentTools not found for uuid: " + uuid);
            }

            service.delete(uuid);
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