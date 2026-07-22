package packages.Awareness.dashboard.services.java.teams;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class upsertTeam{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    String teamId = dataPipeline.getString("teamID");
    if (teamId == null || teamId.trim().isEmpty()) {
        teamId = dataPipeline.getString("teamId");
    }

    String name = dataPipeline.getString("name");
    String requirement = dataPipeline.getString("requirement");
    String appId = dataPipeline.getString("appId");
    String managerId = dataPipeline.getString("managerId");

    Object agentsObject = dataPipeline.get("agents");
    java.util.List<java.util.UUID> agentIds = new java.util.ArrayList<>();
    if (agentsObject instanceof java.util.List) {
        java.util.List<?> rawAgents = (java.util.List<?>) agentsObject;
        for (Object value : rawAgents) {
            if (value != null && value.toString().trim().length() > 0) {
                agentIds.add(java.util.UUID.fromString(value.toString().trim()));
            }
        }
    }

    agents.core.teams.models.Teams team = new agents.core.teams.models.Teams();

    if (teamId != null && !teamId.trim().isEmpty()) {
        team.setTeamId(java.util.UUID.fromString(teamId));
    }
    team.setName(name);
    team.setRequirement(requirement);

    if (appId != null && !appId.trim().isEmpty()) {
        team.setAppId(java.util.UUID.fromString(appId));
    }
    if (managerId != null && !managerId.trim().isEmpty()) {
        team.setManagerId(java.util.UUID.fromString(managerId));
    }

    team.setAgentIds(agentIds);

    agents.core.teams.service.TeamsService teamsService =
            agents.core.teams.service.TeamsService.getInstance();

    agents.core.teams.models.Teams savedTeam;
    boolean exists = team.getTeamId() != null && teamsService.get(team.getTeamId()) != null;

    if (exists) {
        savedTeam = teamsService.update(team);
        dataPipeline.put("operation", "updated");
    } else {
        savedTeam = teamsService.create(team);
        dataPipeline.put("operation", "created");
    }
	ServiceUtils.expireServiceCache("packages.Awareness.dashboard.services.api.exportAll");
    ServiceUtils.expireServiceCache("packages.Awareness.dashboard.services.api.teams.fetchTeams");
    dataPipeline.put("status", "success");
    dataPipeline.put("teamID", savedTeam.getTeamId() == null ? null : savedTeam.getTeamId().toString());
   
} catch (Exception e) {
    e.printStackTrace();
    dataPipeline.clear();
    dataPipeline.put("error", e.getMessage());
    dataPipeline.put("status", "failed");
    new SnippetException(dataPipeline, "Snippet exception", new Exception(e));
}

	}

}