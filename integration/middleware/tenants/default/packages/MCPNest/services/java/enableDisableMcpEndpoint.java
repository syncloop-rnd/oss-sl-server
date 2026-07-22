package packages.MCPNest.services.java;
import mcpnest.core.tools.api.MCPGateway;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
public final class enableDisableMcpEndpoint{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    dataPipeline.put("result", MCPGateway.enableDisableMcpEndpoint(dataPipeline.getString("mcpId"), asBoolean(dataPipeline.get("enabled"))));
    dataPipeline.put("status", "success");
} catch (Exception e) {
    dataPipeline.clear();
    dataPipeline.put("status", "failed");
    dataPipeline.put("error", e.getMessage());
    throw new SnippetException(dataPipeline, "enableDisableMcpEndpoint failed", e);
}
	}
private static boolean asBoolean(Object value) {
    if (value instanceof Boolean bool) {
        return bool;
    }
    return value != null && Boolean.parseBoolean(String.valueOf(value));
}
}