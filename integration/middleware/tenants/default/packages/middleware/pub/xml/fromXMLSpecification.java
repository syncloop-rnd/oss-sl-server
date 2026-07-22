package packages.middleware.pub.xml;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.Map;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.Text;
import java.util.List;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.StringWriter;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.stream.StreamResult;
import javax.xml.transform.dom.DOMSource;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.w3c.dom.Element;
import org.w3c.dom.Text;
public final class fromXMLSpecification{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
		dataPipeline.appLog("OPERATION", "fromXMLSpecification");
        String json = dataPipeline.getAsString("json");	
		dataPipeline.appLog("INPUT_JSON", json);
        Document doc = newXmlBuilder();
		dataPipeline.appLog("XML_BUILDER", "New XML builder created");
        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> map = mapper.readValue(json, Map.class);
		dataPipeline.appLog("JSON_TO_MAP", "Converted JSON to Map: " + map.toString());
        Document document = convertToXml(map,doc);
		dataPipeline.appLog("MAP_TO_XML", "Converted Map to XML Document");
        String build = build(document);
        dataPipeline.put("xml", build);
  		dataPipeline.appLog("XML_OUTPUT", build);
}
catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
  		dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}
public static Document convertToXml(Map<String, Object> map, Document document) {

        Document doc = document;
        Object tagName = map.get("tagName");
        Element element = createNode((String) tagName, doc);

        String obj = null;
        for (String key : map.keySet()) {
            if (key.startsWith("@")) {
                obj = (String) map.get(key);
                addAttribute(key.substring(1), obj, element);
            }
        }

        Object text = map.get("text");
        if (text != null) {
            Text textNode = createTextNode((String) text, doc);
            addChildNode(element, textNode);
        }

        List<Map<String, Object>> children = (List<Map<String, Object>>) map.get("childrens");
        if (children != null) {
            for (Map<String, Object> childMap : children) {
                Element childElement = convertToXml(childMap, doc).getDocumentElement();
                addChildNode(element, childElement);
            }
        }
        document.appendChild(element);
        return doc;
    }

  public static Document newXmlBuilder() throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = factory.newDocumentBuilder();
        return builder.newDocument();
    }

 public static String build(Document doc) throws Exception {
        return serialize(doc);
    }

    private static String serialize(Document doc) throws Exception {
        TransformerFactory tf = TransformerFactory.newInstance();
        Transformer transformer = tf.newTransformer();
        transformer.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "yes");
        StringWriter writer = new StringWriter();
        transformer.transform(new DOMSource(doc), new StreamResult(writer));
        return writer.getBuffer().toString().replaceAll("\n|\r", "");
    }

public static Text createTextNode(String str, Document doc) {
        return doc.createTextNode(str);
   }

public static void addAttribute(String attributeName, String attributeValue, Element currentElement) {
        currentElement.setAttribute(attributeName, attributeValue);
    }

public static void addChildNode(Node parent, Node child) {
        parent.appendChild(child);
    }

public static Element createNode(String elementName, Document doc) {
		Element newElement = doc.createElement(elementName);
		return newElement;
	
}
}