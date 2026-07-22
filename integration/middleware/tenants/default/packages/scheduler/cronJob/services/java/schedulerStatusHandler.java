package packages.scheduler.cronJob.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.scheduling.JobScheduler;
public final class schedulerStatusHandler{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
	try {
        String id = dataPipeline.getString("id");
        String enabled = dataPipeline.getString("enabled");
        String job_name = dataPipeline.getString("job_name");
        String serviceFqn = dataPipeline.getString("serviceFqn");
        String cronExpression = dataPipeline.getString("cronExpression");
        JobScheduler.enableOrDisableScheduler(id,enabled,serviceFqn,cronExpression,job_name,dataPipeline);
  }  catch (Exception e) {
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }       
	}

}