package packages.middleware.pub.date;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
public final class dateToString{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
        Date date = (Date)dataPipeline.get("dateObj");
  		if (null == date) {
          date = new Date();
        }
        String pattern = dataPipeline.getString("pattern");
        SimpleDateFormat dateFormat = new SimpleDateFormat(pattern);
        dataPipeline.put("dateStr",dateFormat.format(date));
  
      } 
catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}