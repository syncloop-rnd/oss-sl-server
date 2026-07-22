package packages.Awareness.dashboard.services.java.teams;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class getTeamsByAppId{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    String appId = dataPipeline.getString("appId");
    if (appId == null || appId.trim().isEmpty()) {
        throw new IllegalArgumentException("appId is required");
    }

    agents.core.teams.service.TeamsService teamsService =
            agents.core.teams.service.TeamsService.getInstance();

    java.util.List<java.util.Map<String, Object>> teams =
            teamsService.listRowsByAppId(java.util.UUID.fromString(appId));

    dataPipeline.put("teams", teams);
    dataPipeline.put("count", teams == null ? 0 : teams.size());
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