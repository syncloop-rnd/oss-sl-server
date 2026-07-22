package packages.middleware.pub.platform;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;

public final class getMarketPlace{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{
  		int start = dataPipeline.getInteger("start");
        int length = dataPipeline.getInteger("length");
  		Integer category = dataPipeline.getInteger("category");
  		String sortBy = dataPipeline.getString("sortBy");
  		String name = dataPipeline.getString("name");

  dataPipeline.put("marketplace", com.eka.middleware.update.PluginInstaller.getMarketPlaceV2(dataPipeline, start, length, category, name, sortBy));
  } catch (Exception e) {
      dataPipeline.clear();
      dataPipeline.put("error",e.getMessage());
      new SnippetException(dataPipeline,"Snippet exception", e);
  }
	}

}