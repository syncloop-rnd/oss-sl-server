package packages.onboarding.services;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.test.SyncloopAPI;
import com.eka.middleware.auth.AuthAccount;
import com.eka.middleware.auth.UserProfileManager;
public final class updateInfoVerifiedUser{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{
            dataPipeline.appLog("OPERATION", "UPDATING_ACCOUNT_INFO");
            String userId=dataPipeline.getString("email");
            String password=null;
            String name=dataPipeline.getString("name");
            String email=dataPipeline.getString("email");

            dataPipeline.appLog("userId", userId);
            dataPipeline.appLog("name", name);
            dataPipeline.appLog("email", email);

            AuthAccount acc= UserProfileManager.getAccount(userId, null);
            Object verificationSecret = acc == null || acc.getAuthProfile() == null
                    ? null
                    : acc.getAuthProfile().get("verification_secret");
            Object status = acc == null || acc.getAuthProfile() == null
                    ? null
                    : acc.getAuthProfile().get("status");
            String secret = dataPipeline.getString("secret");
            if ((verificationSecret == null || verificationSecret.toString().isBlank()) && "1".equals(String.valueOf(status))) {
                dataPipeline.put("status", true);
                dataPipeline.appLog("status", "true");
                dataPipeline.appLog("message", "User already verified");
                return ;
            }
            if (verificationSecret == null || secret == null || !verificationSecret.toString().equals(secret)) {
                dataPipeline.put("status", false);
                dataPipeline.appLog("status", "false");
                dataPipeline.appLog("error", "Invalid Secret");
                return ;
            }
            acc.addProfileAttribute("name", name);
            acc.addProfileAttribute("verification_secret", "");
            acc.addProfileAttribute("phone_number", dataPipeline.getString("phone_number"));
            acc.addProfileAttribute("current_job_role", dataPipeline.getString("current_job_role"));

            UserProfileManager.updateUser(acc,null == password ? null : password.getBytes(), "1");
            dataPipeline.put("status", true);
            dataPipeline.appLog("status", "true");
            dataPipeline.appLog("phone_number", dataPipeline.getString("phone_number"));
            dataPipeline.appLog("current_job_role", dataPipeline.getString("current_job_role"));
        }catch(Exception e){
            e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
            dataPipeline.put("status", false);
            dataPipeline.appLog("status", "false");
            dataPipeline.appLog("error", e.getMessage());
            throw new SnippetException(dataPipeline,"Snippet exception in create new user", new Exception(e));
        }
	}

}