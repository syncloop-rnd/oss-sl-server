package packages.scheduler.cronJob.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.scheduling.JobScheduler;
public final class updateScheduler{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
	JobScheduler.updateJob(dataPipeline.getString("databaseId"),dataPipeline.getString("cronExpression"),dataPipeline);
  } catch (Exception e) {
		
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}