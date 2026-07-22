package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringUtils;
public final class escapeSQL{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
			dataPipeline.appLog("OPERATION", "escapeSQL");
            String input = dataPipeline.getString("input");
  			dataPipeline.appLog("INPUT", input);
            if (StringUtils.isBlank(input)) {
              	dataPipeline.appLog("INPUT_CHECK", "Input is blank");
                return ;
            }
            dataPipeline.put("output", input.replaceAll("'", "\""));
  			dataPipeline.appLog("OUTPUT", input.replaceAll("'", "\""));

        } catch (Exception e) {
            throw new SnippetException(dataPipeline, "packages.middleware.pub.string.patternQuote" , e);
        }

	}

}