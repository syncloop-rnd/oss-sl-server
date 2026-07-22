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
public final class ImportAllTenants2{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
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
                    String json=ServiceUtils.toJson(spec);

                    EmbeddingModelManager.load(tenant);
                    ChatLanguageModelManager.load(tenant);
                    FunctionManager.load(tenant);
                    AgentManager.load(tenant);
                    KnowledgeBaseManager.load(tenant);
                    RAGManager.load(tenant);
                    ConversationManager.load(tenant);

                    EmbeddingModelManager.loadJson(json, true);
                    ChatLanguageModelManager.loadJson(json);
                    FunctionManager.loadJson(json);
                    AgentManager.loadJson(json, tenant);
                    //KnowledgeBaseManager.loadJson(json);
                    //RAGManager.loadJson(json);

                    tenantResult.put("status", "success");

                } catch (Throwable t) {
 t.printStackTrace();
                    tenantResult.put("status", "failed");
                    tenantResult.put("error", "Tenant import failed");
                }

                result.put(tenant, tenantResult);
            }

            dataPipeline.put("status", "success");
            dataPipeline.put("importData", result);

        } catch (Throwable t) {
   
   t.printStackTrace();

            dataPipeline.clear();
            dataPipeline.put("status", "failed");
            dataPipeline.put("error", "Import failed");
        }
	}

}