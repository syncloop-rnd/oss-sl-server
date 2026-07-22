package packages.middleware.pub.server.build.api;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.licensing.License;
public final class updateLicenseKey{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  	  dataPipeline.appLog("OPERATION", "updateLicenseKey");
      String licenseKey = dataPipeline.getAsString("licenseKey");
  	  dataPipeline.appLog("LICENSE_KEY", licenseKey);
      dataPipeline.put("result",License.updateLicenseKey(dataPipeline,licenseKey));
  	  dataPipeline.appLog("LICENSE_KEY_UPDATE_RESULT", String.valueOf(License.updateLicenseKey(dataPipeline,licenseKey)));
  
} catch (Exception e) {
  
  	new SnippetException(dataPipeline,"Sneppet exception", new Exception(e));
}
	}

}