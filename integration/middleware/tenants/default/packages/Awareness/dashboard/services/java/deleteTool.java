package packages.Awareness.dashboard.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.manager.FunctionManager;
public final class deleteTool{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {

            String identifier = dataPipeline.getString("identifier");
  			String fqn = dataPipeline.getString("fqn");
  			boolean status = FunctionManager.delete(identifier, fqn);
			dataPipeline.put("status", status ? "success" : "failed");
  			ServiceUtils.expireServiceCache("packages.Awareness.dashboard.services.api.exportAll");
        } catch (Exception e) {
            e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
            dataPipeline.put("status", "failed");
            throw new SnippetException(dataPipeline, "Snippet exception", e);
        }
	}

}