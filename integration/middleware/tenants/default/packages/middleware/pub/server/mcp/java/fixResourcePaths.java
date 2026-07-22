package packages.middleware.pub.server.mcp.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.*;
import com.eka.middleware.heap.CacheManager;
public final class fixResourcePaths{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
  try{
    Map<String,Object> paths=dataPipeline.getAsMap("paths");
    final List<Object> list=new ArrayList();
    final Map cache=CacheManager.getCacheAsMap(dataPipeline.rp.getTenant(),"mcp_tools_cache");
    paths.forEach((path,methods)->{
      String fqn=(path+"").replace("/","");
      ((Map)methods).forEach((method,definition)->{
        Map<String,Object> def=((Map<String,Object>)definition);
        Map<String,Object> map=(Map<String,Object>)def.get("requestBody");
        if(map!=null){
          map=(Map<String,Object>)map.get("content");
          if(map!=null){
            map=(Map<String,Object>)map.get("application/json");
            if(map!=null)
              map=(Map<String,Object>)map.get("schema");
          }
        }
        String description=def.get("description")+"";
        String operationId=fqn.replace(".","_").replace("packages_", "").replace("mcp_tools_", "").toLowerCase();//def.get("operationId")+"";
        Map<String,Object> content=new HashMap();
        content.put("description",description);
        content.put("operationId",operationId);
        content.put("schema",map);
        cache.put(operationId,fqn);
        list.add((Object)content);
      });
    });
    cache.put("test","testPath");
    dataPipeline.put("contents",list);
    dataPipeline.put("mcp_tools_cache",cache);
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