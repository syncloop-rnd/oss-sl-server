package packages.Awareness.dashboard.services.java.teams;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.core.apps.service.AppsService;
import java.util.List;
import java.util.Map;
import agents.core.teams.service.TeamsService;
public final class fetchTeams{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    TeamsService service = TeamsService.getInstance();

    java.util.List<java.util.Map<String, Object>> teams = service.toUiRows();

    dataPipeline.put("TEAMS", teams);
    dataPipeline.put("status", "success");
} catch (Exception e) {
    e.printStackTrace();
    dataPipeline.put("error", e.getMessage());
    dataPipeline.put("status", "failed");
    new SnippetException(dataPipeline, "Snippet exception", new Exception(e));
}

	}

}