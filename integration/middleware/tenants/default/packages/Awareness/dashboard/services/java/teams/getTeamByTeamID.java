package packages.Awareness.dashboard.services.java.teams;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class getTeamByTeamID{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    String teamId = dataPipeline.getString("teamId");
    if (teamId == null || teamId.trim().isEmpty()) {
        throw new IllegalArgumentException("teamId is required");
    }

    java.util.UUID teamUUID = java.util.UUID.fromString(teamId.trim());

    agents.core.teams.service.TeamsService service =
            agents.core.teams.service.TeamsService.getInstance();

    java.util.Map<String, Object> team = service.getAsMap(teamUUID);

    if (team == null || team.isEmpty()) {
        throw new IllegalArgumentException("team not found for teamId: " + teamId);
    }

    dataPipeline.put("TEAM", team);
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