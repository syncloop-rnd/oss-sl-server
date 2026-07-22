package packages.middleware.pub.file.flat;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import java.io.*;
import java.util.*;

public final class csvReader{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
Reader reader = (Reader)dataPipeline.get("bufferedReader");
try (CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT.withAllowMissingColumnNames());) {
	
	List<Map<String, Object>> list = new ArrayList<>();
            List<String> headers = new ArrayList<>();

            for (CSVRecord csvRecord : csvParser) {

                if (csvRecord.getRecordNumber() == 1) {

                    for (int i = 0 ; i < csvRecord.size() ; i++) {
                        headers.add(csvRecord.get(i));
                    }

                    continue;
                }

                Map<String, Object> map = new HashMap<>();
                for (int i = 0 ; i < csvRecord.size() ; i++) {
                    map.put(headers.get(i), csvRecord.get(i));
                }
                list.add(map);
            }
  dataPipeline.put("csvData", list);
  dataPipeline.put("total", csvParser.getRecordNumber());
} catch (Exception e) {}
	}

}