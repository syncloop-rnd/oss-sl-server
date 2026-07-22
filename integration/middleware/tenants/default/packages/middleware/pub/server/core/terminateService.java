package packages.middleware.pub.server.core;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.service.RuntimePipeline;
import java.util.*;
public final class terminateService{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
 try{
            dataPipeline.appLog("OPERATION","terminateService");
            String sid=dataPipeline.getString("sessionId");
            RuntimePipeline runtimePipeline=RuntimePipeline.getPipeline(sid);
            if(runtimePipeline == null){
                dataPipeline.put("success", false);
              	dataPipeline.put("message", "Service is already in a stopped state.");
                return ;
            }
            dataPipeline.appLog("ACTIVE_SERVICES", "Processing active service");
            Map<String,Object> resourceInfo=new HashMap<String,Object>();
            String serviceName=runtimePipeline.dataPipeLine.getCurrentResourceName();
            resourceInfo.put("serviceFQN",serviceName);
            dataPipeline.appLog("SERVICE_FQN", serviceName);
            String cid=runtimePipeline.dataPipeLine.getCorrelationId();
            resourceInfo.put("cid",cid);
            dataPipeline.appLog("CORRELATION_ID", cid);
            resourceInfo.put("sid",sid);
            dataPipeline.appLog("SESSION_ID", sid);
            String user=runtimePipeline.getUser();
            resourceInfo.put("user",user);
            dataPipeline.appLog("USER", user);
            String createDate=runtimePipeline.getCreateDate().toString();
            resourceInfo.put("createDate",createDate);
            dataPipeline.appLog("CREATE_DATE", createDate);
            String tenantName=runtimePipeline.getTenant().getName();
            resourceInfo.put("tenant",tenantName);
            dataPipeline.appLog("TENANT_NAME", tenantName);
            boolean isActive=!runtimePipeline.isDestroyed();
            resourceInfo.put("isActive",isActive);
            dataPipeline.appLog("IS_ACTIVE", String.valueOf(isActive));
            runtimePipeline.destroy();
            dataPipeline.put("resourceInfo",resourceInfo);
            dataPipeline.put("success", true);
            dataPipeline.appLog("ACTIVE_SERVICES_STATUS", "Processed all active services.");
        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
            dataPipeline.put("success", false);
            dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
            throw new SnippetException(dataPipeline,"Sneppet exception", new Exception(e));
        }		
	}

}