package packages.middleware.pub.date;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.ResolverStyle;
import java.util.Locale;
import java.util.concurrent.TimeUnit;
import java.util.Date;
public final class elapsedNanoTime{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
        Long nanoTime = (long)dataPipeline.get("nanoTime");	
        long currentTime = System.nanoTime();

        if (nanoTime > currentTime || nanoTime<0) {
          dataPipeline.put("elapsedNanoTime",0);
        } else {
          long diff = currentTime - nanoTime;
          long years = TimeUnit.NANOSECONDS.toDays(diff) / 365;
          long days = TimeUnit.NANOSECONDS.toDays(diff) % 365;
          long hours = TimeUnit.NANOSECONDS.toHours(diff) % 24;
          long minutes = TimeUnit.NANOSECONDS.toMinutes(diff) % 60;
          long seconds = TimeUnit.NANOSECONDS.toSeconds(diff) % 60;
          long millis = TimeUnit.NANOSECONDS.toMillis(diff) % 1000;
          long micros = TimeUnit.NANOSECONDS.toMicros(diff) % 1000;
          long nanos = diff % 1000;

          String result = String.format("%d %d %d %d %d %d %d %d",
                                        years, days, hours, minutes, seconds, millis, micros, nanos);
          dataPipeline.put("elapsedNanoTimeStr", result);
          dataPipeline.put("elapsedNanoTime", diff);
        }
  
  }
catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}