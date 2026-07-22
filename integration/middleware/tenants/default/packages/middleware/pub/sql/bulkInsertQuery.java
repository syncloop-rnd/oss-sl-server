package packages.middleware.pub.sql;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringUtils;
import java.util.*;
public final class bulkInsertQuery{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
            dataPipeline.appLog("OPERATION", "bulkInsertQuery");
  			String lines[] = (String[])dataPipeline.get("lines");
  			dataPipeline.appLog("INPUT_LINES", "Lines: " + Arrays.toString(lines));
            String tableName = dataPipeline.getAsString("tableName");
            dataPipeline.appLog("TABLE_NAME", "Table Name: " + tableName);
  			String format = "%s,%s,%s,%s,%s,%s,%s,%s";//dataPipeline.getAsString("format");
  			dataPipeline.appLog("FORMAT", "Format: " + format);
  			List<String> quries=new ArrayList<String>();
            for (String line: lines) {
                String[] lineArray = StringUtils.split(line, ",");
                StringBuilder query = new StringBuilder();
                for (int i = 0 ; i < lineArray.length ; i++) {
                    query.append("'").append(lineArray[i]).append("'").append(",");
                }
                quries.add("(" + StringUtils.strip(query.toString(), ",") + ")");
              	dataPipeline.appLog("QUERY_ADDED", "Query added successfully");
            }
  			dataPipeline.put("queries", String.format("INSERT INTO %s VALUES %s", tableName, StringUtils.join(quries, ",")) );

        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
  			dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
            throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
        }
	}

}