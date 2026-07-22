package packages.Awareness.examples;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.*;
import agents.manager.ChatLanguageModelManager;
import agents.manager.RAGManager;
import agents.manager.FunctionManager;
import agents.manager.AgentManager;
import agents.manager.ConversationManager;
import agents.manager.KnowledgeBaseManager;
import agents.manager.EmbeddingModelManager;
public final class ExportAllTenants{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
  String[] tenants = { "SYNCLOOP_DEFAULT" };

        Map<String, Object> exportTenantFinal = new HashMap<>();

        for (String tn : tenants) {

            Map<String, Object> tenantWrapper = new HashMap<>();
            Map<String, Object> spec = new HashMap<>();

            try {
                EmbeddingModelManager.load(tn);
                ChatLanguageModelManager.load(tn);
                RAGManager.load(tn);
                FunctionManager.load(tn);
                KnowledgeBaseManager.load(tn);
                AgentManager.load(tn);
                ConversationManager.load(tn);

                Map<String, Object> llms =
                        ServiceUtils.jsonToMap(ChatLanguageModelManager.toJSON());

                Map<String, Object> embeddings =
                        ServiceUtils.jsonToMap(EmbeddingModelManager.toJSON());

                Map<String, Object> agents =
                        ServiceUtils.jsonToMap(AgentManager.toJSON());

                Map<String, Object> tools =
                        ServiceUtils.jsonToMap(FunctionManager.toJSON());

                Map<String, Object> rags =
                        ServiceUtils.jsonToMap(RAGManager.toJSON());

                Map<String, Object> kbs =
                        ServiceUtils.jsonToMap(KnowledgeBaseManager.toJSON());

                spec.put("LLMs", safeGet(llms, "LLMs", new ArrayList<>()));
                spec.put("Agents", safeGet(agents, "Agents", new ArrayList<>()));
                spec.put("Tools", safeGet(tools, "Tools", new ArrayList<>()));
                spec.put("EMBEDDING_MODELs", safeGet(embeddings, "EMBEDDING_MODELs", new ArrayList<>()));
                spec.put("KBs", safeGet(kbs, "KBs", new ArrayList<>()));
                spec.put("RAGs", safeGet(rags, "RAGs", new ArrayList<>()));

                tenantWrapper.put("spec", spec);
                tenantWrapper.put("status", "success");

            } catch (Exception e) {

                tenantWrapper.put("status", "failed");
                tenantWrapper.put("error", e.getMessage());
                e.printStackTrace();
            }

            exportTenantFinal.put(tn, tenantWrapper);
        }

        dataPipeline.put("export", exportTenantFinal);

	}
 @SuppressWarnings("unchecked")
    private static <T> T safeGet(Map<String, Object> source, String key, T defaultValue) {
        if (source == null) return defaultValue;
        Object val = source.get(key);
        return val != null ? (T) val : defaultValue;
    }

}