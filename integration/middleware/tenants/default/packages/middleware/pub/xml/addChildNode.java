package packages.middleware.pub.xml;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import org.w3c.dom.Node;
public final class addChildNode{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  		dataPipeline.appLog("OPERATION", "appendChildNode");
        Node parent =(Node) dataPipeline.get("parent");
  		dataPipeline.appLog("PARENT_NODE", parent.getNodeName());
        Node child = (Node)dataPipeline.get("child");
  		dataPipeline.appLog("CHILD_NODE", child.getNodeName());
       
  		parent.appendChild(child);
  		dataPipeline.appLog("APPENDED_CHILD", "Child node appended to parent node successfully.");
      } 
catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
  		dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}