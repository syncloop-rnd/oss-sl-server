package packages.Awareness.dashboard.services.java.tree;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.Map;
import java.util.UUID;
public final class getAppTreeByAppId{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
            String appId = dataPipeline.getString("appId");
            if (appId == null || appId.trim().isEmpty()) {
                throw new IllegalArgumentException("appId is required");
            }

            java.util.Map<String, Object> response =
                    agents.core.apps.service.AppsService.getInstance()
                            .getTreeByAppId(java.util.UUID.fromString(appId.trim()));

            dataPipeline.clear();
            dataPipeline.put("template", response.get("template"));
            dataPipeline.put("status", "success");

        } catch (Exception e) {
            e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
            dataPipeline.put("status", "failed");
            throw new SnippetException(dataPipeline, "Snippet exception", e);
        }
	}

}