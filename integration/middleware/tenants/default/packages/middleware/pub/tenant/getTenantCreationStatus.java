package packages.middleware.pub.tenant;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class getTenantCreationStatus{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
dataPipeline.put("status", ServiceUtils.tenantCreationStatus(dataPipeline.getString("uuid")));
	}

}