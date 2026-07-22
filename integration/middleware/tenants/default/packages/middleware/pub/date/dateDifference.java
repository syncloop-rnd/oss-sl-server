package packages.middleware.pub.date;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Date;
public final class dateDifference{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
        Date startDate = (Date)dataPipeline.get("startDateObj");	
        Date endDate = (Date)dataPipeline.get("endDateObj");	

       	LocalDateTime start = LocalDateTime.ofInstant(startDate.toInstant(), ZoneId.systemDefault());	
          LocalDateTime end = LocalDateTime.ofInstant(endDate.toInstant(), ZoneId.systemDefault());	

          Duration duration = Duration.between(start, end);

          long seconds = duration.getSeconds();
          long minutes = duration.toMinutes();
          long hours = duration.toHours();
          long days = duration.toDays();

          dataPipeline.put("seconds",	seconds );
          dataPipeline.put("minutes",	minutes );
          dataPipeline.put("hours",	hours);
          dataPipeline.put("days",	days );
      } 
catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}