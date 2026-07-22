package packages.MCPNest.services.java;
import mcpnest.core.tools.api.MCPGateway;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import java.util.HashMap;
import java.util.Map;
public final class mergeDefaultOAuthCatalog{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    dataPipeline.put("result", MCPGateway.mergeDefaultOAuthCatalog(null));
    dataPipeline.put("status", "success");
} catch (Exception e) {
    dataPipeline.clear();
    dataPipeline.put("status", "failed");
    dataPipeline.put("error", e.getMessage());
    throw new SnippetException(dataPipeline, "mergeDefaultOAuthCatalog failed", e);
}
	}
private static Map<String, Object> asMap(Object value) {
    if (value == null) {
        return new HashMap<>();
    }
    if (value instanceof Map<?, ?> map) {
        Map<String, Object> result = new HashMap<>();
        map.forEach((key, item) -> result.put(String.valueOf(key), item));
        return result;
    }
    throw new IllegalArgumentException("request must be a map");
}
}