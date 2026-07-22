package packages.MCPNest.services.java.interceptor;
import mcpnest.core.tools.api.MCPGateway;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import java.util.LinkedHashMap;
import java.util.Map;
public final class deleteInterceptorApi{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    Map<String, Object> request = new LinkedHashMap<>();
    Object value = dataPipeline.get("request");
    if (value instanceof Map<?, ?> source) {
        source.forEach((key, item) -> request.put(String.valueOf(key), item));
    }
    dataPipeline.put("result", MCPGateway.deleteInterceptorApi(request));
    dataPipeline.put("status", "success");
} catch (Exception e) {
    dataPipeline.clear();
    dataPipeline.put("status", "failed");
    dataPipeline.put("error", e.getMessage());
    throw new SnippetException(dataPipeline, "deleteInterceptorApi failed", e);
}
	}

}