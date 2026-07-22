package packages.middleware.pub.xml;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import java.util.List;
import java.util.ArrayList;
public final class createNode{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  	dataPipeline.appLog("OPERATION", "createNode");
    String nodeName = dataPipeline.getAsString("nodeName");
  	dataPipeline.appLog("NODE_NAME", nodeName);
    Document domDocument = (Document) dataPipeline.get("domDocument");
    dataPipeline.put("xmlNode", createNode(nodeName,domDocument));
  	dataPipeline.appLog("XML_NODE", createNode(nodeName,domDocument).toString());
  
} catch (Exception e) {
    dataPipeline.clear();
    dataPipeline.put("error", e.getMessage());
  	dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
    throw new SnippetException(dataPipeline, "Snippet exception", e);
}
	}
public static Element createNode(String elementName, Document doc) {
		Element newElement = doc.createElement(elementName);
		return newElement;
	
}
	
}