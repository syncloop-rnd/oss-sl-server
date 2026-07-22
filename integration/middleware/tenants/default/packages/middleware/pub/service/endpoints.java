package packages.middleware.pub.service;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.*;
import com.eka.middleware.template.Tenant;
public final class endpoints{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{
  dataPipeline.appLog("OPERATION", "endpoints");
  String keyword=dataPipeline.getString("keyword");
  dataPipeline.appLog("KEYWORD", keyword);
  String tenantName = dataPipeline.getString("tenantName");
  Tenant tenant = Tenant.getTenant(tenantName);
  List<String> endpointList=ServiceUtils.searchEndpoints(keyword,tenant);
  String[] endpoints=endpointList.toArray(new String[endpointList.size()]);
  dataPipeline.put("endpoints",endpoints);
  dataPipeline.appLog("FOUND_ENDPOINTS", "Successfully found endpoints");
  } 
catch (Exception e) {
	dataPipeline.clear();
  	dataPipeline.put("error",e.getMessage());
  	dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
    throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}