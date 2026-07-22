package packages.middleware.pub.math;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
public final class stringToNumber{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
        String stringNum = dataPipeline.getString("stringNum");
        String convertAs = dataPipeline.getString("convertAs");

        Map<String, Function<String, Number>> conversionFunctions = new HashMap<>();
        conversionFunctions.put("integer", Integer::parseInt);
        conversionFunctions.put("float", Float::parseFloat);
        conversionFunctions.put("long", Long::parseLong);
        conversionFunctions.put("short", Short::parseShort);
        conversionFunctions.put("bigdecimal", BigDecimal::new);
        conversionFunctions.put("biginteger", BigInteger::new);

        Function<String, Number> conversionFunction = conversionFunctions.getOrDefault(convertAs.toLowerCase(), Double::parseDouble);
        dataPipeline.put("convertAsNumber", conversionFunction.apply(stringNum));
      } 
catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}