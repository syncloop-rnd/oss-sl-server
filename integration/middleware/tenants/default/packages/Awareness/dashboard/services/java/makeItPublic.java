package packages.Awareness.dashboard.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import utils.WrapperServiceUtils;
public final class makeItPublic{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
String agentId = dataPipeline.getString("agentId");
boolean status = dataPipeline.getAsBoolean("status");

try {
	WrapperServiceUtils.publicStatus(agentId, status);
  	dataPipeline.put("status", true);
} catch (Exception e) {
  dataPipeline.put("status", false);
}
	}

}