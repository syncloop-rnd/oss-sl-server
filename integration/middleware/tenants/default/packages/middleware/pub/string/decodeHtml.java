package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringEscapeUtils;
public final class decodeHtml{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  			dataPipeline.appLog("OPERATION", "decodeHTML");
            String text = dataPipeline.getString("text");
            dataPipeline.put("htmlText", StringEscapeUtils.unescapeHtml4(text));
  			dataPipeline.appLog("UNESCAPE_HTML_COMPLETE", "Unescaped HTML text: " + StringEscapeUtils.unescapeHtml4(text));

        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
  			dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
            new SnippetException(dataPipeline,"SnippetException exception", e);
        }
	}

}