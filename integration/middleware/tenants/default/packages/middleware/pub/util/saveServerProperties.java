package packages.middleware.pub.util;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.PropertyManager;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringUtils;
import com.eka.middleware.service.ServiceUtils;

import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.util.Properties;
import java.util.Map;

public final class saveServerProperties{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  			dataPipeline.appLog("OPERATION", "saveServerProperties");
           	ServiceUtils.saveServerProperties(dataPipeline);
  			dataPipeline.appLog("SAVED_SERVER_PROPERTIES", "Server properties saved successfully.");
    } 
catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
  			dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
            throw new SnippetException(dataPipeline, "Snippet exception", new Exception(e));
        }
	}

}