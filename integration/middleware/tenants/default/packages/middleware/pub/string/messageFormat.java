package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import java.util.List;
import java.text.MessageFormat;
public final class messageFormat{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
			dataPipeline.appLog("OPERATION", "messageFormat");
            String pattern = dataPipeline.getString("pattern");
  			dataPipeline.appLog("PATTERN", "Formatting Pattern: " + pattern);
            List<String> argumentArray = (List<String>)dataPipeline.get("argumentArray");
  			dataPipeline.appLog("ARGUMENT_ARRAY", "Number of Arguments: " + argumentArray.size());

            String formattedText = MessageFormat.format(pattern, argumentArray.toArray());
            dataPipeline.put("formattedText", formattedText);
  			dataPipeline.appLog("RESULT", "Formatted Text: " + formattedText);

        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
  			dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
            new SnippetException(dataPipeline,"SnippetException exception", e);
        }
	}

}