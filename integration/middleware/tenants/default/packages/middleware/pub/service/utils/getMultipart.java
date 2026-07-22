package packages.middleware.pub.service.utils;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.MultiPart;
import java.util.Map;
public final class getMultipart{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  dataPipeline.appLog("OPERATION", "getMultipart");
  Boolean readAsStream = dataPipeline.getAsBoolean("readAsStream");
  
  if (null != readAsStream || (null != readAsStream && readAsStream)) {
    dataPipeline.put("inputStream", dataPipeline.getBodyAsStream());
    return ;
  }
  
  Map<String,Object> formData=null;
  if(dataPipeline.getMultiPart()!=null)
    formData=dataPipeline.getMultiPart().formData;
 
  if(formData!=null){
  	dataPipeline.put("formData",formData);
  	dataPipeline.appLog("FORM_DATA", "Form data found.");
  }
  else{
  	 byte[] bytes = dataPipeline.getBody();
  	 dataPipeline.put("bytes",bytes);
     dataPipeline.appLog("BYTES_PRESENT", "Body bytes found.");
  }
} catch (Exception e) {
  e.printStackTrace();
	dataPipeline.clear();
	dataPipeline.put("error", e.getMessage());
  	dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
	e.printStackTrace();
}
	}

}