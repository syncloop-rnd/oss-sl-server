package packages.middleware.pub.date;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.Set;
import java.util.Date;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Date;

public final class getWorkingDays{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
        Date startDate = (Date)dataPipeline.get("startDateObj");
        Date endDate = (Date)dataPipeline.get("endDateObj");
		
        LocalDate formattedStartDate = startDate.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        LocalDate formattedEndDate = endDate.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();

		long days = ChronoUnit.DAYS.between(formattedStartDate, formattedEndDate);
		int workingDays = 0;
		for (int i = 0; i <= days; i++) {
			LocalDate date = formattedStartDate.plusDays(i);
			if (date.getDayOfWeek().getValue() < 6) {
				workingDays++;
			}
        }
           dataPipeline.put("workingDays", workingDays);
      } 
catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}