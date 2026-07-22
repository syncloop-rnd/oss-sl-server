package packages.Awareness.dashboard.services.java.tools_registry;
import agents.core.tools.service.ToolsRegistryService;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringUtils;

import java.util.List;
import java.util.Map;

public final class getByPaging{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
            ToolsRegistryService toolsRegistryService = ToolsRegistryService.getInstance();
            int page = parseOrDefault(dataPipeline.getString("page"), 1);
            int pageSize = parseOrDefault(dataPipeline.getString("pageSize"), 10);
            if (page < 1) {
                throw new IllegalArgumentException("page must be >= 1");
            }
            if (pageSize < 1) {
                throw new IllegalArgumentException("pageSize must be >= 1");
            }

            List<Map<String, Object>> tools = toolsRegistryService.listRows(page, pageSize);
            long total = toolsRegistryService.totalCount();

            dataPipeline.put("tools", tools);
            dataPipeline.put("page", page);
            dataPipeline.put("pageSize", pageSize);
            dataPipeline.put("totalCount", total);
            dataPipeline.put("status", "success");
        } catch (Exception e) {
            e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
            dataPipeline.put("status", "failed");
            new SnippetException(dataPipeline, "Snippet exception", new Exception(e));
        }
	}
private static int parseOrDefault(String value, int defaultValue) {
        if (StringUtils.isBlank(value)) {
            return defaultValue;
        }
        return Integer.parseInt(StringUtils.trim(value));
    }
}