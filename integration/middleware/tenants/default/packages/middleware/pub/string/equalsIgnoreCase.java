package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringUtils;
public final class equalsIgnoreCase{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
			dataPipeline.appLog("OPERATION", "equalsIgnoreCase");
            String string1 = dataPipeline.getString("string1");
  			dataPipeline.appLog("STRING1", string1);
            String string2 = dataPipeline.getString("string2");
  			dataPipeline.appLog("STRING2", string2);
            dataPipeline.put("result", StringUtils.equalsIgnoreCase(string1, string2));
  			dataPipeline.appLog("RESULT", Boolean.toString(StringUtils.equalsIgnoreCase(string1, string2)));

        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
  			dataPipeline.appLog("SERVICE_ERROR",e.getMessage());
            new SnippetException(dataPipeline,"SnippetException exception", e);
        }
	}

}