package packages.MCPNest.services.java;
import mcpnest.core.tools.api.MCPGateway;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import java.util.List;
public final class listCollections{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    dataPipeline.put("result", MCPGateway.listCollections(asStringArray(dataPipeline.get("keywords"))));
    dataPipeline.put("status", "success");
} catch (Exception e) {
    dataPipeline.clear();
    dataPipeline.put("status", "failed");
    dataPipeline.put("error", e.getMessage());
    throw new SnippetException(dataPipeline, "listCollections failed", e);
}
	}
private static String[] asStringArray(Object value) {
    if (value == null) {
        return null;
    }
    if (value instanceof String[] array) {
        return array;
    }
    if (value instanceof List<?> list) {
        String[] result = new String[list.size()];
        for (int i = 0; i < list.size(); i++) {
            result[i] = String.valueOf(list.get(i));
        }
        return result;
    }
    return new String[] { String.valueOf(value) };
}
}