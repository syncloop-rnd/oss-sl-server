package packages.middleware.pub.io;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.io.InputStream;
import java.io.Reader;
public final class reset{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
        InputStream inputStream = (InputStream) dataPipeline.get("inputStream");
        Reader reader = (Reader)dataPipeline.get("reader");	
  
        if(inputStream!=null)
        {
            if(inputStream.markSupported())
            {
                inputStream.reset();
                dataPipeline.put("inputStream", inputStream);
              }
        }
        if(reader!=null)
        {
            if(reader.markSupported())
            {
                reader.reset();
                dataPipeline.put("reader", reader);
            }
        }
} catch (Exception e) {
  	dataPipeline.clear();
  	dataPipeline.put("error",e.getMessage());
  	new SnippetException(dataPipeline,"Sneppet exception", new Exception(e));
}
	}

}