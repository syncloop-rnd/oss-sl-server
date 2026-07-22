package packages.Awareness.dashboard.services.java.kb;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import agents.manager.RAGManager;
import java.util.HashMap;
public final class getRagByKbId{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    String kbID = dataPipeline.getString("kbID");

    if (kbID == null || kbID.trim().length() == 0) {
        kbID = dataPipeline.getString("ragID");
    }

    if (kbID == null || kbID.trim().length() == 0) {
        throw new Exception("kbID or ragID is required");
    }

    kbID = kbID.trim().replace("\"", "");

    String json = RAGManager.toJSON();
    Map<String, Object> map = ServiceUtils.jsonToMap(json);
    List<Map<String, Object>> allRags = (List<Map<String, Object>>) map.get("RAGs");

    List<Map<String, Object>> rags = new ArrayList<>();

    if (allRags != null) {
        for (Map<String, Object> rag : allRags) {
            String ragID = rag.get("ragID") == null ? "" : rag.get("ragID").toString().trim();
            String personalityId = rag.get("personalityId") == null ? "" : rag.get("personalityId").toString().trim();
            String identifier = rag.get("identifier") == null ? "" : rag.get("identifier").toString().trim();

            if (kbID.equals(ragID) || kbID.equals(personalityId) || kbID.equals(identifier)) {
                rags.add(rag);
            }
        }
    }

    dataPipeline.put("RAGs", rags);
    dataPipeline.put("count", rags.size());
    dataPipeline.put("status", "success");

} catch (Exception e) {
    dataPipeline.clear();
    dataPipeline.put("error", e.getMessage());
    dataPipeline.put("status", "failed");
    new SnippetException(dataPipeline, "Snippet exception", new Exception(e));
}
	}

}