package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringUtils;
public final class equals{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
	try {
			dataPipeline.appLog("OPERATION", "equals");
            String string1 = dataPipeline.getString("string1");
      		dataPipeline.appLog("STRING1", string1);
            String string2 = dataPipeline.getString("string2");
      		dataPipeline.appLog("STRING2", string2);
            dataPipeline.put("result", StringUtils.equals(string1, string2));
      		dataPipeline.appLog("COMPARISON_RESULT", Boolean.toString(StringUtils.equals(string1, string2)));

        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
      		dataPipeline.put("SERVICE_ERROR",e.getMessage());
            new SnippetException(dataPipeline,"SnippetException exception", e);
        }
	}

}