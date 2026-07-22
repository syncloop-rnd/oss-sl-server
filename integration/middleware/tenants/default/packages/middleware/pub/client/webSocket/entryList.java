package packages.middleware.pub.client.webSocket;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.template.WebSocketAccess;
import java.util.*;
public final class entryList{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
	    try {
            List<String> list=WebSocketAccess.listWSA();
   			dataPipeline.put("terminalName", list);
        } catch (Throwable e) {
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
            e.printStackTrace();
        }
	}

}