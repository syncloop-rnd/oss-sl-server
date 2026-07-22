package packages.middleware.pub.io;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.io.IOUtils;
import org.apache.commons.io.input.CharSequenceReader;

import java.io.InputStream;
import java.io.Reader;
public final class streamToReader{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {

            InputStream inputStream = (InputStream) dataPipeline.get("inputStream");
            byte[] buffer = IOUtils.toByteArray(inputStream);
            Reader reader = new CharSequenceReader(new String(buffer));
            dataPipeline.put("reader", reader);

        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
            new SnippetException(dataPipeline,"SnippetException exception", e);
        }
	}

}