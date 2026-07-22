package packages.Awareness.dashboard.services.java.apps;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.core.apps.service.AppsService;
import java.util.List;
import java.util.Map;
public final class fetchApps{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    agents.core.apps.service.AppsService appsService =
            agents.core.apps.service.AppsService.getInstance();

    long total = appsService.totalCount();
    int pageSize = total <= 0 ? 1 : (total > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) total);

    List<Map<String, Object>> apps = appsService.listRows(1, pageSize);

    dataPipeline.put("APPS", apps);
    dataPipeline.put("count", apps == null ? 0 : apps.size());
    dataPipeline.put("status", "success");
} catch (Exception e) {
    e.printStackTrace();
    dataPipeline.clear();
    dataPipeline.put("error", e.getMessage());
    dataPipeline.put("status", "failed");
    new SnippetException(dataPipeline, "Snippet exception", new Exception(e));
}
	}

}