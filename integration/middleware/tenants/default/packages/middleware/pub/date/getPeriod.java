package packages.middleware.pub.date;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.Date;
import java.util.TimeZone;
public final class getPeriod{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
        Date startDateObj = (Date)dataPipeline.get("startDateObj");
  		Date endDateObj = (Date)dataPipeline.get("endDateObj");	
        dataPipeline.put("period",	Period.between(toLocalDate(startDateObj), toLocalDate(endDateObj)));
      } 
catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

	public static LocalDate toLocalDate(Date date) {
		return toLocalDateTime(date).toLocalDate();
	}

	public static LocalDateTime toLocalDateTime(Date date) {
		return LocalDateTime.ofInstant(date.toInstant(), TimeZone.getDefault().toZoneId());
	}
}