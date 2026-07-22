package packages.Awareness.dashboard.services.java.apps;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class getAppById{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    String appId = dataPipeline.getString("appId");
    if (appId == null || appId.trim().isEmpty()) {
        throw new IllegalArgumentException("appId is required");
    }

    agents.core.apps.service.AppsService appsService =
            agents.core.apps.service.AppsService.getInstance();

    java.util.Map<String, Object> app =
            appsService.getAsMap(java.util.UUID.fromString(appId));

    if (app == null) {
        dataPipeline.put("status", "failed");
        dataPipeline.put("error", "App not found");
    } else {
        dataPipeline.put("app", app);
        dataPipeline.put("status", "success");
    }

} catch (Exception e) {
    e.printStackTrace();
    dataPipeline.clear();
    dataPipeline.put("error", e.getMessage());
    dataPipeline.put("status", "failed");
    new SnippetException(dataPipeline, "Snippet exception", new Exception(e));
}

	}

}