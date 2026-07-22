package packages.middleware.pub.util;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.flow.Function;
public final class JavaFunctionExec{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{

	com.eka.middleware.sdk.api.FunctionInvoker.exec(dataPipeline);
	}

}