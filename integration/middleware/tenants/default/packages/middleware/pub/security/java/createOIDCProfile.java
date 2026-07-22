package packages.middleware.pub.security.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.auth.Security;
import java.util.*;
public final class createOIDCProfile{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{
  Map<String,Object> profile=dataPipeline.getAsMap("oidcProfile");
  String msg=Security.addExternalOIDCAuthorizationServer(profile,(String)profile.get("loginHandlerAPI"),dataPipeline);
  dataPipeline.put("msg",msg);
  dataPipeline.keyLog("OIDC_Msg", msg);
  
} catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
  		dataPipeline.keyLog("OIDC", "creating-OIDC-Profile-failed");
    	throw new SnippetException(dataPipeline,"Snippet exception in createOIDCProfile service", new Exception(e));
  }
	}

}