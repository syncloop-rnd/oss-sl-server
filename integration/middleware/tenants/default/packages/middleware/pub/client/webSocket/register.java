package packages.middleware.pub.client.webSocket;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.template.WebSocketAccess;
public final class register{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
            String name = dataPipeline.getString("name");
  			String UUID = dataPipeline.getString("UUID");
            WebSocketAccess.addWebSocketAccess(UUID,name,dataPipeline.rp.getWsa());
        } catch (Throwable e) {
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
            e.printStackTrace();
        }
	}

}