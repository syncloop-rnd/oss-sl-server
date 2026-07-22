package packages.Awareness.dashboard.services.java.apps;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.core.apps.service.AppsService;
public final class deleteApp{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
            String appId = dataPipeline.getString("appId");

            agents.core.apps.service.AppsService appsService =
                    agents.core.apps.service.AppsService.getInstance();

            appsService.delete(java.util.UUID.fromString(appId));

            dataPipeline.put("status", "success");
            dataPipeline.put("appId", appId);
  			ServiceUtils.expireServiceCache("packages.Awareness.dashboard.services.api.apps.fetchApps");
        } catch (Exception e) {
            e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
            dataPipeline.put("status", "failed");
            new SnippetException(dataPipeline, "Snippet exception", new Exception(e));
        }
    
	}

}