package packages.Awareness.dashboard.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import utils.WrapperServiceUtils;
public final class IsItPublic{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
String agentId = dataPipeline.getString("agentId");

try {
	boolean status = WrapperServiceUtils.getPublicStatus(agentId);
    dataPipeline.put("status", status);
} catch (Exception e) {
  dataPipeline.put("status", false);
  
}
	}

}