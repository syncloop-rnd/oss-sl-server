package packages.Awareness.assistant.utils;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.core.agent.Personality;
import agents.manager.AgentManager;
import java.util.*;
public final class getChatHistory{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
  try{
      String agentID = dataPipeline.getString("agentID");
      String chatID = dataPipeline.getString("chatID");
      Personality p=AgentManager.getPersonality(agentID);
      List<Map<String,Object>> history=p.getChatHistory(chatID);
      dataPipeline.put("chatHistory",history);
      
  }catch(Exception e){
      dataPipeline.clear();
      dataPipeline.put("error",e.getMessage());
      dataPipeline.put("status","failed");
      new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}