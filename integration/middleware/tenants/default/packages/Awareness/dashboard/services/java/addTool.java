package packages.Awareness.dashboard.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.manager.FunctionManager;
import agents.manager.AgentManager;
public final class addTool{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{
    String fqn = dataPipeline.getString("fqn");//"https://api.groq.com/openai/v1";
	String description = dataPipeline.getString("functionDescription");
    String identifier=dataPipeline.getString("identifier");
    String staticPayload=dataPipeline.getString("staticPayload");
  	String inputJSONSchema=dataPipeline.getString("inputJSONSchema");//Need to write a function that will extract the schema from fqn
  	FunctionManager.addTool(identifier, inputJSONSchema, fqn, description,staticPayload);
	//AgentManager.addPersonality(dataPipeline.rp.getTenant().getName(), agentID, LLMKey, agentName, title,description);
    //FunctionManager.persistNow(dataPipeline.rp.getTenant().getName());
    //AgentManager.getPersonality(identifier).apply();
	dataPipeline.put("status","success");
  }catch(Exception e){
    dataPipeline.clear();
    dataPipeline.put("error",e.getMessage());
    dataPipeline.put("status","failed");
    new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}