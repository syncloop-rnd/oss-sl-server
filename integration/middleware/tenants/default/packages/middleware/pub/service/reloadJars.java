package packages.middleware.pub.service;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class reloadJars{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
ServiceUtils.reloadCurrentTenantJars();
	}

}