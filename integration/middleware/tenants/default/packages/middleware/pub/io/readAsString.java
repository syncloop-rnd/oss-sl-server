package packages.middleware.pub.io;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;

import java.io.Reader;
public final class readAsString{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {

            Reader reader = (Reader) dataPipeline.get("reader");
            String length = dataPipeline.getString("length");
            char[] cbuf = new char[Integer.parseInt(length)];
            int lengthRead = reader.read(cbuf);

            dataPipeline.put("lengthRead", lengthRead + "");
            dataPipeline.put("value", new String(cbuf));


        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
            new SnippetException(dataPipeline,"SnippetException exception", e);
        }
	}

}