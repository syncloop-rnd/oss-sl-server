package packages.Awareness.dashboard.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.manager.AgentManager;
import java.util.*;
public final class deleteAgent{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
  try{
    String agentID = dataPipeline.getString("agentID");
	AgentManager.delete(agentID);
    dataPipeline.put("status","success");
    ServiceUtils.expireServiceCache("packages.Awareness.dashboard.services.api.exportAll");
  }catch(Exception e){
    dataPipeline.clear();
    dataPipeline.put("error",e.getMessage());
    dataPipeline.put("status","failed");
    new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}