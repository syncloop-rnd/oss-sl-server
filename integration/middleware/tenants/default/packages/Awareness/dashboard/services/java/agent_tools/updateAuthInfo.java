package packages.Awareness.dashboard.services.java.agent_tools;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.UUID;
import agents.core.tools.service.AgentToolsService;
public final class updateAuthInfo{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
String uuid = dataPipeline.getString("id");
String authInfo = dataPipeline.getString("authInfo");
Boolean validate = dataPipeline.getAsBoolean("validate");

try {
  
	AgentToolsService agentToolsService = AgentToolsService.getInstance();
	agentToolsService.updateAuthInfo(UUID.fromString(uuid), authInfo, validate);
	dataPipeline.put("success", true);
  	ServiceUtils.expireServiceCache("packages.Awareness.dashboard.services.api.exportAll");
  
} catch (Exception e) {
  dataPipeline.put("success", false);
}

	}

}