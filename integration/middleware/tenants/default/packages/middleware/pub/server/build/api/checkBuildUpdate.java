package packages.middleware.pub.server.build.api;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;

import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.PropertyManager;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringUtils;

import java.io.*;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.Properties;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;
import com.eka.middleware.pub.util.AutoUpdate;
public final class checkBuildUpdate{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  			dataPipeline.appLog("OPERATION", "checkBuildUpdate");
  			String newVersion = AutoUpdate.checkForUpdate(dataPipeline);
  			dataPipeline.put("status", StringUtils.isNotBlank(newVersion));
  			dataPipeline.appLog("STATUS", String.valueOf(StringUtils.isNotBlank(newVersion)));
  			dataPipeline.put("newVersion", newVersion);
  			dataPipeline.appLog("NEW_VERSION", newVersion);

        } catch (
                Exception e) {
  e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
  			dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
            dataPipeline.setResponseStatus(500);
            dataPipeline.put("status", "Not Modified");
  			dataPipeline.appLog("SERVICE_STATUS","Not Modified");
            new SnippetException(dataPipeline, "Failed while saving file", new Exception(e));
        }

	}

}