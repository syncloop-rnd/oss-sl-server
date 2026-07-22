package packages.middleware.pub.date;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
public final class timeToText{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
        String time = dataPipeline.getString("time");	
  		dataPipeline.put("timeToText",timeToText(time));
      } 
catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}
public static Date parseDate(final String date, final String fromFormat) {
        try {
          if (org.apache.commons.lang3.StringUtils.isBlank(date)) {
            return null;
          }
          return new SimpleDateFormat(fromFormat).parse(date);
        } catch (ParseException e) {
          e.printStackTrace();
        }
        return null;
}

public static String timeToText(String time) throws ParseException {

        Calendar calendar = Calendar.getInstance();
        calendar.setTime(parseDate(time, "HH:mm"));

        StringBuilder sb = new StringBuilder();
        if (calendar.get(Calendar.HOUR_OF_DAY) == 1) {
          sb.append(calendar.get(Calendar.HOUR_OF_DAY)).append(" Hour ");
        } else if (calendar.get(Calendar.HOUR_OF_DAY) > 1) {
          sb.append(calendar.get(Calendar.HOUR_OF_DAY)).append(" Hours ");
        }

        if (calendar.get(Calendar.MINUTE) == 1) {
          sb.append(calendar.get(Calendar.MINUTE)).append(" Minute ");
        } else if (calendar.get(Calendar.MINUTE) > 1) {
          sb.append(calendar.get(Calendar.MINUTE)).append(" Minutes ");
        }

        return sb.toString();
      }

}