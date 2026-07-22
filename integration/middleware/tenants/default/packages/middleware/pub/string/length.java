package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringUtils;
public final class length{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
			dataPipeline.appLog("OPERATION", "length");
            String string = dataPipeline.getString("string");
  			dataPipeline.appLog("STRING", string);
            dataPipeline.put("length", StringUtils.length(string));
  			dataPipeline.appLog("LENGTH_RESULT", Integer.toString(StringUtils.length(string)));
        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
  			 dataPipeline.appLog("SERVICE_ERROR",e.getMessage());
            throw new SnippetException(dataPipeline,"SnippetException exception", e);
        }
	}

}