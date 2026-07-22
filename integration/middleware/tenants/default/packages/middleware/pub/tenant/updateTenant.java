package packages.middleware.pub.tenant;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.auth.SLAccessManager;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringUtils;
import java.util.Map;

public final class updateTenant{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    String tenantIdInput = StringUtils.trimToEmpty(dataPipeline.getString("tenantId"));
    String displayName = StringUtils.trimToEmpty(dataPipeline.getString("tenantName"));

    if (StringUtils.isBlank(tenantIdInput)) {
        throw new RuntimeException("Tenant ID is required.");
    }
    if (StringUtils.isBlank(displayName)) {
        throw new RuntimeException("Tenant name is required.");
    }

    long tenantId = Long.parseLong(tenantIdInput);
    Map<String, Object> tenant = SLAccessManager.updateTenant(tenantId, displayName);

    dataPipeline.put("status", true);
    dataPipeline.put("message", "Done");
    dataPipeline.put("tenant", tenant);
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