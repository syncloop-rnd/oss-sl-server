package packages.middleware.pub.server.core;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.service.RuntimePipeline;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.*;
public final class listCurrentRunningServices{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{
  dataPipeline.appLog("OPERATION","listCurrentRunningServices");
  List<RuntimePipeline> activeServices=RuntimePipeline.listActivePipelines(dataPipeline);
  dataPipeline.appLog("ACTIVE_SERVICES_COUNT", String.valueOf(activeServices.size()));
  List<Map<String,Object>> activeResources=new ArrayList<Map<String,Object>>();
  dataPipeline.appLog("ACTIVE_RESOURCES_INITIALIZED", "Active resources list initialized.");
  for (RuntimePipeline runtimePipeline : activeServices) {
    dataPipeline.appLog("ACTIVE_SERVICES", "Processing active service");
	Map<String,Object> resourceInfo=new HashMap<String,Object>();
    String serviceName=runtimePipeline.dataPipeLine.getCurrentResourceName();
    resourceInfo.put("serviceFQN",serviceName);
    dataPipeline.appLog("SERVICE_FQN", serviceName);
	String cid=runtimePipeline.dataPipeLine.getCorrelationId();
    resourceInfo.put("cid",cid);
    dataPipeline.appLog("CORRELATION_ID", cid);
	String sid=runtimePipeline.dataPipeLine.getSessionId();
    resourceInfo.put("sid",sid);
    dataPipeline.appLog("SESSION_ID", sid);
	String user=runtimePipeline.getUser();
    resourceInfo.put("user",user);
    dataPipeline.appLog("USER", user);
	
    Date createDate=runtimePipeline.getCreateDate();
    if(createDate!=null){
      String createDateStr=createDate.toString();
      Instant startInstant = createDate.toInstant();
      Instant nowInstant = Instant.now();
      Duration duration = Duration.between(startInstant, nowInstant);
      resourceInfo.put("createDate",createDateStr +" ("+duration.toMillis()+"ms)");
      dataPipeline.appLog("CREATE_DATE", createDateStr);
    }
    String tenantName=runtimePipeline.getTenant().getName();
    resourceInfo.put("tenant",tenantName);
    dataPipeline.appLog("TENANT_NAME", tenantName);
    boolean isActive=!runtimePipeline.isDestroyed();
    resourceInfo.put("isActive",isActive);
    dataPipeline.appLog("IS_ACTIVE", String.valueOf(isActive));
    activeResources.add(resourceInfo);
  }
  dataPipeline.put("activeServices",activeResources);
  dataPipeline.appLog("ACTIVE_SERVICES_STATUS", "Processed all active services.");
  } catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
  		dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
    	throw new SnippetException(dataPipeline,"Sneppet exception", new Exception(e));
	}
	}

}