package packages.middleware.pub.util;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class ContextObjectExec{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
com.eka.middleware.sdk.api.FunctionInvoker.execContextObject(dataPipeline);
	}

}