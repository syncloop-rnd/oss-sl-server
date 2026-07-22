package packages.middleware.pub.server.core;
import com.eka.middleware.licensing.License;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
public final class updateLicenseService{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  			dataPipeline.appLog("OPERATION", "updateLicenseService");
            String licenseKey = dataPipeline.getString("licenseKey");
            dataPipeline.appLog("LICENSE_KEY",licenseKey);
            License.updateLicenseKey(dataPipeline, licenseKey);
  			dataPipeline.appLog("SERVICE_STATUS", "Lisence key updated successfully");
  			
        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
  			dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
          	
        }
	}

}