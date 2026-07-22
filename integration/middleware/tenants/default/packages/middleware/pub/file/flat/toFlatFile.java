package packages.middleware.pub.file.flat;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.io.output.StringBuilderWriter;
import java.util.*;
import java.util.stream.Collectors;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;

public final class toFlatFile{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
StringBuilderWriter stringBuilderWriter = new StringBuilderWriter();  
String delimiter = dataPipeline.getString("delimiter");
String recordSeparator = dataPipeline.getString("recordSeparator");
String quote = dataPipeline.getString("quote");
String order = dataPipeline.getString("order");
Boolean includeHeaderRow = (Boolean)dataPipeline.get("includeHeaderRow");

if(includeHeaderRow==null)
  includeHeaderRow=false;

List<String> indexedOrder=null;

if(order!=null){
  order=order.replace(" ","");
  indexedOrder=Arrays.asList(order.split(","));
}


if(delimiter==null)
  delimiter=",";

if(recordSeparator==null)
   recordSeparator=System.lineSeparator();

CSVFormat format=CSVFormat.DEFAULT.withDelimiter(delimiter.toCharArray()[0]).withRecordSeparator(recordSeparator);
if(quote!=null)
format=format.withQuote(quote.toCharArray()[0]);
 try (CSVPrinter printer = new CSVPrinter(stringBuilderWriter, format);) {
    List<Map<String, Object>> list = (List<Map<String, Object>>) dataPipeline.get("rows");

   if(includeHeaderRow)
     printer.printRecord(indexedOrder);
   
   for (Map<String, Object> row : list) {
        printer.printRecord(indexedOrder.stream().map(header -> (String)row.get(header)).collect(Collectors.toList()));
   }
   
   printer.flush();
    
    dataPipeline.put("flatFileContent", stringBuilderWriter.toString());
  } catch (Exception e) {

  }
	}

}