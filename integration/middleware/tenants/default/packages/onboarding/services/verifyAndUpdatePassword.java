package packages.onboarding.services;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.auth.UserProfileManager;
import com.eka.middleware.auth.AuthAccount;
public final class verifyAndUpdatePassword{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
        dataPipeline.appLog("OPERATION", "GENERATE_PASSWORD");
            String userId=dataPipeline.getString("email");
            String password=dataPipeline.getString("password");
               AuthAccount acc= UserProfileManager.getAccount(userId, null);
            if (!acc.getAuthProfile().get("verification_secret").equals(dataPipeline.getString("secret"))) {
                dataPipeline.put("status", false);
                dataPipeline.appLog("status", "false");
                dataPipeline.appLog("error", "Invalid Secret");
                return ;
            }else{
              	acc.addProfileAttribute("verification_secret", "");
                UserProfileManager.updateUser(acc, password.getBytes(), "1");
                dataPipeline.put("status", true);
                dataPipeline.appLog("status", "true");
            }
        }catch(Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
            dataPipeline.put("status", false);
            dataPipeline.appLog("status", "false");
            dataPipeline.appLog("error", e.getMessage());

            throw new SnippetException(dataPipeline,"Snippet exception in updating password", new Exception(e));
        }
	}

}