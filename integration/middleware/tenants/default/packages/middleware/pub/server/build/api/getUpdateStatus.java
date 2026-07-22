package packages.middleware.pub.server.build.api;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.pub.util.AppUpdate;
public final class getUpdateStatus{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  			dataPipeline.appLog("OPERATION", "getUpdateStatus");
  			String uniqueId = dataPipeline.getString("uniqueId");
  			Object status = AppUpdate.getStatus(uniqueId, dataPipeline);
  			dataPipeline.appLog("EXTRACTED_UNIQUE_ID", uniqueId);
  			dataPipeline.put("status", status);
  			dataPipeline.appLog("STATUS", status.toString());
  			
        } catch (
                Exception e) {
  			e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
  			dataPipeline.appLog("SERVICE_ERROR",e.getMessage());
            dataPipeline.setResponseStatus(500);
            dataPipeline.put("status", false);
            new SnippetException(dataPipeline, "Failed while saving file", new Exception(e));
        }
	}

}