package packages.middleware.pub.server.core;
import com.eka.middleware.server.ApplicationShutdownHook;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;

public final class RebootServer{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
		try {
          	dataPipeline.appLog("OPERATION", "RebootServer");
            ApplicationShutdownHook.restartServer(dataPipeline);
          	dataPipeline.appLog("SERVER_STATUS", "Server restarted successfully");
        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
          	dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
            throw new SnippetException(dataPipeline, "Snippet exception", e);
        }
	}

}