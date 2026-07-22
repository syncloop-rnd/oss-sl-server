package packages.middleware.pub.jwt;
import com.eka.middleware.auth.AuthAccount;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;

import java.util.Map;
public final class getIdentifier{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {

            AuthAccount authAccount = dataPipeline.getCurrentRuntimeAccount();
            Map<String, Object> profiles = authAccount.getAuthProfile();
  			dataPipeline.put("profiles", profiles);

            Object UUID = profiles.get("UUID");

            if (null == UUID) {
                dataPipeline.put("UUID", null);
            } else {
                dataPipeline.put("UUID", UUID.toString());
            }
  
            
        } catch (Exception e) {
            dataPipeline.put("status", "error");
            throw new SnippetException(dataPipeline, "Snippet exception in reset password", new Exception(e));
        }
	}

}