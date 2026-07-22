package packages.middleware.pub.xml;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import org.w3c.dom.Element;
public final class addAttribute{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
		dataPipeline.appLog("OPERATION", "addAttribute");
  		String attributeName =  dataPipeline.getAsString("attributeName");
  		dataPipeline.appLog("ATTRIBUTE_NAME", attributeName);
  		String attributeValue =  dataPipeline.getAsString("attributeValue");
  		dataPipeline.appLog("ATTRIBUTE_VALUE", attributeValue);
  		Element xmlNode = (Element) dataPipeline.get("xmlNode");
  	
  		xmlNode.setAttribute(attributeName, attributeValue);
  		dataPipeline.appLog("ATTRIBUTE_SET", "Attribute added successfully.");
} 
catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
  		dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}