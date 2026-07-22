package packages.Awareness.dashboard.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.service.DataPipeline;
import agents.manager.AgentManager;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.*;
public final class getAgentById{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
  try{
    String agentId = dataPipeline.getString("agentId");
    String json=AgentManager.getAgentById(agentId);
    Map<String,Object> map=ServiceUtils.jsonToMap(json);
    dataPipeline.put("Agent",map.get("Agent"));
    dataPipeline.put("status","success");
  }catch(Exception e){
    dataPipeline.clear();
    dataPipeline.put("error",e.getMessage());
    dataPipeline.put("status","failed");
    new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}