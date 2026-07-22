package packages.middleware.pub.jwt;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.google.common.collect.Lists;

public final class generateIdentiferToken{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {

            String UUID = dataPipeline.getString("UUID");
            String token = dataPipeline.generateWithUUID(UUID, 0, null, null, null, Lists.newArrayList("app"));
            dataPipeline.put("token", token);
        } catch (Exception e) {
            dataPipeline.put("status", "error");
            throw new SnippetException(dataPipeline, "Snippet exception in reset password", new Exception(e));
        }
	}

}