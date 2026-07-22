package packages.MCPNest.services.java;
import mcpnest.core.tools.api.MCPGateway;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import java.util.List;
public final class listToolsByMcpId{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    dataPipeline.put("result", MCPGateway.listToolsByMcpId(dataPipeline.getString("mcpId"), asStringArray(dataPipeline.get("keywords")), intValue(dataPipeline.get("offset")), intValue(dataPipeline.get("limit"))));
    dataPipeline.put("status", "success");
} catch (Exception e) {
    dataPipeline.clear();
    dataPipeline.put("status", "failed");
    dataPipeline.put("error", e.getMessage());
    throw new SnippetException(dataPipeline, "listToolsByMcpId failed", e);
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
private static int intValue(Object value) {
    if (value instanceof Number number) {
        return number.intValue();
    }
    if (value == null || String.valueOf(value).isBlank()) {
        return 0;
    }
    return Integer.parseInt(String.valueOf(value));
}
}