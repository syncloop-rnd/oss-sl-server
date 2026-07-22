package packages.middleware.pub.io;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.io.Closeable;
public final class close{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  
  	Closeable closableObj = (Closeable)dataPipeline.get("closableObj");
  	closableObj.close();
} catch (Exception e) {
  	dataPipeline.clear();
  	dataPipeline.put("error",e.getMessage());
  	new SnippetException(dataPipeline,"Sneppet exception", new Exception(e));
}
	}

}