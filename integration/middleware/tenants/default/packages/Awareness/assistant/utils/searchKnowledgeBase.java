package packages.Awareness.assistant.utils;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.manager.RAGManager;
import java.util.*;
public final class searchKnowledgeBase{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
  try{
      String ragID = dataPipeline.getString("ragID");
      String LLMKey = dataPipeline.getString("LLMKey");
      String searchText = dataPipeline.getString("searchText");
      Boolean enableQueryExpander = dataPipeline.getAsBoolean("enableQueryExpander");
      Map<String,Object> result=RAGManager.searchKnowledgeBase(ragID,searchText,null,10,enableQueryExpander,LLMKey);
      dataPipeline.put("result",result);
      dataPipeline.put("status","success");
  }catch(Exception e){
    e.printStackTrace();
      dataPipeline.clear();
      dataPipeline.put("error",e.getMessage());
      dataPipeline.put("status","failed");
      new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}