package packages.MCPNest.services.java.oauth;
import java.util.LinkedHashMap;
import java.util.Map;
import com.eka.middleware.template.SnippetException;
import mcpnest.core.tools.api.MCPGateway;
import com.eka.middleware.service.DataPipeline;
public final class testOAuthAuthorization{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    Map<String, Object> request = new LinkedHashMap<>();
    putIfPresent(request, "name", dataPipeline.get("name"));
    putIfPresent(request, "mcpId", dataPipeline.get("mcpId"));
    putIfPresent(request, "visibility", dataPipeline.get("visibility"));
    dataPipeline.put("result", MCPGateway.testOAuthAuthorization(request));
    dataPipeline.put("status", "success");
} catch (Exception e) {
    dataPipeline.clear();
    dataPipeline.put("status", "failed");
    dataPipeline.put("error", e.getMessage());
}
	}
private static void putIfPresent(Map<String, Object> target, String key, Object value) {
    if (value != null && !String.valueOf(value).isBlank()) {
        target.put(key, value);
    }
}
}