package packages.middleware.pub.security.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.auth.SLAccessManager;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
public final class getUsersByGroup{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    String group = dataPipeline.getString("group");

    if (group == null || group.trim().length() == 0) {
        throw new Exception("group is required.");
    }

    group = group.trim();

    String tenantName = dataPipeline.rp.getTenant().getName();

    List<Map<String, Object>> allUsers =
            SLAccessManager.listUsers(tenantName);

    List<Map<String, Object>> matchedUsers =
            new ArrayList<>();

    if (allUsers != null) {
        for (Map<String, Object> user : allUsers) {
            Object profileObj = user.get("profile");

            if (!(profileObj instanceof Map)) {
                continue;
            }

            Map<String, Object> profile =
                    (Map<String, Object>) profileObj;

            Object groupsObj = profile.get("groups");

            if (!(groupsObj instanceof List)) {
                continue;
            }

            List<?> groups = (List<?>) groupsObj;

            if (groups.contains(group)) {
                Map<String, Object> userInfo =
                        new LinkedHashMap<>();

                userInfo.put("userId", user.get("user_id"));
                userInfo.put("email", user.get("email"));
                userInfo.put("name", user.get("name"));
                userInfo.put("status", user.get("status"));
                userInfo.put("groups", groups);

                matchedUsers.add(userInfo);
            }
        }
    }

    dataPipeline.put("status", true);
    dataPipeline.put("group", group);
    dataPipeline.put("users", matchedUsers);
    dataPipeline.put("count", matchedUsers.size());

    dataPipeline.keyLog(group, "users-found-by-group");

} catch (Exception e) {
    e.printStackTrace();
    dataPipeline.clear();
    dataPipeline.put("error", e.getMessage());
    dataPipeline.put("status", false);
    dataPipeline.keyLog("get-users-by-group", "failed");

    throw new SnippetException(
            dataPipeline,
            "Snippet exception while getting users by group",
            new Exception(e)
    );
}
	}

}