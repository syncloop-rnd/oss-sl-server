package packages.middleware.pub.server.browse;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class logOut{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
	dataPipeline.appLog("OPERATION", "logOut");
	dataPipeline.clearUserSession();
	dataPipeline.clear();
	dataPipeline.put("msg","Successfully logged out.");
	dataPipeline.appLog("MESSAGE","Successfully logged out.");
	}

}