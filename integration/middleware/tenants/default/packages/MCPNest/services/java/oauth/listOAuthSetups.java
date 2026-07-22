package packages.MCPNest.services.java.oauth;
import java.util.List;

import mcpnest.core.tools.api.MCPGateway;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
public final class listOAuthSetups{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    dataPipeline.put("result", MCPGateway.listOAuthSetups(asStringArray(dataPipeline.get("keywords"))));
    dataPipeline.put("status", "success");
} catch (Exception e) {
    dataPipeline.clear();
    dataPipeline.put("status", "failed");
    dataPipeline.put("error", e.getMessage());
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