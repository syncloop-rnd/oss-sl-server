package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringUtils;
public final class split{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  	dataPipeline.appLog("OPERATION", "split");
    String inputString = dataPipeline.getString("inputString");
  	dataPipeline.appLog("INPUT_STRING", "Input String: " + inputString);
    String delimiter = dataPipeline.getString("delimiter");
  	dataPipeline.appLog("DELIMITER", "Delimiter: " + delimiter);
    String[] substrings = StringUtils.split(inputString, delimiter);
    dataPipeline.put("result", substrings);
  	dataPipeline.appLog("RESULT", "Splitting successfully done.");
} catch (Exception e) {
    dataPipeline.put("error", e.getMessage());
  	dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
    new SnippetException(dataPipeline, "SnippetException exception", e);
}

	}

}