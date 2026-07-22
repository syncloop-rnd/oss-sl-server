package packages.onboarding.services;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.auth.AuthAccount;
import java.util.*;
import com.eka.middleware.auth.UserProfileManager;
import org.apache.commons.lang3.StringUtils;
import com.eka.middleware.licensing.LicenseFile;
import java.time.Instant;

public final class addUserEmailPassword{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{
            dataPipeline.appLog("OPERATION", "ADDING_NEW_PASSWORD_USER");
            String userId=dataPipeline.getString("email");
  			String licenseCredits=dataPipeline.getString("licenseCredits");
            if (UserProfileManager.isUserExist(userId)) {
                //throw new Exception("User already exists: " + userId);
                dataPipeline.put("status", false);
                dataPipeline.put("message", "User already exists: " + userId);
                dataPipeline.appLog("status", "false");
                dataPipeline.appLog("message", "User already exists: " + userId);
                return ;
            }
            String name="User";
            String password=dataPipeline.getString("password");
            String email=dataPipeline.getString("email");
            AuthAccount acc=new AuthAccount(userId);
            List<String> groups = new ArrayList<>();
            Boolean isAdmin=true;
            Boolean isDeveloper=true;
            if(isAdmin && isDeveloper!=true)
                groups.add(AuthAccount.STATIC_ADMIN_GROUP);
            else
            if(isDeveloper){
                groups.add(AuthAccount.STATIC_ADMIN_GROUP);
                groups.add(AuthAccount.STATIC_DEVELOPER_GROUP);
            }else
                groups.add("guest");
  
  			Instant now = Instant.now();
          	long epochSecond = now.getEpochSecond(); 
        	int nanoAdjustment = now.getNano();    
          	long epochNano = epochSecond * 1_000_000_000L + nanoAdjustment;
  			String tenantName = epochNano + "";
  
            String secret = UUID.randomUUID().toString();
            acc.addProfileAttribute("groups",groups);
            acc.addProfileAttribute("tenant", tenantName);
            acc.addProfileAttribute("email",email);
            acc.addProfileAttribute("name",name);
            acc.addProfileAttribute("verification_secret", secret);
            //acc.addProfileAttribute("password",password);
            String resp=ServiceUtils.initNewTenant(tenantName, acc, password);
            UserProfileManager.updateUser(acc, password.getBytes(), "0");

            dataPipeline.put("status", true);
            dataPipeline.put("message", resp);
            dataPipeline.put("secret", secret);
            dataPipeline.put("tenantName", tenantName);
			
  			dataPipeline.appLog("OPERATION", "ADDING_NEW_PASSWORD_USER");
            dataPipeline.appLog("status", "true");
            dataPipeline.appLog("message", resp);
            dataPipeline.appLog("TENANT", tenantName);
  
  			if (StringUtils.isNotBlank(licenseCredits)) {
				com.eka.middleware.pub.license.GenerateLicense.generateAndWriteLicense(tenantName, "Enterprise License $" + licenseCredits , 
						LicenseFile.LicenseValidityType.NO_LIMIT, 0, 0);
        	}
  
        }catch(Exception e){
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
            dataPipeline.put("status", false);

            dataPipeline.appLog("status", "false");
            dataPipeline.appLog("message", e.getMessage());
            
            throw new SnippetException(dataPipeline,"Snippet exception in create new user", new Exception(e));
        }
	}

}