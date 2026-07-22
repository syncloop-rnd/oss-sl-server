package packages.Awareness.dashboard.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.manager.AppManager;
import java.util.*;
public final class createApps{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
  try {
            String appId = UUID.randomUUID().toString();
            String appName = dataPipeline.getString("appName");
    		String description = dataPipeline.getString("description");
            AppManager.addApplication(dataPipeline.rp.getTenant().getName(), appId, appName, description);
            AppManager.persistNow(dataPipeline.rp.getTenant().getName());
            dataPipeline.put("status", "success");
            dataPipeline.put("appId", appId);
    ServiceUtils.expireServiceCache("packages.Awareness.dashboard.services.api.exportAll");
        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
            dataPipeline.put("status", "failed");
            new SnippetException(dataPipeline, "Snippet exception", new Exception(e));
        }
	}

}