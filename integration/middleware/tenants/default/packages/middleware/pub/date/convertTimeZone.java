package packages.middleware.pub.date;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.text.SimpleDateFormat;
import java.time.ZoneId;
import java.time.*;
import java.util.*;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import java.sql.Time;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Date;
public final class convertTimeZone{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{

            try {
                Date date = (Date)dataPipeline.get("dateObj");
                String fromTimeZone = dataPipeline.getString("fromTimeZone");
                String toTimeZone = dataPipeline.getString("toTimeZone");

                dataPipeline.put("convertedTimezoneDate",geoTimeConversion(fromTimeZone, toTimeZone, date));
            }
            catch (Exception e) {
                dataPipeline.clear();
                dataPipeline.put("error",e.getMessage());
                throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
            }


	}
/**
     * @param localDateTime
     * @return
     */
    public static Date asDate(LocalDateTime localDateTime) {
        return Date.from(localDateTime.atZone(ZoneId.systemDefault()).toInstant());
    }

    /**
     * @param fromZoneId
     * @param toZoneId
     * @param time
     * @return
     */
    public static Date geoTimeConversion(String fromZoneId , String toZoneId , Date time) {

        if (null == time) {
            return null;
        }

        LocalDateTime ldt = toLocalDateTime(time);
        ZoneId singaporeZoneId = ZoneId.of(fromZoneId);
        ZonedDateTime asiaZonedDateTime = ldt.atZone(singaporeZoneId);
        ZoneId newYokZoneId = ZoneId.of(toZoneId);
        ZonedDateTime nyDateTime = asiaZonedDateTime.withZoneSameInstant(newYokZoneId);
        return asDate(nyDateTime.toLocalDateTime());

    }

    /**
     * @param date
     * @return
     */
    public static LocalDateTime toLocalDateTime(Date date) {
        if (date instanceof Time) {
            date = new Date(date.getTime());
        }
        return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
    
	}
}