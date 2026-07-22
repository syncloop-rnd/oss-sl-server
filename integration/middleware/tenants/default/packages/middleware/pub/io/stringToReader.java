package packages.middleware.pub.io;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;

import java.io.Reader;
import java.io.StringReader;
public final class stringToReader{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {

            String content = dataPipeline.getString("content");
            Reader reader = new StringReader(content);
            dataPipeline.put("reader", reader);
        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
            new SnippetException(dataPipeline,"SnippetException exception", e);
        }
	}

}