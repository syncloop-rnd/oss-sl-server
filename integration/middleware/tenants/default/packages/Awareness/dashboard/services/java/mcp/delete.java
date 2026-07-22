package packages.Awareness.dashboard.services.java.mcp;
import agents.core.tools.model.MCP;
import agents.core.tools.service.MCPService;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringUtils;
import com.eka.middleware.service.ServiceUtils;
import java.util.UUID;
import java.util.Set;
public final class delete{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
            String idText = dataPipeline.getString("id");
            if (StringUtils.isBlank(idText)) {
                throw new IllegalArgumentException("id is required");
            }
  			
  			boolean deleteTools = dataPipeline.getAsBoolean("deleteTools");

            UUID id = UUID.fromString(StringUtils.trim(idText));
            MCPService service = MCPService.getInstance();
            MCP mcp = service.get(id);

            if (mcp == null) {
                throw new IllegalArgumentException("MCP not found for id: " + id);
            }

            Set<String> deletedTools = service.delete(id, deleteTools);
  			dataPipeline.put("deletedTools", deletedTools);
            dataPipeline.put("deletedId", id.toString());
            dataPipeline.put("status", "success");
  ServiceUtils.expireServiceCache("packages.Awareness.dashboard.services.api.exportAll");
        } catch (Exception e) {
            e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
            dataPipeline.put("status", "failed");
            new SnippetException(dataPipeline, "Snippet exception", new Exception(e));
        }
	}

}