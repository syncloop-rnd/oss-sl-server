package packages.middleware.pub.specs.swagger.v3;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.PropertyManager;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.MultiPart;
import com.eka.middleware.template.SnippetException;
import io.undertow.util.Headers;
import org.apache.commons.lang3.StringUtils;

import java.io.File;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
public final class GenerateSwagger{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
	try {
    	dataPipeline.appLog("OPERATION", "GenerateSwagger");
        List<String> fqns = (List<String>)dataPipeline.get("fqns");
		dataPipeline.appLog("FQN_LIST", fqns.toString());
        String disposingFileName = new Date().getTime() + "";
      	dataPipeline.appLog("DISPOSING_FILE_NAME", "Disposing File Name: " + disposingFileName);
        if (fqns.size() == 1) {
            String location = StringUtils.removeEnd(fqns.get(0), ".main");
          	dataPipeline.appLog("LOCATION", location);
            String localLocation = PropertyManager.getPackagePath(dataPipeline.rp.getTenant()) + location.replaceAll(Pattern.quote("."), "/") + ".flow";
            dataPipeline.appLog("LOCAL_LOCATION", ".flow Local Location Value: " + localLocation);
          	if (!new File(localLocation).exists()) {
              	dataPipeline.appLog("LOCAL_LOCATION_CHECK", ".flow local location do not exist checking .api location");
                localLocation = PropertyManager.getPackagePath(dataPipeline.rp.getTenant()) + location.replaceAll(Pattern.quote("."), "/") + ".api";
              	dataPipeline.appLog("LOCAL_LOCATION", ".api Local Location Value: " + localLocation);
            }
            disposingFileName = location.replaceAll("/", ".");
          	dataPipeline.appLog("UPDATED_DISPOSING_FILE_NAME", "Updated Disposing File Name: " + disposingFileName);
        }

        String basePath = dataPipeline.getMyPackageConfig("basePath");
      	dataPipeline.appLog("BASEPATH", basePath);
        String currentURI = ServiceUtils.getServerProperty("pub.middleware.host.name");
      	dataPipeline.appLog("CURRENT_URI", currentURI);
        if (StringUtils.isNotBlank(currentURI)) {
          	dataPipeline.appLog("BLANK_CURRENT_URI", "CureentURI is blank. Setting basepath value to it.");
            basePath = currentURI;
        }
        String openApiFormat = com.eka.middleware.pub.util.swagger.GenerateSwagger.swagger(fqns , StringUtils.isNotBlank(basePath) ? basePath : dataPipeline.getCurrentURI(), dataPipeline);
		dataPipeline.put("openAPI", openApiFormat);
      	dataPipeline.appLog("OPENAPI", openApiFormat);
      	
        /*MultiPart mp = new MultiPart(dataPipeline, openApiFormat.getBytes());
        mp.putHeader(Headers.CONTENT_TYPE_STRING, "application/json");
        Boolean isDownloadable = (Boolean) payload.get("isDownloadable");
        if (null != isDownloadable && isDownloadable) {
            mp.putHeader(Headers.CONTENT_DISPOSITION_STRING, "attachment; filename=" + disposingFileName + ".json");
        }*/
      
        } catch (Exception e) {
      		e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
      		dataPipeline.appLog("SERVICE", e.getMessage());
            new SnippetException(dataPipeline,"SnippetException exception", e);
        }
	}

}