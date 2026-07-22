package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.Map;
public final class trim{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
 try {
		dataPipeline.appLog("OPERATION", "trim");
   		Map<String,String> trimMap=dataPipeline.getAsMap("trim");
   		dataPipeline.appLog("TRIM_MAP", "Input Map: " + trimMap);
        trimMap.forEach((k,v)-> trimMap.put(k,(v==null?null:v.trim())));
   		
  } catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
   		dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}