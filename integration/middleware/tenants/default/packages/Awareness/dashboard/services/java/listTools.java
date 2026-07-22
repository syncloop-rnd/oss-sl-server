package packages.Awareness.dashboard.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.manager.FunctionManager;
import java.util.*;
public final class listTools{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
  try{
    String json=FunctionManager.toJSON();
    Map<String,Object> map=ServiceUtils.jsonToMap(json);
    dataPipeline.put("Tools",map.get("Tools"));
    dataPipeline.put("status","success");
  }catch(Exception e){
    dataPipeline.clear();
    dataPipeline.put("error",e.getMessage());
    dataPipeline.put("status","failed");
    new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}