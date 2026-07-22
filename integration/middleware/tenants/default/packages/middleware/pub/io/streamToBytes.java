package packages.middleware.pub.io;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.io.InputStream;
import org.apache.commons.io.IOUtils;
public final class streamToBytes{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  
  	InputStream inputStream = (InputStream)dataPipeline.get("stream");
	dataPipeline.put("bytes", IOUtils.toByteArray(inputStream));
} catch (Exception e) {
  	dataPipeline.clear();
  	dataPipeline.put("error",e.getMessage());
  	new SnippetException(dataPipeline,"Sneppet exception", new Exception(e));
}
	}

}