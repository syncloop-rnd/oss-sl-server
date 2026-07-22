package packages.middleware.pub.security.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.auth.UserProfileManager;
import java.util.*;
public final class getGroups{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{
    List<String> groups = UserProfileManager.getGroupsForTenant(dataPipeline);
  	dataPipeline.put("groups", groups);
    dataPipeline.keyLog("Groups", "Fetched-succcessfully");
}catch(Exception e){
	dataPipeline.clear();
  	dataPipeline.put("error",e.getMessage());
  	dataPipeline.keyLog("Groups", "Fetching-failed");
    throw new SnippetException(dataPipeline,"Snippet exception in create new user", new Exception(e));
}
	}

}