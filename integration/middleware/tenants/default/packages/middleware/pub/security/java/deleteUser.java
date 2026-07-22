package packages.middleware.pub.security.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.auth.UserProfileManager;
public final class deleteUser{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{
    String userId=dataPipeline.getString("userId");
   
    UserProfileManager.removeUser(userId);
  	dataPipeline.put("status", true);
  	dataPipeline.keyLog(userId, "user-deleted");
}catch(Exception e){
  	String userId=dataPipeline.getString("userId");
	dataPipeline.clear();
  	dataPipeline.put("error",e.getMessage());
  	dataPipeline.put("status", true);
  	dataPipeline.keyLog(userId, "deleting-user-failed");
    throw new SnippetException(dataPipeline,"Snippet exception in create new user", new Exception(e));
}
	}

}