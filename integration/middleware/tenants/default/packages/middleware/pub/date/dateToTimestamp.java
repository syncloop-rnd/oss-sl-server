package packages.middleware.pub.date;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.Date;

public final class dateToTimestamp{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
            Date date = dataPipeline.getAsDate("date");
            
            dataPipeline.put("timestamp", date.getTime());
        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
            throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
        }
	}

}