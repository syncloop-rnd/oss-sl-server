package packages.middleware.pub.date;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Date;
public final class dateSubtract{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
        try {
          Date date = dataPipeline.getAsDate("date");	
          Integer days = dataPipeline.getInteger("days");	

          LocalDateTime localDate = LocalDateTime.ofInstant(date.toInstant(), ZoneId.systemDefault());
          LocalDate newLocalDate = localDate.toLocalDate().minusDays(days);
          Date newDate = Date.from(newLocalDate.atStartOfDay(ZoneId.systemDefault()).toInstant());
      	  dataPipeline.put("newDate", newDate);
        } catch (Exception e) {
          dataPipeline.clear();
          dataPipeline.put("error",e.getMessage());
          throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  		}
	}

}