package packages.middleware.pub.json;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class toString{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{
  
  Object obj = dataPipeline.get("root");
  Boolean wrapIt=dataPipeline.getAsBoolean("enableRootWrapper");
  String jsonString="";
  jsonString=ServiceUtils.objectToJson(obj);
  dataPipeline.put("jsonString",jsonString);
  
}catch(Exception e){
	dataPipeline.clear();
  	dataPipeline.put("error",e.getMessage());
  	new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
}
	}

}