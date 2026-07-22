package packages.Awareness.dashboard.services.java.mcp;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import java.util.UUID;
import agents.core.tools.service.ToolsRegistryService;
public final class updateAuthInfo{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    String uuid = dataPipeline.getString("id");
    String authInfo = dataPipeline.getString("authInfo");
    Boolean validate = dataPipeline.getAsBoolean("validate");

    if (uuid == null || uuid.trim().isEmpty()) {
        throw new IllegalArgumentException("id is required");
    }
    if (authInfo == null || authInfo.trim().isEmpty()) {
        throw new IllegalArgumentException("authInfo is required");
    }

    new ToolsRegistryService(dataPipeline)
        .updateMcpAuthInfo(UUID.fromString(uuid), authInfo, Boolean.TRUE.equals(validate));

    dataPipeline.put("success", true);
} catch (Exception e) {
    e.printStackTrace();
    dataPipeline.log("mcp.updateAuthInfo failed: " + e.getMessage());
    dataPipeline.put("success", false);
    dataPipeline.put("error", e.getMessage());
}
	}

}