package packages.Awareness.dashboard.services.java.teams;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class deleteTeam{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    String teamId = dataPipeline.getString("teamID");
    if (teamId == null || teamId.trim().isEmpty()) {
        teamId = dataPipeline.getString("teamId");
    }

    agents.core.teams.service.TeamsService teamsService =
           agents.core.teams.service.TeamsService.getInstance();

    teamsService.delete(java.util.UUID.fromString(teamId));
  	ServiceUtils.expireServiceCache("packages.Awareness.dashboard.services.api.exportAll");
       ServiceUtils.expireServiceCache("packages.Awareness.dashboard.services.api.teams.fetchTeams");
    dataPipeline.put("status", "success");
    dataPipeline.put("teamID", teamId);
} catch (Exception e) {
    e.printStackTrace();
    dataPipeline.clear();
    dataPipeline.put("error", e.getMessage());
    dataPipeline.put("status", "failed");
    new SnippetException(dataPipeline, "Snippet exception", new Exception(e));
}

	}

}