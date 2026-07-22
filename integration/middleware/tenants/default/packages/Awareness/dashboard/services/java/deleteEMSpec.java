package packages.Awareness.dashboard.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.manager.EmbeddingModelManager;
import java.util.*;
public final class deleteEMSpec{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
  try{
    String EMKey = dataPipeline.getString("EMKey");
	EmbeddingModelManager.delete(EMKey);
    dataPipeline.put("status","success");
    ServiceUtils.expireServiceCache("packages.Awareness.dashboard.services.api.exportAll");
  }catch(Exception e){
    dataPipeline.clear();
    dataPipeline.put("error",e.getMessage());
    dataPipeline.put("status","failed");
    new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}