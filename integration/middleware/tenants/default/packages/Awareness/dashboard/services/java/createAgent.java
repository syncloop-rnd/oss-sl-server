package packages.Awareness.dashboard.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.manager.AgentManager;
import agents.core.agent.Personality;
import java.util.*;
import utils.WrapperServiceUtils;
public final class createAgent{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
  try{
    String LLMKey = dataPipeline.getString("LLMKey");
	String description = dataPipeline.getString("description");
    String title = dataPipeline.getString("title");
    String agentID=dataPipeline.getString("agentID");
    String agentName=dataPipeline.getString("agentName");
    String icon=dataPipeline.getString("icon");
    Boolean webSearch=dataPipeline.getAsBoolean("webSearch");
    Map<String, Object> props = (Map<String, Object>)dataPipeline.get("props");
    WrapperServiceUtils.prepareAgentWrapperService(agentID, agentName);
	Personality personality = AgentManager.addPersonality(dataPipeline.rp.getTenant().getName(), agentID, LLMKey, agentName, title, description, icon, webSearch, props);
 	if(personality == null){
      if(LLMKey == null || LLMKey.isEmpty()){
         dataPipeline.put("error","LLM Required");
      }else{
         dataPipeline.put("error","Agent not saved");
      }
 	  dataPipeline.put("status","failed");
     
 	}else{
      dataPipeline.put("status","success");
   	 ServiceUtils.expireServiceCache("packages.Awareness.dashboard.services.api.exportAll");
    }  
  }catch(Exception e){
    e.printStackTrace();
    dataPipeline.clear();
    dataPipeline.put("error",e.getMessage());
    dataPipeline.put("status","failed");
    new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}