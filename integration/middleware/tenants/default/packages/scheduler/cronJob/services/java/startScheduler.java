package packages.scheduler.cronJob.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.service.RuntimePipeline;
import com.eka.middleware.template.Tenant;
import java.time.Duration;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import com.eka.middleware.heap.CacheManager;
import com.cronutils.model.CronType;
import com.cronutils.model.definition.CronDefinition;
import com.cronutils.model.definition.CronDefinitionBuilder;
import com.cronutils.model.time.ExecutionTime;
import com.cronutils.parser.CronParser;
import io.timeandspace.cronscheduler.CronScheduler;
import java.time.format.DateTimeFormatter;
import com.eka.middleware.scheduling.ApplicationSchedulerFactory;
import com.eka.middleware.scheduling.JobScheduler;
import org.quartz.*;

public final class startScheduler{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try { 
  
    if(!ApplicationSchedulerFactory.isSchedulerAlive(dataPipeline)){
      ApplicationSchedulerFactory.startScheduler(dataPipeline);
     // schedulerThread=new Thread(runnable);
      dataPipeline.log("Attempting to start the scheduler thread....");
     // schedulerThread.start();
      dataPipeline.put("msg","Scheduler thread is active and running");
      dataPipeline.log("Scheduler thread started/activated");
      dataPipeline.put("msg","Scheduler thread activated");
      dataPipeline.put("status", true);
    }else {
      dataPipeline.put("msg","Scheduler thread is active and running");
      dataPipeline.put("status", false);
    }
  } catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}