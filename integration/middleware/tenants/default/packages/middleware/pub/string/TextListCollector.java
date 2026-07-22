package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.*;
public final class TextListCollector{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
dataPipeline.appLog("OPERATION", "TextListCollector");
String text = dataPipeline.getAsString("text");
List<String> textArray = dataPipeline.getAsList("textArray");
if (null == textArray) {
  dataPipeline.appLog("INFO", "'textArray' not found, creating a new list.");
  textArray = new ArrayList<>();
}
textArray.add(text);
dataPipeline.put("textArray", textArray);
dataPipeline.appLog("RESULT", "Added 'text' to 'list'");
	}

}