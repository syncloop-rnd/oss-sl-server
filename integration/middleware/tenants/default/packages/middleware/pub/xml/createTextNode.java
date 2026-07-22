package packages.middleware.pub.xml;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import org.w3c.dom.Text;
import org.w3c.dom.Document;
public final class createTextNode{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  	dataPipeline.appLog("OPERATION", "createTextNode");
    String text = dataPipeline.getAsString("text");
  	dataPipeline.appLog("TEXT_CONTENT", text);
    Document domDocument = (Document) dataPipeline.get("domDocument");
  	Text textNode = domDocument.createTextNode(text);
  	dataPipeline.put("textNode", textNode);
  	dataPipeline.appLog("TEXT_NODE_CREATED", "Text node created successfully.");
  
} catch (Exception e) {
    dataPipeline.clear();
    dataPipeline.put("error", e.getMessage());
  	dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
    throw new SnippetException(dataPipeline, "Snippet exception", e);
}
	}

}