package packages.MCPNest.services.java;
import mcpnest.core.tools.api.MCPGateway;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
public final class exportMcpNestDatabase{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    dataPipeline.put("result", MCPGateway.exportMcpNestDatabase());
    dataPipeline.put("status", "success");
} catch (Exception e) {
    dataPipeline.clear();
    dataPipeline.put("status", "failed");
    dataPipeline.put("error", e.getMessage());
    throw new SnippetException(dataPipeline, "exportMcpNestDatabase failed", e);
}
	}

}