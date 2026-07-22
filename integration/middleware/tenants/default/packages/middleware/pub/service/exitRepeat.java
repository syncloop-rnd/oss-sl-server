package packages.middleware.pub.service;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class exitRepeat{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
dataPipeline.appLog("OPERATION", "exitRepeat");
String msg=dataPipeline.getString("msg");
if(msg==null)
  msg="Default exception";
  dataPipeline.appLog("ERROR_MESSAGE", msg);
//dataPipeline.log(msg);
throw new SnippetException(dataPipeline,msg, new Exception(msg));
	}

}