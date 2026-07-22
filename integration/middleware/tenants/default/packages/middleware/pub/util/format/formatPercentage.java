package packages.middleware.pub.util.format;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.text.NumberFormat;
import java.util.Locale;
import java.math.RoundingMode;

public final class formatPercentage{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  		dataPipeline.appLog("OPERATION", "formatPercentage");
  		Double number = (Double)dataPipeline.getAsNumber("number");
  		dataPipeline.appLog("NUMBER", number.toString());
 	    Integer decimalPlaces = dataPipeline.getAsInteger("decimalPlaces");
  		dataPipeline.appLog("DECIMAL_PLACES", decimalPlaces.toString());
  
	    dataPipeline.put("result", formatPercentage(number,decimalPlaces));	
  		dataPipeline.appLog("FORMATTED_PERCENTAGE", formatPercentage(number, decimalPlaces));
} 
catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
  		dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

	public static String formatPercentage(double numberToFormat, int decimalPlaces) {
		if (numberToFormat == 0) {
			return "";
		}

		DecimalFormat formatter = (DecimalFormat) NumberFormat.getInstance(Locale.US);
		DecimalFormatSymbols symbols = formatter.getDecimalFormatSymbols();
		symbols.setGroupingSeparator(',');
		formatter.setNegativePrefix("-");
		formatter.setPositivePrefix("");
		formatter.setDecimalFormatSymbols(symbols);
		formatter.setMaximumFractionDigits(decimalPlaces);
		formatter.setMinimumFractionDigits(decimalPlaces);
		formatter.setRoundingMode(RoundingMode.HALF_UP);
		formatter.setPositiveSuffix("%");
		formatter.setNegativeSuffix("%");

		return formatter.format(numberToFormat);
	}
}