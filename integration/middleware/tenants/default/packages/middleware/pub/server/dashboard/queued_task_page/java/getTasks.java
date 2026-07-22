package packages.middleware.pub.server.dashboard.queued_task_page.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.rdbms.model.QueuedTasks;
public final class getTasks{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
dataPipeline.put("tasks",QueuedTasks.getTasks(null,20,null));
	}

}