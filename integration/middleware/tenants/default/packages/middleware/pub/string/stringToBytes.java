package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class stringToBytes{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{
  dataPipeline.appLog("OPERATION", "sringToBytes");
  String text=dataPipeline.getString("text");
  dataPipeline.appLog("INPUt_TEXT", text);
  if(text!=null)
  	dataPipeline.put("bytes",text.getBytes());
  	dataPipeline.appLog("RESULT", " to Bytes: " + text.getBytes());
}catch(Exception e){
	dataPipeline.clear();
  	dataPipeline.put("error",e.getMessage());
  	dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
  	new SnippetException(dataPipeline,"Sneppet exception", new Exception(e));
}
	}

}