package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringUtils;
public final class isEmpty{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
			dataPipeline.appLog("OPERATION", "isEmpty");
            String string = dataPipeline.getString("string");
  			dataPipeline.appLog("STRING", string);
            dataPipeline.put("result", StringUtils.isEmpty(string));
  			dataPipeline.appLog("RESULT", "String is empty: " + StringUtils.isEmpty(string));

        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
  			dataPipeline.appLog("SERVICE_ERROR",e.getMessage());
            new SnippetException(dataPipeline,"SnippetException exception", e);
        }
	}

}