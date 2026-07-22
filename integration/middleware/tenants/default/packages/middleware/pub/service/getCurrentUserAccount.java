package packages.middleware.pub.service;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.auth.AuthAccount;
import com.eka.middleware.auth.db.repository.UsersRepository;
import java.util.*;
public final class getCurrentUserAccount{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  dataPipeline.appLog("OPERATION", "getCUrrentUserAccount");
  AuthAccount authAccount = dataPipeline.getCurrentRuntimeAccount();
  dataPipeline.appLog("EXTRACTED_AUTH_ACCOUNT", authAccount.toString());
  Map<String, Object> profile = authAccount.getAuthProfile();
  dataPipeline.appLog("EXTRACTED_AUTH_PROFILE", profile.toString());

  List<String> groups = (List<String>) profile.get("groups");
  dataPipeline.appLog("EXTRACTED_USER_GROUP", groups.toString());
  if (groups != null) {
    String adminGroup = AuthAccount.STATIC_ADMIN_GROUP;
    dataPipeline.appLog("ADMIN_GROUP", adminGroup);
    String developerGroup = AuthAccount.STATIC_DEVELOPER_GROUP;
    dataPipeline.appLog("DEVELOPER_GROUP", developerGroup);
    if (Collections.frequency(groups, adminGroup) > 1) {
      dataPipeline.appLog("REMOVING_DUPLICATE_GROUP", "Removing duplicate admin group values.");
      groups.remove(adminGroup);
    }
    if (Collections.frequency(groups, developerGroup) > 1) {
      dataPipeline.appLog("REMOVING_DUPLICATE_GROUP", "Removing duplicate developer group values.");
      groups.remove(developerGroup);
    }
  }
  
   Map<String, Object> registeredUser = UsersRepository.getUserRecord(authAccount.getUserId(), null);
  dataPipeline.appLog("REGISTERED_USER_CHECK", String.valueOf(registeredUser));

  if (registeredUser == null || registeredUser.isEmpty()) {
    profile.remove("tenant");
    dataPipeline.appLog("REMOVED_PROFILE_TENANT", "User is not registered in users table.");
  }
  
  dataPipeline.put("profile", profile);
  dataPipeline.appLog("SETTING_PROFILE", "Setting profile data");
  dataPipeline.put("userId", authAccount.getUserId());
  dataPipeline.appLog("SETTING_USER_ID", "Setting user ID");
} catch (Exception e) {
  e.printStackTrace();
  dataPipeline.clear();
  dataPipeline.put("error", e.getMessage());
  dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
  throw new SnippetException(dataPipeline, "Snippet exception", e);
}

	}

}