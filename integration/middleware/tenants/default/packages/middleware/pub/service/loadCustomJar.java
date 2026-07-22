package packages.middleware.pub.service;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;

public final class loadCustomJar{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{
  dataPipeline.appLog("OPERATION", "loadcustomJar");
  String packageName=dataPipeline.getString("packageName");
  dataPipeline.appLog("EXTRACTED_PACKAGE_NAME", packageName);
  String absoluteJarFilePath=dataPipeline.getString("absoluteJarFilePath");
  dataPipeline.appLog("EXTRACTED_ABSOLUTE_JAR_FILE_PATH", absoluteJarFilePath);
  String jarFileName=dataPipeline.getString("jarFileName");
  if(absoluteJarFilePath!=null){
  	ServiceUtils.loadCustomJar(dataPipeline, absoluteJarFilePath);
  	dataPipeline.appLog("CUSTOM_JAR_LOAD", "Loading custom JAR from absolute path");
  }
  else{
    ServiceUtils.loadCustomJar(dataPipeline, packageName,jarFileName);
    dataPipeline.appLog("CUSTOM_JAR_LOAD", "Loading custom JAR from package");
  }
}
catch(Exception e){
  dataPipeline.clear();
  dataPipeline.put("error",e.getMessage());
  dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
  throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
}
	}

}