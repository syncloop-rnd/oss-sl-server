package packages.MCPNest.services.java;
import mcpnest.core.tools.api.MCPGateway;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
public final class toolDebugCurl{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
            java.util.Map<String, Object> request = new java.util.HashMap<>();
            request.put("toolId", dataPipeline.getString("toolId"));
            request.put("collectionToolId", dataPipeline.getString("collectionToolId"));
            request.put("arguments", dataPipeline.getAsMap("arguments"));
            dataPipeline.put("result", MCPGateway.toolDebugCurl(request));
            dataPipeline.put("status", "success");
        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("status", "failed");
            dataPipeline.put("error", e.getMessage());
            throw new SnippetException(dataPipeline, "callTool failed", e);
        }
	}

}