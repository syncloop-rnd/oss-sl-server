package packages.middleware.pub.tenant;
import com.eka.middleware.auth.AuthAccount;
import com.eka.middleware.licensing.LicenseFile;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringUtils;
public final class createTenantForCurrentUser{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    String displayName = StringUtils.trimToEmpty(dataPipeline.getString("tenantName"));
    String licenseCredits = StringUtils.trimToEmpty(dataPipeline.getString("licenseCredits"));

    if (StringUtils.isBlank(displayName)) {
        displayName = StringUtils.trimToEmpty(dataPipeline.getString("name"));
    }
    if (StringUtils.isBlank(displayName)) {
        throw new RuntimeException("Tenant name is required.");
    }

    java.time.Instant now = java.time.Instant.now();
    long epochNano = now.getEpochSecond() * 1_000_000_000L + now.getNano();
    String tenantName = epochNano + "";

    AuthAccount account = dataPipeline.getCurrentRuntimeAccount();
    if (account == null) {
        throw new RuntimeException("Authenticated user account not found.");
    }

    String response = ServiceUtils.initNewTenantForExistingUser(tenantName, displayName, account);

    if (!"Done".equalsIgnoreCase(response)) {
        dataPipeline.put("status", false);
        dataPipeline.put("message", response);
        return;
    }

    if (StringUtils.isNotBlank(licenseCredits)) {
        com.eka.middleware.pub.license.GenerateLicense.generateAndWriteLicense(
            tenantName,
            "Enterprise License $" + licenseCredits,
            LicenseFile.LicenseValidityType.NO_LIMIT,
            0,
            0
        );
    }

    dataPipeline.put("status", true);
    dataPipeline.put("message", response);
    dataPipeline.put("displayName", displayName);
    dataPipeline.put("redirectUrl", "/middleware/pub/server/ui/tenant/selectTenant.html");
  	dataPipeline.put("tenantNameAvailable", true);

} catch (Exception e) {
    dataPipeline.clear();

    String error = e.getMessage();
    if (StringUtils.isBlank(error) && e.getCause() != null) {
        error = e.getCause().getMessage();
    }

    dataPipeline.put("status", false);
    dataPipeline.put("error", error);

    if (StringUtils.containsIgnoreCase(error, "Tenant name is not available")) {
        dataPipeline.put("tenantNameAvailable", false);
        return;
    }

    throw new SnippetException(
        dataPipeline,
        "Snippet exception in tenant operation",
        new Exception(e)
    );
}
	}

}