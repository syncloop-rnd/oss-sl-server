package packages.middleware.pub.util;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.UUID;
public final class generateUUID{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
dataPipeline.put("uuid", UUID.randomUUID().toString());
	}

}