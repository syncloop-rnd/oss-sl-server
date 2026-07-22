package packages.middleware.pub.service;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class debugLog{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
dataPipeline.appLog("OPERATION", "debugLog");
String msg=dataPipeline.getString("msg");
dataPipeline.appLog("MSG", msg);
String log=dataPipeline.getString("log");
dataPipeline.appLog("LOG", log);

if(msg!=null)
	dataPipeline.log(msg);
	dataPipeline.appLog("LOG_ENTRY", msg);
if(log!=null)
	dataPipeline.log(log);
	dataPipeline.appLog("LOG_ENTRY", log);
	}

}