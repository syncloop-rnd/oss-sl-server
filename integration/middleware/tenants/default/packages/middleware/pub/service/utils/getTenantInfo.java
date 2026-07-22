package packages.middleware.pub.service.utils;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.template.Tenant;
public final class getTenantInfo{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{

dataPipeline.appLog("OPERATION","getTenantInfo");
Tenant tenant = dataPipeline.rp.getTenant();
dataPipeline.put("tenantName", tenant.getName());
dataPipeline.appLog("TENANT_NAME", tenant.getName());
	}

}