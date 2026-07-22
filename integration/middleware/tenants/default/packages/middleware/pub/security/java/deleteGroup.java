package packages.middleware.pub.security.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.auth.UserProfileManager;
public final class deleteGroup{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{
  	String groupName = dataPipeline.getString("groupName");
    UserProfileManager.removeGroupForTenant(groupName,dataPipeline);
  	dataPipeline.put("status", true);
  	dataPipeline.keyLog(groupName, "group-deleted");
}catch(Exception e){
  	String groupName = dataPipeline.getString("groupName");
	dataPipeline.clear();
  	dataPipeline.put("error",e.getMessage());
  	dataPipeline.put("status", false);
  	dataPipeline.keyLog(groupName, "deleting-group-failed");
    throw new SnippetException(dataPipeline,"Snippet exception in create new user", new Exception(e));
}
	}

}