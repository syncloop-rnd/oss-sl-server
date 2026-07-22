package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringUtils;
public final class isAlphanumeric{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{

try {
  			dataPipeline.appLog("OPERATION", "isAlpanumeric");
            String text = dataPipeline.getString("text");
  			dataPipeline.appLog("TEXT", text);
            boolean result;

            if (StringUtils.isBlank(text)) {
                result = false;
              	dataPipeline.appLog("TEXT_MATCHED", "false");
            } else {
                result = text.matches("^[a-zA-Z0-9]*$");
              	dataPipeline.appLog("TEXT_MATCHED", "true" );
            }
            dataPipeline.put("result", result);
  			dataPipeline.appLog("RESULT", "result: " + result);

        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
  			dataPipeline.appLog("SERVICE_ERROR",e.getMessage());
            throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
        }
	}

}