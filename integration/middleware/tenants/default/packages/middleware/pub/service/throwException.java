package packages.middleware.pub.service;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.Map;
public final class throwException{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
dataPipeline.appLog("OPERATION", "throwException");
String msg=dataPipeline.getString("msg");
dataPipeline.appLog("SERVICE_MESSAGE",msg);
String code=dataPipeline.getString("code");
dataPipeline.appLog("SERVICE_CODE",code);
Map<String, Object> meta = (Map<String, Object>) dataPipeline.get("meta");
dataPipeline.appLog("META_STATUS", "Meta data accessed");

if(msg==null)
  msg="Default exception";
throw new SnippetException(dataPipeline,"From Service: " + msg, new Exception(msg), meta, code);
	}

}