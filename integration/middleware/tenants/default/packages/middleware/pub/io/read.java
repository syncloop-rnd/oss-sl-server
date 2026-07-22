package packages.middleware.pub.io;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.io.InputStream;
import org.apache.commons.lang3.StringUtils;
public final class read{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {

  InputStream inputStream = (InputStream)dataPipeline.get("inputStream");
  byte[] bytes = (byte[])dataPipeline.get("bytes");
  String length = dataPipeline.getString("length");
  String offset = dataPipeline.getString("offset");
  if (StringUtils.isBlank(length)) {
    length = bytes.length + "";
  }
  
  if (StringUtils.isBlank(offset)) {
    offset = "0";
  }
  
  inputStream.read(bytes, Integer.parseInt(offset), Integer.parseInt(length));
  dataPipeline.put("bytes", bytes);
  dataPipeline.put("bytesRead", new String(bytes));
  
  
} catch (Exception e) {
  	dataPipeline.clear();
  	dataPipeline.put("error",e.getMessage());
  	new SnippetException(dataPipeline,"SnippetException exception", e);
}
	}

}