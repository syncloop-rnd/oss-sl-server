package packages.middleware.pub.security.users;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.auth.AuthAccount;
import java.util.*;
public final class assignStaticGroups{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
AuthAccount acc=dataPipeline.getCurrentRuntimeAccount();
List<String> groups=new ArrayList<String>();
groups.add(AuthAccount.STATIC_ADMIN_GROUP);
groups.add(AuthAccount.STATIC_DEVELOPER_GROUP);
acc.getAuthProfile().put("groups",groups);
acc.getAuthProfile().put("forceCreateuser",true);
	}

}