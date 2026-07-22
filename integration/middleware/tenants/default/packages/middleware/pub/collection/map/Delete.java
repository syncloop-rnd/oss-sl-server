package packages.middleware.pub.collection.map;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.Map;
public final class Delete{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  String key = dataPipeline.getString("key");
  Map<String,Object> map = dataPipeline.getAsMap("map");
  if (null != map) {
    Object obj = map.remove(key);
    
  }
  
  } catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}