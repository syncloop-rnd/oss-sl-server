package packages.middleware.pub.platform;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.update.PluginInstaller;
import com.eka.middleware.service.RuntimePipeline;
public final class installPlugin{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
  String pluginId = dataPipeline.getString("pluginId");
  String version = dataPipeline.getString("version");
  String token = dataPipeline.getAsString("token");
  RuntimePipeline parentRp = RuntimePipeline.getRP();
  new Thread(() -> {
      try {
        parentRp.cloneThreadLocal();
        com.eka.middleware.update.PluginInstaller.installPlugin(pluginId, version, token, dataPipeline);
        ServiceUtils.expireServiceCache("packages.middleware.pub.server.browse.getPackagesAsTree");
      } catch (Exception e) {
        dataPipeline.clear();
        e.printStackTrace();
        new SnippetException(dataPipeline,"Snippet exception", e);
      }
    }).start();

    dataPipeline.put("status", "202");
    dataPipeline.put("message", "Plugin Installation process started in background.");
	}

}