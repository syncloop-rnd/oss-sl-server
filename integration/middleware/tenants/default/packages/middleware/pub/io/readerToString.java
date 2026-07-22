package packages.middleware.pub.io;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.io.IOUtils;

import java.io.Reader;

public final class readerToString{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {

            Reader reader = (Reader) dataPipeline.get("reader");
            dataPipeline.put("content", IOUtils.toString(reader));

        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
            new SnippetException(dataPipeline,"SnippetException exception", e);
        }
	}

}