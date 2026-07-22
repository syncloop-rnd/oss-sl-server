package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.*;
public final class TextArrayToTextString{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
dataPipeline.appLog("OPERATION", "textArrayToTextString");
List<String> textArray = dataPipeline.getAsList("textArray");
if (null == textArray) {
  dataPipeline.appLog("INFO", "No 'textArray' found, creating a new empty list.");
  textArray = new ArrayList<>();
}
StringBuilder sb = new StringBuilder();
for (String text : textArray) {
  sb.append(text).append(""+"\r\n");
}

dataPipeline.put("textString", sb.toString());
dataPipeline.appLog("TEXT_STRING", "TextString Content: " + sb.toString());
	}

}