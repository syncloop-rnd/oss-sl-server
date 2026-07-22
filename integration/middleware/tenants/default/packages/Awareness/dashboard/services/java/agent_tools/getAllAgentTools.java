package packages.Awareness.dashboard.services.java.agent_tools;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.Map;
public final class getAllAgentTools{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
Map<String, Object> map = agents.core.tools.service.AgentToolsService.getInstance().getAllWithToolsRegistryAndMcp();
dataPipeline.put("agentTools", map.get("records"));
	}

}