package packages.middleware.pub.service.utils;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class checkIfTenantExists{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    dataPipeline.appLog("OPERATION", "findTenantExistence");
    String tenantName = dataPipeline.getString("tenantName");
    Boolean result = ServiceUtils.isTenantExist(tenantName);
   
    if (!result) {
        dataPipeline.put("status", "200");
        dataPipeline.put("message", "Tenant does not exist.");
        dataPipeline.appLog("TENANT_NON_EXISTENCE", "Tenant does not exist: " + tenantName);
    } else {
        dataPipeline.put("status", "404");
        dataPipeline.put("error", "Tenant already exists.");
        dataPipeline.setResponseStatus(404);
        dataPipeline.appLog("TENANT_EXISTENCE", "Tenant exists: " + tenantName);
    }
} catch (Exception e) {
    dataPipeline.clear();
    dataPipeline.put("status", "500");
    dataPipeline.put("error", e.getMessage());
    dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
    dataPipeline.setResponseStatus(500);
    throw new SnippetException(dataPipeline, "Failed while checking tenant existence", e);
}

	}

}