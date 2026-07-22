package packages.middleware.pub.security.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.auth.AuthAccount;
import java.util.*;
import com.eka.middleware.auth.UserProfileManager;
public final class changePassword{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{
  	String password=dataPipeline.getString("newPassword");
	AuthAccount acc=dataPipeline.getCurrentRuntimeAccount();
    UserProfileManager.updateUser(acc,password.getBytes());
  	dataPipeline.put("status", true);
  	dataPipeline.keyLog(acc.toString(), "password-changed");
}catch(Exception e){
  	AuthAccount acc=dataPipeline.getCurrentRuntimeAccount();
	dataPipeline.clear();
  	dataPipeline.put("error",e.getMessage());
  	dataPipeline.put("status", false);
  	dataPipeline.keyLog(acc.toString(), "changing-password-failed");
    throw new SnippetException(dataPipeline,"Snippet exception in create new user", new Exception(e));
}
	}

}