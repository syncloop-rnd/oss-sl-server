package packages.middleware.pub.server.mcp.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.*;
public final class runAPI{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
	try {
            Map<String,Object> arguments = dataPipeline.getAsMap("arguments");
      		String fqn=dataPipeline.getString("fqn");
            String response=ServiceUtils.runAPI(dataPipeline.rp.getTenant().getName(),fqn, arguments, dataPipeline, null, null);
			dataPipeline.put("response",response);
            dataPipeline.put("type","text");
            dataPipeline.put("status","success");
        } catch (Exception e) {
      		e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
            dataPipeline.put("status","failed");
      		dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
            new SnippetException(dataPipeline,"SnippetException exception", e);
        }
	}

}