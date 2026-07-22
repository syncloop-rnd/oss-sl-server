package packages.Awareness.dashboard.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.manager.RAGManager;
import java.util.*;
public final class listRAGs{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
  try{
    String json=RAGManager.toJSON();
    Map<String,Object> map=ServiceUtils.jsonToMap(json);
    dataPipeline.put("RAGs",map.get("RAGs"));
    dataPipeline.put("status","success");
  }catch(Exception e){
    dataPipeline.clear();
    dataPipeline.put("error",e.getMessage());
    dataPipeline.put("status","failed");
    new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}