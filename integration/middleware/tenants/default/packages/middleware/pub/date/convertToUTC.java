package packages.middleware.pub.date;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.Date;
import java.util.TimeZone;
import java.time.*;
public final class convertToUTC{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    Date time = (Date) dataPipeline.get("dateObj");
  	String fromZoneId = dataPipeline.getString("fromZoneId");
    LocalDateTime ldt = toLocalDateTime(time);
	ZoneId singaporeZoneId = ZoneId.of(fromZoneId);
	ZonedDateTime asiaZonedDateTime = ldt.atZone(singaporeZoneId);
	ZoneId newYokZoneId = ZoneId.of("UTC");
	ZonedDateTime nyDateTime = asiaZonedDateTime.withZoneSameInstant(newYokZoneId);
    dataPipeline.put("convertedToUTC", asDate(nyDateTime.toLocalDateTime()));
} catch (Exception e) {
    dataPipeline.clear();
    dataPipeline.put("error", e.getMessage());
    throw new SnippetException(dataPipeline, "Snippet exception", e);
}

	}
private static LocalDateTime toLocalDateTime(Date date) {
		return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
	}

private static Date asDate(LocalDateTime localDateTime) {
		return Date.from(localDateTime.atZone(ZoneId.systemDefault()).toInstant());
	}

}