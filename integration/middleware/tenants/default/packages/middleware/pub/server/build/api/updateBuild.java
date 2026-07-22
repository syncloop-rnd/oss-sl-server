package packages.middleware.pub.server.build.api;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;

import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.PropertyManager;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;

import java.io.*;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.Properties;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;
import com.eka.middleware.pub.util.AutoUpdate;
public final class updateBuild{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  			dataPipeline.appLog("OPERATION", "updateBuild");
  			String version = dataPipeline.getString("version");
  			dataPipeline.appLog("VERSION", version);
  			String uniqueId = AutoUpdate.updateTenantAsync(version, dataPipeline);
  			dataPipeline.put("uniqueId", uniqueId);
  			dataPipeline.appLog("UNIQUE_ID", uniqueId);
  			dataPipeline.put("status", "200");
            dataPipeline.put("message", "Build updated successfully.");
  			
        } catch (Exception e) {
  			e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
  			dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
            dataPipeline.setResponseStatus(500);
            dataPipeline.put("status", "500");
            dataPipeline.put("status", false);
            new SnippetException(dataPipeline, "Failed while updating build", new Exception(e));

        }

	}

}