package packages.middleware.pub.date;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;

import java.util.Calendar;
import java.util.*;

public final class isLastDayOfMonth {
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
        Date date = (Date)dataPipeline.get("dateObj");	
  
        dataPipeline.put("islastDayOfMonth",isLastDayOfMonth(date));
      } 
catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}
public static boolean isLastDayOfMonth(Date date) {
    Calendar calendar = Calendar.getInstance();
    calendar.setTime(date);
    int dayOfMonth = calendar.get(Calendar.DAY_OF_MONTH);
    int lastDayOfMonth = calendar.getActualMaximum(Calendar.DAY_OF_MONTH);

    return dayOfMonth == lastDayOfMonth;
}



}