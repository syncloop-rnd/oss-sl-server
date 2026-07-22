package packages.Awareness.dashboard.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.manager.ChatLanguageModelManager;
import agents.manager.LLMVerificationType;
import java.util.*;
public final class createLLMSpec{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
  try{
    String llmUrl = dataPipeline.getString("llmUrl");//"https://api.groq.com/openai/v1";
	String apiKey = dataPipeline.getString("apiKey");
    String modelName = dataPipeline.getString("modelName");
    String name = dataPipeline.getString("name");
    String provider = dataPipeline.getString("provider");
    String LLMKey = dataPipeline.getString("LLMKey");
    Integer maxTokens = dataPipeline.getAsInteger("maxTokens");
    Boolean enableParallelToolCalls = dataPipeline.getAsBoolean("enableParallelToolCalls");
    Boolean sstc = dataPipeline.getAsBoolean("sstc");
    String llmVerificationType = dataPipeline.getString("llmVerificationType");
    String displayName = dataPipeline.getString("displayName");
    Double temperature=(Double)dataPipeline.get("temperature");
    Double topP=(Double)dataPipeline.get("topP");
    String description = dataPipeline.getString("description");
    Map<String, Object> properties=(Map<String, Object>)dataPipeline.get("properties");
	ChatLanguageModelManager.addLLM(LLMKey,name, llmUrl, apiKey, modelName, temperature,maxTokens,provider,enableParallelToolCalls, sstc, 
                                    displayName, true, topP, LLMVerificationType.valueOf(llmVerificationType), false, properties, description);
	dataPipeline.put("llmKey",LLMKey);
    dataPipeline.put("status","success");
    ServiceUtils.expireServiceCache("packages.Awareness.dashboard.services.api.exportAll");
  }catch(Exception e){
    e.printStackTrace();
    dataPipeline.clear();
    dataPipeline.put("error",e.getMessage());
    dataPipeline.put("status","failed");
    dataPipeline.put("credit_error",
                    (e.getMessage().contains("insufficient_quota")
                            || e.getMessage().contains("quota"))
                    );
    new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}