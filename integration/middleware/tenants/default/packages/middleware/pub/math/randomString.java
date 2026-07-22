package packages.middleware.pub.math;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.RandomStringUtils;

public final class randomString{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {

            Integer count = dataPipeline.getAsInteger("count");
            dataPipeline.put("randomNumber", RandomStringUtils.randomNumeric(count));

        } catch (Throwable e) {
            e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
            dataPipeline.setResponseStatus(500);
            dataPipeline.put("status", "Not Modified");
            new SnippetException(dataPipeline,"Failed while saving file", new Exception(e));
        }
	}

}