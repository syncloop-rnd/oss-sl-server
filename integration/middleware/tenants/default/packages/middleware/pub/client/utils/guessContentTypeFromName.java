package packages.middleware.pub.client.utils;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;

import java.net.URLConnection;
public final class guessContentTypeFromName{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
            String name = dataPipeline.getString("name");
            String mimeType = URLConnection.guessContentTypeFromName(name);
            dataPipeline.put("mimeType", mimeType);
        } catch (Throwable e) {
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
            e.printStackTrace();
        }
	}

}