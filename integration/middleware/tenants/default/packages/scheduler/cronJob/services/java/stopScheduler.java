package packages.scheduler.cronJob.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.template.Tenant;
import com.eka.middleware.heap.CacheManager;
import java.util.*;
import com.eka.middleware.scheduling.JobScheduler;
import org.quartz.*;
import com.eka.middleware.scheduling.ApplicationSchedulerFactory;
public final class stopScheduler{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{ 
    
    Scheduler scheduler = ApplicationSchedulerFactory.getSchedulerForTenant(dataPipeline.rp.getTenant().getName());
    if(!ApplicationSchedulerFactory.isSchedulerAlive(dataPipeline)){
      dataPipeline.put("msg","Already inactive");
      dataPipeline.put("status",false);
    }else{
      ApplicationSchedulerFactory.stopScheduler(dataPipeline);
      dataPipeline.put("msg","Deactivating scheduler");
      dataPipeline.put("status",true);
    }
 

}catch(Exception e){
  dataPipeline.clear();
  dataPipeline.put("error",e.getMessage());
  throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));

}

	}

}