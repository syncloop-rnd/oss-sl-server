package packages.middleware.pub.util;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.PropertyManager;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.io.IOUtils;

import java.io.FileInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Properties;
public final class serverProperties{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  			dataPipeline.appLog("OPERATION", "serverProperties");          
  			readFile(dataPipeline);
     } 
catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
  			dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
            throw new SnippetException(dataPipeline, "Snippet exception", new Exception(e));
        }
	}

private static void readFile(DataPipeline dataPipeline) throws Exception {

        String filePath = PropertyManager.getConfigFolderPath()+"server.properties";
        Properties props = PropertyManager.getServerProperties("server.properties");
        dataPipeline.put("json", props);
        dataPipeline.put("raw", IOUtils.toString(new FileInputStream(filePath), StandardCharsets.UTF_8));

    }

}