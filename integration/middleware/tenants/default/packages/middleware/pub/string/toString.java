package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringUtils;

import java.nio.charset.StandardCharsets;
public final class toString{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
			dataPipeline.appLog("OPERATION", "toString");
            String string = dataPipeline.getString("string");
  			dataPipeline.appLog("INPUT", "Input" + string);
            dataPipeline.put("string", StringUtils.toEncodedString(string.getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8));
  			dataPipeline.appLog("ENCODED_STRING", "Encoded String: " + StringUtils.toEncodedString(string.getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8));

        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
  			dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
            new SnippetException(dataPipeline,"SnippetException exception", e);
        }
	}

}