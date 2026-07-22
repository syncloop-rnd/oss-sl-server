package packages.middleware.pub.server.browse;
import java.io.File;
import java.io.FileOutputStream;
import java.util.Base64;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.List;
import org.apache.commons.io.FileUtils;
import com.eka.middleware.service.PropertyManager;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException; 
import com.eka.middleware.auth.AuthAccount;
import java.net.URL;

public final class unLock{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
            dataPipeline.appLog("OPERATION", "unLock");
            System.out.println("**********************"+dataPipeline.getUrlPath());
            String location = dataPipeline.getUrlPath().split("POST/artifact/unlock/")[1];
            dataPipeline.appLog("EXTRACTED_LOCATION_FROM_URL", location);
            System.out.println("++++++++++++++++++++++++++++++++++++"+location);
            String split[] = location.split(Pattern.quote("."));
            String ext = split[split.length - 1];
            String flowRef=location;
            location = PropertyManager.getPackagePath(dataPipeline.rp.getTenant())
                    + location;
            dataPipeline.clear();
            dataPipeline.appLog("LOCATION", location);
            dataPipeline.put("Location", location);
            File file = new File(location);

            AuthAccount authAccount = dataPipeline.getCurrentRuntimeAccount();
            String loggedInUserId = authAccount.getUserId();
            dataPipeline.appLog("LOGGED_IN_USER_ID", loggedInUserId);
            byte[] data = ServiceUtils.readAllBytes(file);
            String json = new String(data);
            Map<String, Object> jsonMap = ServiceUtils.jsonToMap(json);
            Map<String, Object> profile = authAccount.getAuthProfile();
            List<String> userGroups=(List<String>)profile.get("groups");
            String developers=null;
            if(jsonMap.get("developers")!=null)
                developers=(String)jsonMap.get("developers");
            dataPipeline.appLog("DEVELOPER_DATA", "Developers data found in JSON");
            boolean isDeveloper=false;
            if(developers!=null){
                developers=developers+",";
                for(String group: userGroups){
                    if(developers.contains(group+",")){
                        isDeveloper=true;
                        dataPipeline.appLog("DEVELOPER_CHECK", "User is a developer as per group");
                        break;
                    }
                }
            }else{
                isDeveloper=true;
            	dataPipeline.appLog("DEVELOPER_CHECK", "User is considered a developer due to insufficient data");
            }

            dataPipeline.clear();

            if(isDeveloper){
                Object obj=jsonMap.get("latest");
                if(obj==null){
                    jsonMap.put("lockedByUser",null);
                }else{
                    Map<String, Object> version=(Map<String, Object>)jsonMap.get("latest");
                    version.put("lockedByUser",null);
                }
                java.nio.file.Files.write(file.toPath(), ServiceUtils.toJson(jsonMap).getBytes());
                dataPipeline.put("status", "200");
                dataPipeline.put("message", "Resource unlocked successfully.");
                dataPipeline.appLog("UNLOCK_STATUS", "Unlocked");
            }else{
                dataPipeline.clear();
            	dataPipeline.put("status", "403");
            	dataPipeline.put("error", "You don't have permission to unlock this.\nPlease check with your admin and try again.");
            	dataPipeline.appLog("UNLOCK_STATUS", "Access denied.");
            	dataPipeline.setResponseStatus(403);
            }
        } catch (Throwable e) {
            dataPipeline.clear();
            dataPipeline.put("status", "500");
            dataPipeline.put("error", e.getMessage());
            dataPipeline.appLog("UNLOCK_ERROR", e.getMessage());
            dataPipeline.setResponseStatus(500);
            //new SnippetException(dataPipeline,"Failed while saving file", new Exception(e));
        }
	}

}