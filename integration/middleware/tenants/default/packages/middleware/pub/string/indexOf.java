package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringUtils;
public final class indexOf{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  			dataPipeline.appLog("OPERATION", "indexOf");
            String string = dataPipeline.getString("string");
  			dataPipeline.appLog("STRING", "Main String: " + string);
            String subString = dataPipeline.getString("subString");
  			dataPipeline.appLog("SUBSTRING", "SubString: " + subString);
            dataPipeline.put("index", StringUtils.indexOf(string, subString));
  			dataPipeline.appLog("INDEX_FOUND", "Index of SubString in String: " + StringUtils.indexOf(string, subString));

        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
  			dataPipeline.appLog("SERVICE_ERROR",e.getMessage());
            new SnippetException(dataPipeline,"SnippetException exception", e);
        }
	}

}