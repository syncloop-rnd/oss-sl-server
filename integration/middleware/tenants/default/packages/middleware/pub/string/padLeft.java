package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringUtils;
public final class padLeft{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
            dataPipeline.appLog("OPERATION", "padLeft");
  			String text = dataPipeline.getString("text");
  			dataPipeline.appLog("TEXT", "Input Text: " + text);
            String  paddingCharacter = dataPipeline.getString("paddingCharacter");
  			dataPipeline.appLog("PADDING_CHARACTER", "Padding Character: " + paddingCharacter);
            int length = dataPipeline.getInteger("length");
  			dataPipeline.appLog("LENGTH", "Total Length: " + length);

            dataPipeline.put("result", StringUtils.leftPad(text,length,paddingCharacter));
  			dataPipeline.appLog("RESULT", "Padded Text: " +StringUtils.leftPad(text,length,paddingCharacter));

        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
  			dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
            throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
        }
	}

}