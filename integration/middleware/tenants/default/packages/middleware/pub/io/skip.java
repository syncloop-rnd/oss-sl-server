package packages.middleware.pub.io;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.io.IOUtils;
import org.apache.commons.io.input.CharSequenceReader;
import java.io.InputStream;
import java.io.Reader;
public final class skip{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  		InputStream inputStream = (InputStream) dataPipeline.get("inputStream");
  		Reader reader = (Reader)dataPipeline.get("reader");	
  	
  		Integer length = dataPipeline.getAsInteger("length");
  
  		if( inputStream !=null){
          	long bytesSkipped = inputStream.skip(length);
    	 	dataPipeline.put("bytesSkipped", bytesSkipped);
         
        }		
  		else if(reader !=null){
            long charsSkipped = reader.skip(length);
          	dataPipeline.put("charsSkipped", charsSkipped);
        }
  

        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
            new SnippetException(dataPipeline,"SnippetException exception", e);
        }
	}

}