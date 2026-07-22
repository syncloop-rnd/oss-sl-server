package packages.Awareness.dashboard.services.java.teams;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class getTeamAgentsByTeamId{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    String teamId = dataPipeline.getString("teamId");
    if (teamId == null || teamId.trim().isEmpty()) {
        throw new IllegalArgumentException("teamId is required");
    }

    agents.core.teams.service.TeamsService teamsService =
            agents.core.teams.service.TeamsService.getInstance();

    java.util.List<java.util.Map<String, Object>> teamAgents =
            teamsService.getTeamAgentsByTeamId(java.util.UUID.fromString(teamId));

    dataPipeline.put("teamAgents", teamAgents);
    dataPipeline.put("count", teamAgents == null ? 0 : teamAgents.size());
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