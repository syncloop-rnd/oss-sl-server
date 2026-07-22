package packages.onboarding.services;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.auth.UserProfileManager;
import com.eka.middleware.auth.AuthAccount;
import java.util.UUID;
import java.util.Map;
public final class addVerficationCode{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{
    String userId=dataPipeline.getString("email");
   AuthAccount acc= UserProfileManager.getAccount(userId, null);
  	if (!UserProfileManager.isUserExist(userId)) {
      	dataPipeline.put("status", false);
   		dataPipeline.put("message", "User does not exist.");
      return ;
	}
  else{
  	String secret = UUID.randomUUID().toString();
    acc.addProfileAttribute("verification_secret", secret);
    UserProfileManager.updateVerificationSecret(userId, secret);
  	dataPipeline.put("status", true);
  	dataPipeline.put("verification_secret", secret);
    dataPipeline.put("message", "Verification code has been sent to the user");

  }
    
}catch(Exception e){
	dataPipeline.clear();
  	dataPipeline.put("error",e.getMessage());
  	dataPipeline.put("status", false);
    throw new SnippetException(dataPipeline,"Snippet exception in creating verification secret for forgotten password", new Exception(e));
}




	}

}