package packages.Awareness.dashboard.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.manager.ChatLanguageModelManager;
import agents.manager.RAGManager;
import agents.manager.FunctionManager;
import agents.manager.AgentManager;
import agents.manager.KnowledgeBaseManager;
import agents.manager.EmbeddingModelManager;
import java.util.*;
import utils.ImportAI;
public final class importAll{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    Map<String, Object> spec = (Map<String, Object>) dataPipeline.get("spec");
    String json = ServiceUtils.toJson(spec);

    // Deprecated fallback import paths kept here for reference only.
    // String tn = dataPipeline.rp.getTenant().getName();
    // EmbeddingModelManager.loadJson(json, true);
    // ChatLanguageModelManager.loadJson(json);
    // RAGManager.loadJson(json);
    // FunctionManager.loadJson(json); // deprecated
    // AgentManager.loadJson(json, tn);
    // KnowledgeBaseManager.loadJson(json);

    Map<String, Object> importResult = ImportAI.importFromJson(json, dataPipeline);

    dataPipeline.put("status", importResult.get("status"));
    dataPipeline.put("result", importResult);
} catch (Exception e) {
    dataPipeline.clear();
    dataPipeline.put("error", e.getMessage());
    dataPipeline.put("status", "failed");
    new SnippetException(dataPipeline, "Snippet exception", new Exception(e));
}

	}

}