package packages.middleware.pub.service;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.service.PropertyManager;
import java.io.File;
public final class doesServiceExist{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
dataPipeline.appLog("OPERATION", "doesServiceExist");
String packagePath = PropertyManager.getPackagePath(dataPipeline.rp.getTenant());
dataPipeline.appLog("EXTRACTED_PACKAGE_PATH", packagePath);
String fqn = dataPipeline.getString("fqn");
dataPipeline.appLog("EXTRACTED_FQN", fqn);
String type = dataPipeline.getString("type");
dataPipeline.appLog("TYPE", type);
String filePath = packagePath + fqn + "." + type;
dataPipeline.appLog("EXTRACTED_FILE_PATH", filePath);

File file = new File(filePath);

dataPipeline.put("path", filePath);
dataPipeline.appLog("FILE_PATH", "File Path: " + filePath);
dataPipeline.put("exist", file.exists());
dataPipeline.appLog("FILE_EXISTENCE",String.valueOf(file.exists()));
	}

}