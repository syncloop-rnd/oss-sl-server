package packages.MCPNest.services.java;
import mcpnest.core.tools.api.MCPGateway;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import java.util.*;
public final class addMcpEndpoint{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    Map request=new HashMap();
    request.put("mcpAlias",dataPipeline.getString("mcpAlias"));
    request.put("endpointUrl",dataPipeline.getString("endpointUrl"));
    request.put("packageName",dataPipeline.getString("packageName"));
    request.put("mcpName",dataPipeline.getString("mcpName"));
    request.put("description",dataPipeline.getString("description"));
    request.put("endpointType",dataPipeline.getString("endpointType"));
    request.put("authType",dataPipeline.getString("authType"));
    request.put("authInfo",dataPipeline.getAsMap("authInfo"));
    request.put("enabled",dataPipeline.getAsBoolean("enabled"));
    request.put("categories",dataPipeline.getAsList("categories"));
    dataPipeline.put("result", MCPGateway.addMcpEndpoint(request));
    dataPipeline.put("status", "success");
} catch (Exception e) {
    dataPipeline.clear();
    dataPipeline.put("status", "failed");
    dataPipeline.put("error", e.getMessage());
    throw new SnippetException(dataPipeline, "addMcpEndpoint failed", e);
}
	}

}