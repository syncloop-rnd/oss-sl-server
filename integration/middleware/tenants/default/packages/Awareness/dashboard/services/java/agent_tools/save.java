package packages.Awareness.dashboard.services.java.agent_tools;
import agents.core.tools.model.AgentTools;
import agents.core.tools.service.AgentToolsService;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringUtils;

import java.util.UUID;
public final class save{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
 try {
            AgentTools tool = new AgentTools();

            String uuidText = dataPipeline.getString("uuid");
            if (StringUtils.isNotBlank(uuidText)) {
                tool.setUuid(UUID.fromString(StringUtils.trim(uuidText)));
            }

            String toolIdText = dataPipeline.getString("toolId");
            if (StringUtils.isNotBlank(toolIdText)) {
                tool.setToolId(UUID.fromString(StringUtils.trim(toolIdText)));
            }

            String agentIdText = dataPipeline.getString("agentId");
            if (StringUtils.isNotBlank(agentIdText)) {
                tool.setAgentId(UUID.fromString(StringUtils.trim(agentIdText)));
            }

            tool.setAgentSchema(dataPipeline.getString("agentSchema"));
            tool.setStaticPayload(dataPipeline.getString("staticPayload"));
            tool.setAuthInfo(dataPipeline.getString("authInfo"));
            tool.setDescription(dataPipeline.getString("description"));
            tool.setStatus(dataPipeline.getString("status"));
            tool.setActive(Boolean.parseBoolean(dataPipeline.getString("active")));

            AgentToolsService service = AgentToolsService.getInstance();
            AgentTools created = service.create(tool);

            dataPipeline.put("uuid", created.getUuid().toString());
            dataPipeline.put("status", "success");
   //ServiceUtils.expireServiceCache("packages.Awareness.dashboard.services.api.exportAll");
        } catch (Exception e) {
            e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
            dataPipeline.put("status", "failed");
            new SnippetException(dataPipeline, "Snippet exception", new Exception(e));
        }
	}

}