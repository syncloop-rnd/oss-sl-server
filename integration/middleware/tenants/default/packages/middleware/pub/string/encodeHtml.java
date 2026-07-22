package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringEscapeUtils;
public final class encodeHtml{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
			dataPipeline.appLog("OPERATION", "encodeHTML");
            String htmlText = dataPipeline.getString("htmlText");
            dataPipeline.put("text", StringEscapeUtils.escapeHtml4(htmlText));
  			dataPipeline.appLog("ESCAPE_HTML_COMPLETE", "Escaped text: " + StringEscapeUtils.escapeHtml4(htmlText));

        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
  			dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
            new SnippetException(dataPipeline,"SnippetException exception", e);
        }
	}

}