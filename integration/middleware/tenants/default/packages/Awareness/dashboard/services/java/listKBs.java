package packages.Awareness.dashboard.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.manager.KnowledgeBaseManager;
import java.util.*;
public final class listKBs{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
  try{
    String json=KnowledgeBaseManager.toJSON();
    Map<String,Object> map=ServiceUtils.jsonToMap(json);
    dataPipeline.put("KBs",map.get("KBs"));
    dataPipeline.put("status","success");
  }catch(Exception e){
    dataPipeline.clear();
    dataPipeline.put("error",e.getMessage());
    dataPipeline.put("status","failed");
    new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}