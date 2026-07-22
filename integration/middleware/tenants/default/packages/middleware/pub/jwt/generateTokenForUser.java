package packages.middleware.pub.jwt;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.Map;

import org.pac4j.core.profile.CommonProfile;

import com.eka.middleware.auth.AuthAccount;
import com.eka.middleware.auth.UserProfileManager;
import com.eka.middleware.auth.manager.JWT;
public final class generateTokenForUser{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    String emailId = dataPipeline.getString("emailId");
    String expirationTimeStr = dataPipeline.getString("expiration_time");

    if (emailId == null || emailId.trim().length() == 0) {
        throw new Exception("emailId is required.");
    }

    if (expirationTimeStr == null || expirationTimeStr.trim().length() == 0) {
        throw new Exception("expiration_time is required.");
    }

    emailId = emailId.trim();
    expirationTimeStr = expirationTimeStr.trim();

    int expirationTime = Integer.parseInt(expirationTimeStr);

    if (expirationTime <= 0) {
        throw new Exception("expiration_time must be greater than 0.");
    }

    String tenantName = dataPipeline.rp.getTenant().getName();

    AuthAccount account = UserProfileManager.getAccount(emailId, null, tenantName);

    if (account == null || account.getAuthProfile() == null) {
        throw new Exception("User not found for emailId: " + emailId);
    }

    String userId = account.getUserId();

    CommonProfile profile = new CommonProfile();
    profile.setId(userId);

    Map<String, Object> authProfile = account.getAuthProfile();

    for (Map.Entry<String, Object> entry : authProfile.entrySet()) {
        if (entry.getKey() != null && entry.getValue() != null) {
            profile.addAttribute(entry.getKey(), entry.getValue());
        }
    }

    profile.addAttribute("tenant", tenantName);

    String tokenKey = "user-token-" + System.currentTimeMillis();

    String token = JWT.generateForTenant(
            tenantName,
            userId,
            profile,
            tokenKey,
            expirationTime
    );

    dataPipeline.put("status", true);
    dataPipeline.put("userId", userId);
    dataPipeline.put("tenant", tenantName);
    dataPipeline.put("token_key", tokenKey);
    dataPipeline.put("token", token);

    dataPipeline.keyLog(emailId, "token-generated-for-user");

} catch (Exception e) {
    e.printStackTrace();
    dataPipeline.clear();
    dataPipeline.put("error", e.getMessage());
    dataPipeline.put("status", false);
    dataPipeline.keyLog("generate-token-for-user", "failed");

    throw new SnippetException(
            dataPipeline,
            "Snippet exception while generating token for user",
            new Exception(e)
    );
}
	}

}