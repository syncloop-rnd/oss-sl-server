package packages.Awareness.dashboard.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.manager.KnowledgeBaseManager;
import agents.manager.RAGManager;
import java.util.*;
public final class deleteKB{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    String ragID = dataPipeline.getString("ragID");
    if (ragID == null || ragID.trim().isEmpty()) {
        throw new IllegalArgumentException("ragID is required");
    }

    boolean unlinkRags = Boolean.TRUE.equals(dataPipeline.getAsBoolean("unlinkRags"));

    List<String> unlinkedRags = new ArrayList<>();
    if (unlinkRags) {
        unlinkedRags = RAGManager.deleteByKnowledgeBase(ragID);
    }

    List<String> unlinkedKBs = new ArrayList<>(KnowledgeBaseManager.listKnowledgeBaseNames(List.of(ragID)));
    if (unlinkedKBs.isEmpty()) {
        unlinkedKBs.add(ragID);
    }

    int unlinkedToolRegistryCount = KnowledgeBaseManager.delete(ragID);

    dataPipeline.put("status", "success");
    dataPipeline.put("unlinkedRags", unlinkedRags);
    dataPipeline.put("unlinkedRagCount", unlinkedRags.size());
    dataPipeline.put("unlinkedKBs", unlinkedKBs);
    dataPipeline.put("unlinkedKBCount", unlinkedKBs.size());
    dataPipeline.put("unlinkRags", unlinkRags);
    dataPipeline.put("unlinkedToolRegistryCount", unlinkedToolRegistryCount);
} catch (Exception e) {
    dataPipeline.clear();
    dataPipeline.put("error", e.getMessage());
    dataPipeline.put("status", "failed");
    throw new SnippetException(dataPipeline, "Snippet exception", new Exception(e));
}
	}

}