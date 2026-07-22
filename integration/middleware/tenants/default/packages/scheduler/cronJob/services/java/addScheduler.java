package packages.scheduler.cronJob.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.scheduling.JobScheduler;
public final class addScheduler{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  
  if (!"Y".equalsIgnoreCase(dataPipeline.getString("enabled"))) {
            return ;
        }
 
  	JobScheduler.addJob(dataPipeline.getString("databaseId"),dataPipeline.getString("serviceFqn"),dataPipeline.getString("cronExpression"),dataPipeline.getString("jobName"),dataPipeline);
  }  catch (Exception e) {
		
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}