package packages.middleware.pub.server.browse;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.io.InputStream;
import java.io.File;
import org.apache.commons.io.IOUtils;
import java.io.FileOutputStream;
import com.eka.middleware.service.PropertyManager;
public final class uploadFile{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{
   dataPipeline.appLog("OPERATION", "uploadFile");
  String folder=dataPipeline.getString("dest");
  InputStream is=dataPipeline.getFile("file");
  String fileName=dataPipeline.getFileName("file");
  String configDir = "config";
  if (fileName.endsWith(".jar")) {
    configDir = "jars";
    dataPipeline.appLog("CONFIG_DIR", "Config directory set to 'jars' for file ending with '.jar'.");
  }
  String location = PropertyManager.getPackagePath(dataPipeline.rp.getTenant())+folder+"/dependency/" + configDir + "/"+fileName;
  dataPipeline.appLog("EXTRACTED_LOCATION", location);
  File dir=new File(PropertyManager.getPackagePath(dataPipeline.rp.getTenant())+folder+"/dependency/" + configDir + "/");
  dataPipeline.appLog("EXTRACTED_DIRECTORY",dir.toString());
  if(!dir.exists())
    dir.mkdirs();
  	dataPipeline.appLog("DIRECTORY_CREATED", dir.getPath());
  IOUtils.copy(is,new FileOutputStream(new File(location)));
  dataPipeline.clear();
  dataPipeline.put("status", "Saved");
  dataPipeline.appLog("STATUS", "File uploaded successfully'");
  
}catch(Exception e){
	dataPipeline.clear();
	dataPipeline.put("error", e.getMessage());
  	dataPipeline.appLog("SERVICE_ERROR",e.getMessage());
	dataPipeline.setResponseStatus(500);
	dataPipeline.put("status", "Not Modified");
	new SnippetException(dataPipeline,"Failed while saving file", new Exception(e));
}
	}

}