package packages.Awareness.dashboard.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.manager.AgentManager;
import agents.core.agent.Personality;
public final class getAgent{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {

  		String agentID = dataPipeline.getString("agentID");
  		Personality personality = AgentManager.getPersonality(agentID, dataPipeline);
  
  		if (null != personality) {
         	dataPipeline.put("name", personality.getName()); 
        }
           

        } catch (Exception e) {
            e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
            dataPipeline.put("status", "failed");
            throw new SnippetException(dataPipeline, "Snippet exception", e);
        }
	}

}