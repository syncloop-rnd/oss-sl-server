package packages.Awareness.dashboard.services.java.agent_tools;
import agents.core.tools.service.AgentToolsService;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringUtils;

import java.util.List;
import java.util.Map;
public final class getByPaging{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
            AgentToolsService service = AgentToolsService.getInstance();
            int page = parseOrDefault(dataPipeline.getString("page"), 1);
            int pageSize = parseOrDefault(dataPipeline.getString("pageSize"), 10);
            if (page < 1) {
                throw new IllegalArgumentException("page must be >= 1");
            }
            if (pageSize < 1) {
                throw new IllegalArgumentException("pageSize must be >= 1");
            }

            List<Map<String, Object>> tools = service.listRows(page, pageSize);
            long total = service.totalCount();

            dataPipeline.put("agentTools", tools);
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