package packages.middleware.pub.io;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.io.IOUtils;
public final class createAnEmptyByteArray{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
	dataPipeline.put("bytes", IOUtils.byteArray());
} catch (Exception e) {
  	dataPipeline.clear();
  	dataPipeline.put("error",e.getMessage());
  	new SnippetException(dataPipeline,"Sneppet exception", new Exception(e));
}
	}

}