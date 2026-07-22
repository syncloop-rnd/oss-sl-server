package packages.Awareness.dashboard.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.manager.AgentManager;
public final class createDefaultAgents{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
AgentManager.addDefaultAgents(dataPipeline.rp.getTenant().getName());
ServiceUtils.expireServiceCache("packages.Awareness.dashboard.services.api.exportAll");
	}

}