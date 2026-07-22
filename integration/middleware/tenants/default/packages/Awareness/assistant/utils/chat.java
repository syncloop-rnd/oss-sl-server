package packages.Awareness.assistant.utils;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.manager.AgentManager;
import agents.core.agent.Personality;
public final class chat{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{
    String agentID = dataPipeline.getString("agentID");
    String chatID = dataPipeline.getString("chatID");
	Boolean disableMemory = dataPipeline.getAsBoolean("disableMemory");
    Boolean disableRAG = dataPipeline.getAsBoolean("disableRAG");
    Boolean disableTools = dataPipeline.getAsBoolean("disableTools");
    Boolean enableInternetGrounding = dataPipeline.getAsBoolean("enableInternetGrounding");
  	String prompt = dataPipeline.getString("prompt");
    String name = dataPipeline.getString("name");
  	Boolean summaryEnabled = false;
  	if(dataPipeline.getAsBoolean("summaryEnabled") !=null ) {
  	  summaryEnabled = dataPipeline.getAsBoolean("summaryEnabled");
 	}
	Personality p=AgentManager.getPersonality(agentID);
    if(disableMemory!=null && disableMemory==true)
      p.disableMemory();
    else
      p.enableMemory();
    if(disableRAG!=null && disableRAG==true)
      p.disableRAG();
    else
      p.enableRAG();
    if(disableTools!=null && disableTools==true) {
    	//p.disableTools();
    } else {
    	//p.enableTools();
    }
  if(enableInternetGrounding!=null)
    p.setAllowInternetSearch(enableInternetGrounding);
    String resp="";
  
  //p.disableMemory();
   //p.enableMemory();
  
    if(chatID!=null && chatID.trim().length()>0){
            resp=p.request(name,chatID,prompt,null,summaryEnabled);
    }else{
      	resp=p.chat("default",prompt);
    }
      
    dataPipeline.put("status","success");
	dataPipeline.put("resp",resp);
  }catch(Throwable e){

  	e.printStackTrace();
    dataPipeline.clear();
    dataPipeline.put("error",e.getMessage());
    dataPipeline.put("status","failed");
    //new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}