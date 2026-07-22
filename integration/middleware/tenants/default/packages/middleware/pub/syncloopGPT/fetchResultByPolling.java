package packages.middleware.pub.syncloopGPT;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.*;

public final class fetchResultByPolling{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
    List<Map<String, Object>> dataList = dataPipeline.getAsList("dataList");

    if (dataList != null && !dataList.isEmpty()) {
        long latestUserMessageTime = 0;
        long latestAssistantMessageTime = 0;
        Map<String, Object> latestAssistantMessage = null;

        for (Map<String, Object> message : dataList) {
            String role = (String) message.get("role");
            long createdAt = getCreatedAt(message.get("created_at"));

            if ("user".equals(role)) {
                if (createdAt > latestUserMessageTime) {
                    latestUserMessageTime = createdAt;
                }
            } else if ("assistant".equals(role)) {
                if (createdAt > latestAssistantMessageTime) {
                    latestAssistantMessageTime = createdAt;
                    latestAssistantMessage = message;
                }
            }
        }

        if (latestAssistantMessage != null && latestAssistantMessageTime > latestUserMessageTime) {
            List<Map<String, Object>> contentList = (List<Map<String, Object>>) latestAssistantMessage.get("content");
            if (contentList != null && !contentList.isEmpty()) {
                Map<String, Object> content = contentList.get(0);
                Map<String, Object> text = (Map<String, Object>) content.get("text");
                if (text != null) {
                    String textValue = (String) text.get("value");
                    if (textValue != null) {
                        dataPipeline.put("response", textValue);
                        dataPipeline.put("role", "assistant");
                        System.out.println("Bot response: " + textValue);
                        return;
                    }
                }
            }
        }

        dataPipeline.put("role", "other");
    }


	}
private static long getCreatedAt(Object createdAtObj) {
    if (createdAtObj instanceof Number) {
        return ((Number) createdAtObj).longValue();
    } else {
        throw new IllegalArgumentException("Unsupported created_at type: " + createdAtObj.getClass().getName());
    }
}
}