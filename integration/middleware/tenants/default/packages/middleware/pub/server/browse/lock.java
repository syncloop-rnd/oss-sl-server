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
public final class lock{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{
			//System.out.println("**********************"+dataPipeline.getUrlPath());
  			dataPipeline.appLog("OPERATION", "lock");
			String location = dataPipeline.getUrlPath().split("POST/artifact/lock/")[1];
  			dataPipeline.appLog("EXTRACTED_LOCATION_FROM_URL",location);
			//System.out.println("++++++++++++++++++++++++++++++++++++"+location);
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
            //String consumers="";
            String developers=null;
            if(jsonMap.get("developers")!=null)
             	developers=(String)jsonMap.get("developers");
  				dataPipeline.appLog("DEVELOPER_DATA", "Developers data found in JSON");
  			boolean isDeveloper=false;
            if(developers!=null && developers.trim().length()>2){
              developers=developers+",";
              for(String group: userGroups){
                   if(developers.contains(group+",")){
                     isDeveloper=true;
                     dataPipeline.appLog("DEVELOPER_CHECK", "User is a developer as per group");
                     break;
                   }
              }
            }else
              isDeveloper=true;
  			dataPipeline.appLog("DEVELOPER_CHECK", "User is considered a developer due to insufficient data");
  			
  			Object obj=jsonMap.get("latest");
  			Object lockedByUser=null;
  			if(obj==null){
                lockedByUser=jsonMap.get("lockedByUser");
                if(lockedByUser==null){
            		jsonMap.put("lockedByUser",loggedInUserId);
                	lockedByUser=loggedInUserId;
                }
            }else{
            	Map<String, Object> version=(Map<String, Object>)jsonMap.get("latest");
              	lockedByUser=version.get("lockedByUser");
              	if(lockedByUser==null){
            		version.put("lockedByUser",loggedInUserId);
                	lockedByUser=loggedInUserId;
                }
            }
			
			dataPipeline.clear();
  			if (lockedByUser != null && !loggedInUserId.equals(lockedByUser)) {
                dataPipeline.put("status", "403");
                dataPipeline.put("error", "Locked by another user: '" + lockedByUser + "'");
                dataPipeline.setResponseStatus(403);
                dataPipeline.appLog("RESOURCE_LOCKED_BY_ANOTHER_USER", String.valueOf(lockedByUser));
            } else if (isDeveloper) {
                java.nio.file.Files.write(file.toPath(), ServiceUtils.toJson(jsonMap).getBytes());
                dataPipeline.put("status", "200");
                dataPipeline.put("message", "Resource locked successfully.");
                dataPipeline.appLog("RESOURCE_LOCKED_SUCCESS", "Resource locked successfully.");
            } else {
                dataPipeline.put("status", "403");
                dataPipeline.put("error", "Please ask the owner to add you to the developers group.");
                dataPipeline.setResponseStatus(403);
                dataPipeline.appLog("STATUS_ACCESS_DENIED", "User is not in the developers group.");
            }
		} catch (Throwable e) {
			  dataPipeline.clear();
              dataPipeline.put("status", "500");
              dataPipeline.put("error", e.getMessage());
              dataPipeline.setResponseStatus(500);
              dataPipeline.appLog("LOCK_ERROR", e.getMessage());
              //new SnippetException(dataPipeline, "Failed while saving file", new Exception(e));

		}
	}

}