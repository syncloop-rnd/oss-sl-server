package packages.middleware.pub.security.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.auth.AuthAccount;
import java.util.*;
import com.eka.middleware.auth.UserProfileManager;
public final class addUser{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{
    String userId=dataPipeline.getString("userId");
  	String name=dataPipeline.getString("name");
    String password=dataPipeline.getString("password");
  	String email=dataPipeline.getString("email");
    AuthAccount acc=new AuthAccount(userId);
    List<String> groups=(List<String>)dataPipeline.get("groups");
    Boolean isAdmin=dataPipeline.getAsBoolean("isAdmin");
    Boolean isDeveloper=dataPipeline.getAsBoolean("isDeveloper");
  	if(isAdmin && isDeveloper!=true){
    	groups.add(AuthAccount.STATIC_ADMIN_GROUP);
  		dataPipeline.keyLog(name, "admin-user-added");
    }
  	else{
    if(isDeveloper){
        groups.add(AuthAccount.STATIC_ADMIN_GROUP);
        groups.add(AuthAccount.STATIC_DEVELOPER_GROUP);
      	dataPipeline.keyLog(name, "developer-user-added");
    }else
      groups.add("guest");
    acc.addProfileAttribute("groups",groups);
    acc.addProfileAttribute("tenant", dataPipeline.rp.getTenant().getName());
  	acc.addProfileAttribute("email",email);
  	acc.addProfileAttribute("name",name);
  	acc.addProfileAttribute("password",password);
    UserProfileManager.addUserForTenant(acc,dataPipeline);
  	UserProfileManager.updateUser(acc, password.getBytes());
   	dataPipeline.put("status", true);
  	dataPipeline.keyLog("guest", "user-added");
    }
  
}catch(Exception e){
  e.printStackTrace();
	dataPipeline.clear();
  	dataPipeline.put("error",e.getMessage());
  	dataPipeline.put("status", false);
  	dataPipeline.keyLog("add-user", "adding-user-failed");
    //throw new SnippetException(dataPipeline,"Snippet exception in create new user", new Exception(e));
}
	}

}