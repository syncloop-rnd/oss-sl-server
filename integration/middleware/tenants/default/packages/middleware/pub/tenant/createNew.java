package packages.middleware.pub.tenant;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.auth.AuthAccount;
import java.util.*;
import org.apache.commons.lang3.StringUtils;
import com.eka.middleware.licensing.LicenseFile;
import java.time.Instant;

public final class createNew{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
		try {
          
          	Instant now = Instant.now();
          	long epochSecond = now.getEpochSecond(); 
        	int nanoAdjustment = now.getNano();    
          	long epochNano = epochSecond * 1_000_000_000L + nanoAdjustment;

            dataPipeline.appLog("OPERATION", "createNew");
            String tenantName = epochNano + "";//dataPipeline.getString("tenantName");
            dataPipeline.appLog("TENANT_NAME", tenantName);
            String licenseCredits=dataPipeline.getString("licenseCredits");
            dataPipeline.appLog("LICENSE_CREDITS", licenseCredits);
            String redirectRequest = dataPipeline.getString("redirect");
            dataPipeline.appLog("REDIRECT_REQUEST", redirectRequest);
            AuthAccount acc = dataPipeline.getCurrentRuntimeAccount();
            dataPipeline.appLog("AUTH_ACCOUNT", acc.toString());
            dataPipeline.appLogProfile(acc);
          	acc.setUuid(dataPipeline.getString("lookupID"));
            String resp = ServiceUtils.initNewTenant(tenantName, acc, "");
            dataPipeline.appLog("INIT_TENANT_RESULT", resp);

            if (StringUtils.isNotBlank(licenseCredits)) {
                dataPipeline.appLog("LICENSE_CREDITS_NOT_BLANK", "License credits are not blank.");
                dataPipeline.appLog("LICENSE_GENERATED", "Enterprise License generated " + licenseCredits);

            }

            dataPipeline.put("resp","server: "+resp);
            dataPipeline.appLog("RESPONSE ", "Server " + resp);
            dataPipeline.log(resp);
            //dataPipeline.rp.redirectRequest(redirectRequest);
            dataPipeline.appLog("REDIRECTIN_REQUEST", redirectRequest);
          	dataPipeline.put("status", true);

        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
            dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
            dataPipeline.put("status", false);
            dataPipeline.appLog("STATUS", "false");

            //throw new SnippetException(dataPipeline,"Snippet exception in create new user", new Exception(e));
        }
	}

}