package packages.middleware.pub.security.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.auth.SLAccessManager;
import java.util.List;
public final class removeGroupFromUser{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    String emailId = dataPipeline.getString("emailId");
    String group = dataPipeline.getString("group");

    if (emailId == null || emailId.trim().length() == 0) {
        throw new Exception("emailId is required.");
    }

    if (group == null || group.trim().length() == 0) {
        throw new Exception("group is required.");
    }

    emailId = emailId.trim();
    group = group.trim();

    String tenantName = dataPipeline.rp.getTenant().getName();

    List<String> groups = SLAccessManager.listUserGroups(emailId, tenantName);

    boolean removed = false;

    if (groups != null && groups.contains(group)) {
        SLAccessManager.removeUserGroup(tenantName, emailId, group);
        removed = true;
    }

    List<String> updatedGroups =
            SLAccessManager.listUserGroups(emailId, tenantName);

    dataPipeline.put("status", true);
    dataPipeline.put("removed", removed);
    dataPipeline.put("emailId", emailId);
    dataPipeline.put("group", group);
    dataPipeline.put("groups", updatedGroups);

    dataPipeline.keyLog(emailId,
            removed ? "group-removed-from-user" : "group-not-found-for-user");

} catch (Exception e) {
    e.printStackTrace();
    dataPipeline.clear();
    dataPipeline.put("error", e.getMessage());
    dataPipeline.put("status", false);
    dataPipeline.keyLog("remove-group-from-user", "failed");

    throw new SnippetException(
            dataPipeline,
            "Snippet exception while removing group from user",
            new Exception(e)
    );
}
	}

}