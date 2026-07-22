package packages.middleware.pub.sql;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringUtils;
import java.util.*;
public final class stringToQuery{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
            dataPipeline.appLog("OPERATION", "stringToQuery");
  			String lines[] = (String[])dataPipeline.get("lines");
  			dataPipeline.appLog("INPUT_LINES", "Lines: " + Arrays.toString(lines));
            String tableName = dataPipeline.getAsString("tableName");
  			dataPipeline.appLog("TABLE_NAME", "Table Name: " + tableName);
            String format = "%s,%s,%s,%s,%s,%s,%s,%s";//dataPipeline.getAsString("format");
  			dataPipeline.appLog("FORMAT", "Format: " + format);
  			List<String> quries=new ArrayList<String>();
            for (String line: lines) {
                String[] lineArray = StringUtils.split(line, ",");
               String query = String.format("INSERT INTO %s VALUES('%s','%s',%s,%s,%s,%s,%s,%s)",
                        tableName, lineArray[0], lineArray[1],lineArray[2], lineArray[3], lineArray[4], lineArray[5],
                        lineArray[6], lineArray[7]);
              quries.add(query);
              dataPipeline.appLog("QUERY_ADDED", "query added successfully");
            }
  			dataPipeline.put("lines", quries);
  			dataPipeline.appLog("LINES", quries.toString());

        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
  			dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
            throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
        }
	}

}