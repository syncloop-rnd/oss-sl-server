package packages.middleware.pub.date;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.text.SimpleDateFormat;
import java.util.Date;
public final class stringToDate{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
        String date = dataPipeline.getString("dateStr");
        String pattern = dataPipeline.getString("pattern");
  
        SimpleDateFormat sdf = new SimpleDateFormat(pattern);
        Date stringToDate = sdf.parse(date);
        dataPipeline.put("dateObj",stringToDate);
      } 
catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}