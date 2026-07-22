package packages.middleware.pub.security.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.auth.AuthAccount;
import java.util.*;
import com.eka.middleware.auth.UserProfileManager;
public final class updateUser{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{
            String userId=dataPipeline.getString("userId");
            String password=dataPipeline.getString("password");
            String name=dataPipeline.getString("name");
            String email=dataPipeline.getString("email");
            AuthAccount acc=new AuthAccount(userId);
            List<String> groups=(List<String>)dataPipeline.get("groups");
            Boolean isAdmin=groups.contains("administrators");
            Boolean isDeveloper=groups.contains("developers");
            if(isAdmin && isDeveloper!=true){
                groups.add(AuthAccount.STATIC_ADMIN_GROUP);
                dataPipeline.keyLog(userId, "user-updated-to-Admin");
            }
            else{
                if(isDeveloper){
                    groups.add(AuthAccount.STATIC_ADMIN_GROUP);
                    groups.add(AuthAccount.STATIC_DEVELOPER_GROUP);
                    dataPipeline.keyLog(userId, "user-updated-to-Developer");
                }else
                    groups.add("guest");
                acc.addProfileAttribute("groups", groups);
                acc.addProfileAttribute("email", email);
                acc.addProfileAttribute("name", name);
                acc.addProfileAttribute("tenant", dataPipeline.rp.getTenant().getName());
                UserProfileManager.updateUser(acc,null == password ? null : password.getBytes());
                dataPipeline.put("status", true);
                dataPipeline.keyLog(userId, "user-updated-to-Guest");
            }

        }catch(Exception e){
  			e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
            dataPipeline.put("status", true);
            dataPipeline.keyLog("UpdatingUser", "Failed");
            throw new SnippetException(dataPipeline,"Snippet exception in create new user", new Exception(e));
        }
	}

}