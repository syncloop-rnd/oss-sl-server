package packages.middleware.pub.server.mcp.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.*;
import com.eka.middleware.heap.CacheManager;
public final class getFQNFromCache{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
  try{
    String operationID=dataPipeline.getString("operationID").toLowerCase();
    final List<Object> list=new ArrayList();
    final Map cache=CacheManager.getCacheAsMap(dataPipeline.rp.getTenant(),"mcp_tools_cache");
    String fqn=cache.get(operationID)+"";
    System.out.println(fqn);
    dataPipeline.put("fqn",fqn);
    dataPipeline.put("status", "success");
  } catch (Exception e) {
     dataPipeline.clear();
     dataPipeline.put("error", e.getMessage());
     dataPipeline.put("status", "failed");
     dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
     throw new SnippetException(dataPipeline, "Snippet exception", e);
  }
	}

}