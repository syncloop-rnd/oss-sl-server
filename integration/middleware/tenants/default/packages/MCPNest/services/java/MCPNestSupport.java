package packages.MCPNest.services.java;

import java.util.List;

import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;

final class MCPNestSupport {
    private MCPNestSupport() {
    }

    static boolean asBoolean(Object value) {
        if (value instanceof Boolean bool) {
            return bool;
        }
        return value != null && Boolean.parseBoolean(String.valueOf(value));
    }

    static String[] asStringArray(Object value) {
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

    static void fail(DataPipeline dataPipeline, String message, Exception e) throws SnippetException {
        dataPipeline.clear();
        dataPipeline.put("status", "failed");
        dataPipeline.put("error", e.getMessage());
        throw new SnippetException(dataPipeline, message, e);
    }
}
