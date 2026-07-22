package packages.middleware.pub.date;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Date;
public final class compareDates{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
        Date startDate = (Date)dataPipeline.get("startDateObj");
        Date endDate = (Date)dataPipeline.get("endDateObj");
			
        dataPipeline.put("dateComparison",Long.compare(startDate.getTime(), endDate.getTime()));
      } 
catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}