package packages.middleware.pub.server.browse;
import com.eka.middleware.auth.AuthAccount;
import com.eka.middleware.server.MiddlewareServer;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.PropertyManager;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.io.FileUtils;
import java.io.File;
import java.util.*;

public final class saveEmptyFolder{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {

  		String location = PropertyManager.getPackagePath(dataPipeline.rp.getTenant());
        String packageName = dataPipeline.getAsString("packageName");
  		dataPipeline.appLog("OPERATION", "saveEmptyFolder");
  		dataPipeline.appLog("CREATING_AN_EMPTY_FOLDER_AT_LOCATION",location + packageName);
        createEmptyFolder(location,packageName);
  		dataPipeline.appLog("FOLDER_CREATION_SUCCESSFUL_AT_LOCATION",location + packageName);
        dataPipeline.put("status",true);
        
        } catch (Throwable e) {
            e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
            dataPipeline.setResponseStatus(500);
            dataPipeline.put("status", false);
  			dataPipeline.appLog("FOLDER_CREATION_ERROR", "Failed to create an empty folder. Error: " + e.getMessage());
            new SnippetException(dataPipeline,"Failed while saving folder", new Exception(e));
        }
	}
 public static void createEmptyFolder( String location,String packageName) {
        File folder = new File(location+packageName);
        if (!folder.exists()) {
           folder.mkdirs();
        }
    }

}