package packages.middleware.pub.client.webSocket;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.template.WebSocketAccess;
import java.util.*;
public final class read{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  			String name = dataPipeline.getString("terminalName");
  			WebSocketAccess wsa=null;
  			if(name!=null){
              wsa=WebSocketAccess.getWebSocketAccess(name);
              if(wsa!=null){
                Map map=wsa.pickRequestMsg();
                dataPipeline.put("eventData",map);
              }
            }
  			if(wsa==null){
                Map map=dataPipeline.readWSText();
                dataPipeline.put("eventData",map);
  			}
        } catch (Throwable e) {
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
            e.printStackTrace();
        }
	}

}