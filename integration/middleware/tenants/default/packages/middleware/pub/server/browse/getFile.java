package packages.middleware.pub.server.browse;
import java.io.File;
import java.io.FileInputStream;
import java.net.URLConnection;
import java.util.regex.Pattern;

import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.MultiPart;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.service.PropertyManager;
import io.undertow.util.Headers;
import java.util.Map;
import io.undertow.util.HttpString;

import io.undertow.util.Headers;

public final class getFile{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
			//System.out.println("**********************" + dataPipeline.getUrlPath());
  			dataPipeline.appLog("OPERATION", "getfile");
			String location = dataPipeline.getUrlPath().split("GET/files/")[1];
  			dataPipeline.appLog("EXTRACTED_LOCATION_FROM_URL",location);
			//System.out.println("++++++++++++++++++++++++++++++++++++" + location);
			String split[] = location.split(Pattern.quote("."));
			String ext = split[split.length - 1];
			location = PropertyManager.getPackagePath(dataPipeline.rp.getTenant()) + location;
			dataPipeline.clear();
  			dataPipeline.appLog("LOCATION", location);
			dataPipeline.put("Location", location);
			File file = new File(location);
			if(!file.exists()) {
              	dataPipeline.appLog("EXECTUTION_FAILED", "File not found");
				dataPipeline.setResponseStatus(404);
				dataPipeline.clear();
				dataPipeline.put("msg", "file not found");
				return;
			}
			
			String contentType = java.nio.file.Files.probeContentType(file.toPath());
  			
			if (contentType == null) {
				if (ext.toLowerCase().equals("js"))
					contentType = "application/javascript";
				if (ext.toLowerCase().equals("json"))
					contentType = "application/json";
              	if (ext.toLowerCase().equals("css"))
					contentType = "text/css";
			}
			if(contentType==null) {
				URLConnection connection = file.toURL().openConnection();
			    contentType = connection.getContentType();
                connection.getInputStream().close();
				//contentType="application/";
			}
			//System.out.println("++++++++++++++++++++++++++++++++++++" + location);
			//System.out.println("++++++++++++++++++++++++++++++++++++" + contentType);
  			dataPipeline.appLog("CONTENT_TYPE", contentType);
			MultiPart mp = new MultiPart(dataPipeline, new FileInputStream(file), false);
			mp.putHeader(Headers.CONTENT_TYPE_STRING, contentType);
  			dataPipeline.rp.getExchange().getResponseHeaders().put(new HttpString("Cache-Control"), "public, max-age=31536000");
		} catch (Throwable e) {
			dataPipeline.clear();
			dataPipeline.put("error", e.getMessage());
  			dataPipeline.appLog("GETFILE_ERROR", e.getMessage());
			// throw e;
		}
	}

}