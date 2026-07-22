package packages.middleware.pub.io;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringUtils;
public final class replace{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {

            String text = dataPipeline.getString("text");
            String searchString = dataPipeline.getString("searchString");
            String replacement = dataPipeline.getString("replacement");
            String max = dataPipeline.getString("max");
            String ignoreCase = dataPipeline.getString("ignoreCase");

            if (StringUtils.isBlank(max)) {
                max = "-1";
            }

            if (Boolean.parseBoolean(ignoreCase)) {
                dataPipeline.put("value", StringUtils.replaceIgnoreCase(text, searchString, replacement, Integer.parseInt(max)));
            } else {
                dataPipeline.put("value", StringUtils.replace(text, searchString, replacement, Integer.parseInt(max)));
            }

        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
            new SnippetException(dataPipeline,"SnippetException exception", e);
        }
	}

}