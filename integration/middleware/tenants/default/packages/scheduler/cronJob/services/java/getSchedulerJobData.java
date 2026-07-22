package packages.scheduler.cronJob.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.service.RuntimePipeline;
import com.eka.middleware.template.Tenant;
import com.eka.middleware.heap.CacheManager;
import java.time.Duration;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import com.cronutils.model.CronType;
import com.cronutils.model.definition.CronDefinition;
import com.cronutils.model.definition.CronDefinitionBuilder;
import com.cronutils.model.time.ExecutionTime;
import com.cronutils.parser.CronParser;
import io.timeandspace.cronscheduler.CronScheduler;
import java.time.format.DateTimeFormatter;
public final class getSchedulerJobData{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    Map<String, Object> cache=CacheManager.getCacheAsMap(dataPipeline.rp.getTenant());
    final Map<String,Map<String,String>> jobMapData=(Map)cache.get("scheduler:jobMapData");
  if(jobMapData!=null)
    dataPipeline.put("jobMapData",jobMapData);
    dataPipeline.put("msg","Success");
  } catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}