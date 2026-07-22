package packages.Awareness.dashboard.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.manager.EmbeddingModelManager;
import agents.manager.LLMVerificationType;
import java.util.*;
public final class createEMSpec{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
  try{
    String baseUrl = dataPipeline.getString("baseUrl");//"https://api.groq.com/openai/v1";
	String apiKey = dataPipeline.getString("apiKey");
    String modelName = dataPipeline.getString("modelName");
    String provider = dataPipeline.getString("provider");
    String EMkey = dataPipeline.getString("EMkey");
    Boolean verifyFirst = dataPipeline.getAsBoolean("verifyFirst");
    String llmVerificationType = dataPipeline.getString("llmVerificationType");
    String displayName = dataPipeline.getString("displayName");
    int dimensions = dataPipeline.getAsInteger("dimensions");
	//EmbeddingModelManager.addLLM(LLMKey,name, llmUrl, apiKey, modelName, temperature,maxTokens,provider,enableParallelToolCalls, sstc, displayName, topP, LLMVerificationType.valueOf(llmVerificationType));
	EmbeddingModelManager.addEmbeddingModel(EMkey, baseUrl, apiKey, modelName,provider, displayName, false, LLMVerificationType.valueOf(llmVerificationType),true,dimensions, dataPipeline.getAsMap("properties"));
    dataPipeline.put("EMkey",EMkey);
    dataPipeline.put("status","success");
    ServiceUtils.expireServiceCache("packages.Awareness.dashboard.services.api.exportAll");
  }catch(Exception e){
    e.printStackTrace();
    dataPipeline.clear();
    dataPipeline.put("error",e.getMessage());
    dataPipeline.put("status","failed");
    new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}