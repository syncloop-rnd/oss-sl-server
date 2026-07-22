package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringUtils;
public final class compare{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
	try {
			dataPipeline.appLog("OPERATION", "compare");
            String str1 = dataPipeline.getString("str1");
      		dataPipeline.appLog("STRING1", str1);
            String str2 = dataPipeline.getString("str2");
      		dataPipeline.appLog("STRING2", str2);

            dataPipeline.put("result", StringUtils.compare(str1, str2));
      		dataPipeline.appLog("COMPARISON_RESULT", "Comparison result: " + StringUtils.compare(str1, str2));

        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
      		dataPipeline.appLog("OPERATION", e.getMessage());
            new SnippetException(dataPipeline,"SnippetException exception", e);
        }
	}

}