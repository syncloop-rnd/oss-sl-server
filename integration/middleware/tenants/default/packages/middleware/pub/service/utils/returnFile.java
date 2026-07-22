package packages.middleware.pub.service.utils;
import java.io.File;
import java.io.FileInputStream;
import java.net.URLConnection;
import java.util.regex.Pattern;

import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.MultiPart;
import com.eka.middleware.template.SnippetException;
import java.io.InputStream;
import org.apache.commons.lang3.StringUtils;

import io.undertow.util.Headers;
public final class returnFile{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
		try {
          	dataPipeline.appLog("OPERATION", "returnFile");
            byte[] fileData = (byte[])dataPipeline.get("fileData");
          	//dataPipeline.appLog("FILE_DATA_LENGTH", fileData.length + "");
            String fileName = dataPipeline.getString("fileName");
          	dataPipeline.appLog("FILE_NAME", fileName);
            Object inputStream = dataPipeline.get("inputStream");
          	dataPipeline.appLog("INPUT_STREAM", "Generated");
            String body = dataPipeline.getString("body");
          	dataPipeline.appLog("BODY", body);
            boolean isDownloadable = (null == dataPipeline.getAsBoolean("isDownloadable")) ? false : dataPipeline.getAsBoolean("isDownloadable");
          	dataPipeline.appLog("IS_DOWNLOADABLE", String.valueOf(isDownloadable));  
          	String contentType = dataPipeline.getString("ContentType");
            dataPipeline.appLog("CONTENT_TYPE", contentType);
          	MultiPart mp = null;
            boolean octet=false;

            if(StringUtils.isNotBlank(fileName)) {
                octet=true;
                dataPipeline.appLog("FILENAME_BLANK", "File name is blank & octet is set to true");
            }
          
          

            if(inputStream!=null) {
                mp = new MultiPart(dataPipeline, (InputStream) inputStream, fileName, octet);
              	dataPipeline.appLog("MULTIPART_INPUT_STREAM", "Creating MultiPart with InputStream");
            } else if(null != fileData && StringUtils.isNotBlank(fileName)) {
                mp = new MultiPart(dataPipeline, fileData, fileName);
              	dataPipeline.appLog("MULTIPART_FILE_DATA", "Creating MultiPart with file data file name");
            }
            else if(fileData!=null){
                mp = new MultiPart(dataPipeline, fileData);
                mp.putHeader(Headers.CONTENT_TYPE_STRING, "application/octet-stream");
              	dataPipeline.appLog("MULTIPART_FILE_DATA", "Creating MultiPart with file data");

            }else if(body!=null){
                mp = new MultiPart(dataPipeline, body.getBytes());
              	dataPipeline.appLog("MULTIPART_BODY", "Creating MultiPart with body");
            }

            if (null != contentType) {
                mp.putHeader(Headers.CONTENT_TYPE_STRING, contentType);
              	dataPipeline.appLog("MULTIPART_CONTENT_TYPE", contentType);
            }

            if (isDownloadable) {
                mp.putHeader(Headers.CONTENT_DISPOSITION_STRING, "attachment; filename=\""+fileName+"\"");
              	dataPipeline.appLog("CONTENT_DISPOSITION", "Setting as downloadable with filename");
            }

        } catch (Throwable e) {
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
          	dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
            e.printStackTrace();
        }
	}

}