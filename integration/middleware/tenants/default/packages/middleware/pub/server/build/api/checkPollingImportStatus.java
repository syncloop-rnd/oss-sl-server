package packages.middleware.pub.server.build.api;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.Map;
import com.eka.middleware.pub.util.AppUpdate;
public final class checkPollingImportStatus{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
String token = dataPipeline.getAsString("token");
Map<String, Object> result = AppUpdate.checkPollingImportStatus(dataPipeline, token);
dataPipeline.put("response", result);
	}

}