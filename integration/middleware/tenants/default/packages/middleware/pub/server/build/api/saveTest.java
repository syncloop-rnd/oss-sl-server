package packages.middleware.pub.server.build.api;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.PropertyManager;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.io.IOUtils;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.Charset;
import java.util.Map;
public final class saveTest{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {

            String caseName = dataPipeline.getString("caseName");
            String fqn = dataPipeline.getString("fqn");
            Map<String, Object> payload = dataPipeline.getAsMap("*payload");

            String filePath = String.format("%s/test_cases/%s/%s.json", PropertyManager.getPackagePath(dataPipeline.rp.getTenant()), fqn, caseName);

            new File(filePath).getParentFile().mkdirs();

            FileOutputStream fileOutputStream = new FileOutputStream(new File(filePath));
            IOUtils.write(ServiceUtils.toJson(payload), fileOutputStream, Charset.defaultCharset());
            fileOutputStream.flush();
            fileOutputStream.close();
  
  			dataPipeline.put("status", "200");
  			dataPipeline.put("message", "Test case saved successfully.");

        } catch (Exception e) {
            e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("status", "500");
            dataPipeline.put("error", e.getMessage());
            dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
            dataPipeline.setResponseStatus(500);
            dataPipeline.appLog("SERVICE_STATUS", "Not Modified");
            new SnippetException(dataPipeline, "Failed while saving file", new Exception(e));
        }
	}

}