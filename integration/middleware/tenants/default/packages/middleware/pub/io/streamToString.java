package packages.middleware.pub.io;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.io.IOUtils;

import java.io.InputStream;
import java.nio.charset.Charset;
public final class streamToString{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {

            InputStream inputStream = (InputStream) dataPipeline.get("inputStream");
            dataPipeline.put("content", IOUtils.toString(inputStream, Charset.defaultCharset()));
        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
            new SnippetException(dataPipeline,"SnippetException exception", e);
        }
	}

}