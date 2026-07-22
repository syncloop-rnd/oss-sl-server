package packages.middleware.pub.service.utils;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class redirect{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
dataPipeline.appLog("OPERATION", "redirect");
String location=dataPipeline.getString("location");
dataPipeline.appLog("LOCATION", location);
dataPipeline.rp.redirectRequest(location);
	}

}