package packages.middleware.pub.date;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.*;

public final class getCurrentDateTime{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{

String format = dataPipeline.getString("format");
DateFormat df = new SimpleDateFormat(format);
Date today = Calendar.getInstance().getTime();
String todayAsString = df.format(today);

dataPipeline.put("curDatetime", todayAsString);
	}

}