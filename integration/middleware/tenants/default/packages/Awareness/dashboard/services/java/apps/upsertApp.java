package packages.Awareness.dashboard.services.java.apps;
import agents.core.apps.models.Apps;
import agents.core.apps.service.AppsService;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
public final class upsertApp{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
            String appId = dataPipeline.getString("appId");
            String appName = dataPipeline.getString("name");
            String description = dataPipeline.getString("description");
            String llmKey = dataPipeline.getString("llmKey");
            String appLink = dataPipeline.getString("appLink");

            agents.core.apps.models.Apps app = new agents.core.apps.models.Apps();

            if (appId != null && !appId.trim().isEmpty()) {
                app.setAppId(java.util.UUID.fromString(appId));
            }

            app.setName(appName);
            app.setDescription(description);
            app.setAppLink(appLink);

            if (llmKey != null && !llmKey.trim().isEmpty()) {
                app.setLlmKey(java.util.UUID.fromString(llmKey));
            }

            agents.core.apps.service.AppsService appsService = agents.core.apps.service.AppsService.getInstance();

            agents.core.apps.models.Apps savedApp;
            boolean exists = app.getAppId() != null && appsService.get(app.getAppId()) != null;

            if (exists) {
                savedApp = appsService.update(app);
                dataPipeline.put("operation", "updated");
            } else {
                savedApp = appsService.create(app);
                dataPipeline.put("operation", "created");
            }
  ServiceUtils.expireServiceCache("packages.Awareness.dashboard.services.api.apps.fetchApps");

            dataPipeline.put("status", "success");
            dataPipeline.put("appId", savedApp.getAppId() == null ? null : savedApp.getAppId().toString());
            dataPipeline.put("reportAgentId", savedApp.getReportAgentId() == null ? null : savedApp.getReportAgentId().toString());
            dataPipeline.put("terminationAgentId", savedApp.getTerminationAgentId() == null ? null : savedApp.getTerminationAgentId().toString());
        } catch (Exception e) {
            e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
            dataPipeline.put("status", "failed");
            new SnippetException(dataPipeline, "Snippet exception", new Exception(e));
        }
	}

}