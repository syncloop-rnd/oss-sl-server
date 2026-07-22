package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;

import java.util.Hashtable;
public final class lookupDict{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  			dataPipeline.appLog("OPERATION", "lookupDict");		
            String key = dataPipeline.getString("key");
			dataPipeline.appLog("KEY", key);
            Hashtable<String, Object> hashtable = (Hashtable<String, Object>)dataPipeline.get("hashtable");
            Object value = hashtable.get(key);

            dataPipeline.put("result", value);
  			dataPipeline.appLog("RESULT", "Fetched value: " + value);

        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
  			dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
            throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
        }
	}

}