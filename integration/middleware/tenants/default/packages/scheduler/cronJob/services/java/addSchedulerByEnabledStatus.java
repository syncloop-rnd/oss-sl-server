package packages.scheduler.cronJob.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.scheduling.JobScheduler;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
public final class addSchedulerByEnabledStatus{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {

      Map<String,Object> map= (Map<String,Object>)dataPipeline.get("inputDocList");
      String enabled =(String) map.get("enabled");
      Object id = map.get("databaseId");
      String idString = id != null ? id.toString() : null;
      String jobName =(String) map.get("jobName");
      String serviceFqn =(String) map.get("serviceFqn");
      String cronExpression =(String) map.get("cronExpression");
      if (enabled != null && enabled.equalsIgnoreCase("Y")) {
        JobScheduler.deleteJob(idString,dataPipeline);
        JobScheduler.addJob(idString,serviceFqn,cronExpression,jobName,dataPipeline);
      }
} catch (Exception e) {
    throw new SnippetException(dataPipeline, "Snippet exception", e);
}

	}

}