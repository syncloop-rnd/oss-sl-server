package packages.middleware.pub.server.dashboard.queued_task_page.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.rdbms.model.QueuedTasks;
import java.util.*;
public final class getResult{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
String batchId=dataPipeline.getString("tid");
Map<String, Object> response=QueuedTasks.getResult(batchId);
dataPipeline.put("response",response);
	}

}