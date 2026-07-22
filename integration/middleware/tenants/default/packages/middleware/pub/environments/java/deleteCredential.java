package packages.middleware.pub.environments.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.pub.service.CredentialsService;
import com.eka.middleware.pub.service.CredentialsMetaService;
public final class deleteCredential{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {

    String idStr = dataPipeline.getString("id");

    if(idStr == null || idStr.trim().isEmpty()) {
        throw new Exception("id is required");
    }

    long id = Long.parseLong(idStr);

    if(id <= 0) {
        throw new Exception("valid id is required");
    }

    CredentialsService service =
        new CredentialsService();

    boolean deleted = service.delete(id);

    dataPipeline.put("success", deleted);

} catch (Exception e) {

    dataPipeline.put("success", false);
    dataPipeline.put("error", e.getMessage());

    throw new SnippetException(
        dataPipeline,
        e.getMessage(),
        e
    );
}
	}

}