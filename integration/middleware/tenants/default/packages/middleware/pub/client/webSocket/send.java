package packages.middleware.pub.client.webSocket;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.template.WebSocketAccess;
public final class send{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
            String text = dataPipeline.getString("text");
  			Object obj = dataPipeline.get("doc");
  			String name = dataPipeline.getString("terminalName");
  			String code = dataPipeline.getString("terminalCode");
  			WebSocketAccess wsa=null;
  			if(name!=null){
              if(code==null){
              	dataPipeline.put("error", "Terminal name and code both are required.");
                return;
              }
              wsa=WebSocketAccess.getWebSocketAccess(name);
              if(wsa==null){
              	dataPipeline.put("error", "Terminal not registered or disconnected.");
                return;
              }
              if(!code.equals(wsa.getUuid())){
              	dataPipeline.put("error", "Access denied: Wrong terminal code.");
                return;
              }
              if(wsa!=null){
              	if(obj==null)
                  obj = dataPipeline.get("docList");
                if(obj!=null)
                  wsa.sendText(obj);
                else if(text!=null)
                  wsa.sendText(text);
              }
            }
  
  			if(wsa==null){
              if(obj==null)
                obj = dataPipeline.get("docList");
              if(obj!=null)
                dataPipeline.sendWSObject(obj);
              else if(text!=null)
                dataPipeline.sendWSText(text);
            }
        } catch (Throwable e) {
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
            e.printStackTrace();
        }
	}

}