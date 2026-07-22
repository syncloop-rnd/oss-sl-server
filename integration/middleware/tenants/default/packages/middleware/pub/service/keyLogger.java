package packages.middleware.pub.service;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class keyLogger{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
			//dataPipeline.appLog("OPERATION","keyLogger");
            String key = dataPipeline.getString("key");
  			//dataPipeline.appLog("EXTRACTED_KEY", key.toString());
            Object value = dataPipeline.get("value");
  			//dataPipeline.appLog("EXTRACTED_VALUE", value.toString());
            dataPipeline.appLog(key, null == value ? "null" : value + "");

        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
  			 dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
            throw new SnippetException(dataPipeline, "Snippet exception", e);
        }
	}

}