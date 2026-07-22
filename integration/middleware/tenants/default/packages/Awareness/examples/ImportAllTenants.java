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
public final class ImportAllTenants{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
/*
try {

            Object exportObj = dataPipeline.get("export");
            if (!(exportObj instanceof Map)) {
                dataPipeline.clear();
                dataPipeline.put("status", "failed");
                dataPipeline.put("error", "Invalid export payload");
                return;
            }

            Map<String, Object> export = (Map<String, Object>) exportObj;
            Map<String, Object> result = new HashMap<>();

            for (Object k : export.keySet()) {

                String tenant = String.valueOf(k);
                Map<String, Object> tenantResult = new HashMap<>();

                try {

                    Object tenantObj = export.get(tenant);
                    if (!(tenantObj instanceof Map)) {
                        tenantResult.put("status", "failed");
                        tenantResult.put("error", "Invalid tenant block");
                        result.put(tenant, tenantResult);
                        continue;
                    }

                    Object specObj = ((Map) tenantObj).get("spec");
                    if (!(specObj instanceof Map)) {
                        tenantResult.put("status", "failed");
                        tenantResult.put("error", "Spec missing");
                        result.put(tenant, tenantResult);
                        continue;
                    }

                    Map<String, Object> spec = (Map<String, Object>) specObj;

                    EmbeddingModelManager.load(tenant);
                    ChatLanguageModelManager.load(tenant);
                    FunctionManager.load(tenant);
                    AgentManager.load(tenant);
                    KnowledgeBaseManager.load(tenant);
                    RAGManager.load(tenant);
                    ConversationManager.load(tenant);

                    Object v;

                    v = spec.get("EMBEDDING_MODELs");
                    if (v != null)
                        EmbeddingModelManager.loadJson(ServiceUtils.toJson(v), true);

                    v = spec.get("LLMs");
                    if (v != null)
                        ChatLanguageModelManager.loadJson(ServiceUtils.toJson(v));

                    v = spec.get("Tools");
                    if (v != null)
                        FunctionManager.loadJson(ServiceUtils.toJson(v));

                    v = spec.get("Agents");
                    if (v != null)
                        AgentManager.loadJson(ServiceUtils.toJson(v), tenant);

                    v = spec.get("KBs");
                    if (v != null)
                        KnowledgeBaseManager.loadJson(ServiceUtils.toJson(v));

                    v = spec.get("RAGs");
                    if (v != null)
                        RAGManager.loadJson(ServiceUtils.toJson(v));

                    tenantResult.put("status", "success");

                } catch (Throwable t) {

                    tenantResult.put("status", "failed");
                    tenantResult.put("error", "Tenant import failed");
                }

                result.put(tenant, tenantResult);
            }

            dataPipeline.put("status", "success");
            dataPipeline.put("import", result);

        } catch (Throwable t) {
            t.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("status", "failed");
            dataPipeline.put("error", "Import failed");
        }
*/
	}

}