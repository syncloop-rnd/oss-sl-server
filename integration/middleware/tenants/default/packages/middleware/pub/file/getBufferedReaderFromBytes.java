package packages.middleware.pub.file;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.io.*;
public final class getBufferedReaderFromBytes{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {

            byte[] data = (byte[])dataPipeline.get("bytes");
            ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(data);
            BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(byteArrayInputStream));
            dataPipeline.put("bufferedReader", bufferedReader);

        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
            throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
        }
	}

}