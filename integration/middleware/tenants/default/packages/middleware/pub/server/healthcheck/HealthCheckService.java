package packages.middleware.pub.server.healthcheck;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class HealthCheckService{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{

dataPipeline.put("numberOfTenantsPending", com.eka.middleware.server.MiddlewareServer.getPendingTenants());

	}

}