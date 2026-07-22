package packages.middleware.pub.platform;
import java.io.File;
import java.io.FileOutputStream;
import java.util.Base64;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.List;
import org.apache.commons.io.FileUtils;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException; 
import com.eka.middleware.auth.AuthAccount;
import java.net.URL;
import com.eka.middleware.service.PropertyManager;
import java.util.regex.Pattern;
public final class uninstallPlugin{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  			dataPipeline.appLog("OPERATION", "delete");
            String location = dataPipeline.getAsString("location");
  			dataPipeline.appLog("EXTRACTED_LOCATION_FROM_URL",location);
            String split[] = location.split(Pattern.quote("."));
            String ext = split[split.length - 1];
            location = PropertyManager.getPackagePath(dataPipeline.rp.getTenant())
                    + location;
            if (location.contains(".package")) {
                location = location.replaceAll(Pattern.quote(".package"), "");
            } else if (location.contains(".folder")) {
                location = location.replaceAll(Pattern.quote(".folder"), "");
            }
            dataPipeline.clear();
            dataPipeline.appLog("LOCATION", location);
			dataPipeline.put("Location", location);
            File file = new File(location);
            if(file.exists()) {
                if (file.isDirectory()) {
                  	dataPipeline.appLog("OPERATION_EXECUTED", "Delete directory" );
                    deleteDirectory(dataPipeline,file);
                } else {
                    if (deleteFile(dataPipeline, location, ext, file)) return;
                  	dataPipeline.appLog("OPERATION_EXECUTED", "Delete file" );
                }
            } else {
                dataPipeline.log("File is not existed ------>" + location);
              	dataPipeline.appLog("EXECUTION_STOPPED", "File doesnot exist" );
            }
            dataPipeline.clear();
  			dataPipeline.appLog("FILE_DELETED_AT_LOCATION",location);
            dataPipeline.put("status", "Deleted");
  			ServiceUtils.expireServiceCache("packages.middleware.pub.server.browse.getPackagesAsTree");
        } catch (Throwable e) {
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
  			dataPipeline.appLog("DELETE_ERROR",e.getMessage());
            dataPipeline.setResponseStatus(500);
            dataPipeline.put("status", "Failed to delete");
            new SnippetException(dataPipeline,"Failed to delete", new Exception(e));
        }
	}
private static boolean deleteFile(DataPipeline dataPipeline, String location, String ext, File file) throws Exception {
        AuthAccount authAccount = dataPipeline.getCurrentRuntimeAccount();
        String loggedInUserId = authAccount.getUserId();
        String lockedByUser = getLockedByUser(file);
  		dataPipeline.appLog("LOGGED_IN_USER_ID", loggedInUserId);
  		Map<String, Object> profiles = authAccount.getAuthProfile();
		List<String> groupList = (List<String>)profiles.get("groups");
		boolean isSystemAdmin = groupList.contains("system-admin");
  
  		if(!isSystemAdmin) {
          if(!loggedInUserId.equals(lockedByUser) && !(ext.equals("jdbc") || ext.equals("properties"))){
              if(lockedByUser!=null){
                dataPipeline.put("error", "Resource is locked by another user" + lockedByUser + "'");
                dataPipeline.appLog("RESOURCE_LOCKED_BY_ANOTHER_USER",lockedByUser);
              }
              else{
                dataPipeline.put("error", "Please lock the service first.");
                dataPipeline.appLog("RESOURCE_NOT_LOCKED", "Please lock the resource first.");
              }
              return true;
          }
        }

        String name= file.getName();
        String javaName=name.replace("."+ ext,".java");
        String javaClass=name.replace("."+ ext,".class");
        file.delete();
        String javalocation= location.replace(name,javaName);
        file =new File(javalocation);
        dataPipeline.appLog("DELETING_FILE_JAVALOCATION", javalocation);
        if(file.exists())
            file.delete();
        String classlocation= location.replace(name,javaClass);
        file =new File(classlocation);
        dataPipeline.appLog("DELETING_FILE_CLASSLOCATION",classlocation);
        if(file.exists())
            file.delete();
        return false;
    }

    public static void deleteDirectory(DataPipeline dataPipeline,File directory) {

        // if the file is directory or not
        if(directory.isDirectory()) {
            File[] files = directory.listFiles();

            // if the directory contains any file
            if(files != null) {
                for(File file : files) {

                    // recursive call if the subdirectory is non-empty
                    deleteDirectory(dataPipeline,file);
                }
            }
        }

        if(directory.delete()) {
          System.out.println(directory + " is deleted");
          dataPipeline.appLog("SERVICE_EXECUTED", "Directory gets deleted");
        }
        else {
          System.out.println("Directory not deleted");
          dataPipeline.appLog("SERVICE_EXECUTED", "Directory does not gets deleted");
        }
    }

    public static String getLockedByUser(File file) throws Exception{
        byte[] data = ServiceUtils.readAllBytes(file);
        String json = new String(data);
        Map<String, Object> jsonMap = ServiceUtils.jsonToMap(json);
        if (null == jsonMap) {
            return null;
        }
        if(jsonMap.get("lockedByUser")!=null)
            return jsonMap.get("lockedByUser").toString();
        if(jsonMap.get("latest")!=null){
            Map<String, Object> version=(Map<String, Object>)jsonMap.get("latest");
            if(version !=null && version.get("lockedByUser")==null)
                return null;
            return version.get("lockedByUser").toString();
        }else
            return null;
    }
}