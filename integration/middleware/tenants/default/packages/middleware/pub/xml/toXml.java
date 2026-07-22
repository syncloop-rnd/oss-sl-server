package packages.middleware.pub.xml;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class toXml{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
	try {
			dataPipeline.appLog("OPERATION", "toXML");
            Object o = dataPipeline.get("root");
            String rootNodeName = dataPipeline.getString("rootNodeName");
      		dataPipeline.appLog("ROOT_NAME_NAME", rootNodeName);
            dataPipeline.put("text", ServiceUtils.xmlToString(o, rootNodeName));

        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
      		dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
            new SnippetException(dataPipeline,"SnippetException exception", e);
        }
	}

}