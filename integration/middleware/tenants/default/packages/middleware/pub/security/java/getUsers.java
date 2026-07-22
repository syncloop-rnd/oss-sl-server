package packages.middleware.pub.security.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.auth.UserProfileManager;
import java.util.*;
import com.eka.middleware.template.Tenant;
public final class getUsers{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{
    Map<String, Object> users = UserProfileManager.getUsers(dataPipeline);
  	
  	dataPipeline.put("users", users);
  	dataPipeline.keyLog("Users", "Fetched-successfully");
}catch(Exception e){
	dataPipeline.clear();
  	dataPipeline.put("error",e.getMessage());
  	dataPipeline.keyLog("Users", "Fetching-failed");
    throw new SnippetException(dataPipeline,"Snippet exception in create new user", new Exception(e));
}
	}

}