package packages.middleware.pub.xml;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import org.w3c.dom.Document;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.DocumentBuilder;
public final class createDocument{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  		dataPipeline.appLog("OPERATION", "createDocument");
  		DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document doc = builder.newDocument();
  		dataPipeline.put("domDocument", doc);
  		dataPipeline.appLog("DOCUMENT_CREATED", "A new DOM document created successfully.");
      } 
catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
  		dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}