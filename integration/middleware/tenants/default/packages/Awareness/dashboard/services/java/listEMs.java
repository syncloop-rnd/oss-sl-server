package packages.Awareness.dashboard.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.manager.EmbeddingModelManager;
import java.util.*;
public final class listEMs{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
  try{
    String json=EmbeddingModelManager.toJSON();
    Map<String,Object> map=ServiceUtils.jsonToMap(json);
    dataPipeline.put("EMBEDDING_MODELs",map.get("EMBEDDING_MODELs"));
    dataPipeline.put("status","success");
  }catch(Exception e){
    dataPipeline.clear();
    dataPipeline.put("error",e.getMessage());
    dataPipeline.put("status","failed");
    new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}