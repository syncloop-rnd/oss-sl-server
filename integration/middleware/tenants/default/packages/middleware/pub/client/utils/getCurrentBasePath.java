package packages.middleware.pub.client.utils;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class getCurrentBasePath{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
dataPipeline.put("uri", dataPipeline.getCurrentURI());
dataPipeline.put("remoteIpAddr", dataPipeline.getRemoteIpAddr());
	}

}