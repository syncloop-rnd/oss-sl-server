package packages.middleware.pub.io;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.io.ByteArrayInputStream;
import org.apache.commons.lang3.StringUtils;
public final class bytesToStream{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {

  byte[] bytes = (byte[])dataPipeline.get("bytes");
  String length = dataPipeline.getString("length");
  String offset = dataPipeline.getString("offset");
  if (StringUtils.isBlank(length)) {
    length = bytes.length + "";
  }
  
  if (StringUtils.isBlank(offset)) {
    offset = "0";
  }
  
  dataPipeline.put("inputStream", new ByteArrayInputStream(bytes, Integer.parseInt(offset), Integer.parseInt(length)));
  
} catch (Exception e) {
  	dataPipeline.clear();
  	dataPipeline.put("error",e.getMessage());
  	new SnippetException(dataPipeline,"Sneppet exception", new Exception(e));
}
	}

}