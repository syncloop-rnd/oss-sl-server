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
import org.quartz.*;
public final class getSchedulerStatus{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    Map<String, Object> cache = CacheManager.getCacheAsMap(dataPipeline.rp.getTenant());

    Scheduler scheduler = ApplicationSchedulerFactory.getSchedulerForTenant(dataPipeline.rp.getTenant().getName());

    if (ApplicationSchedulerFactory.isSchedulerAlive(dataPipeline)) {
        dataPipeline.put("status",cache.get("scheduler:status"));
        dataPipeline.put("lastJobFQN",cache.get("scheduler:lastJobFQN"));
      	dataPipeline.put("lastJobTime",cache.get("scheduler:lastJobTime"));
        dataPipeline.put("msg","Scheduler is active");
    } else {
        // Scheduler is inactive
        dataPipeline.put("status", "Success");
        dataPipeline.put("msg", "Scheduler is inactive");
    }
} catch (Exception e) {
    dataPipeline.clear();
    dataPipeline.put("status", "Error");
    dataPipeline.put("error", e.getMessage());
    throw new SnippetException(dataPipeline, "Snippet exception", new Exception(e));
}

	}

}