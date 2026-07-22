package packages.Awareness.dashboard.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.manager.ChatLanguageModelManager;
import java.util.*;
public final class getModelSpecs{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
  try{
    String llmsJson=ChatLanguageModelManager.toJSON();
    Map<String,Object> map=ServiceUtils.jsonToMap(llmsJson);
    dataPipeline.put("LLMs",map.get("LLMs"));
  }catch(Exception e){
    dataPipeline.clear();
    dataPipeline.put("error",e.getMessage());
    new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}