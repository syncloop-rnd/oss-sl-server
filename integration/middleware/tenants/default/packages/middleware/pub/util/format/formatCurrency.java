package packages.middleware.pub.util.format;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.text.NumberFormat;
import java.util.Locale;
public final class formatCurrency{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
          dataPipeline.appLog("OPERATION", "formatCurrency");
  		  Double number = (Double)dataPipeline.getAsNumber("number");
  		  dataPipeline.appLog("NUMBER", number.toString());
          Integer decimalPlaces = dataPipeline.getAsInteger("decimalPlaces");
  		  dataPipeline.appLog("DECIMAL_PLACES", decimalPlaces.toString());
          String locale = dataPipeline.getAsString("locale");
  		  dataPipeline.appLog("LOCALE", locale);
          String symbol = dataPipeline.getAsString("symbol");
  		  dataPipeline.appLog("CURRENCY_SYMBOL", symbol);

          String[] parts = locale.split("_"); 
          String language = parts[0]; 
          String country = parts[1]; 
          Locale newLocale = new Locale(language, country);

          dataPipeline.put("result",formatCurrency(number,decimalPlaces,newLocale,symbol));
  		  dataPipeline.appLog("FORMATTED_CURRENCY", formatCurrency(number,decimalPlaces,newLocale,symbol));
} 
catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
  		dataPipeline.appLog("SERVICE_ERROR",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}
	public static String formatCurrency(double numberToFormat, int decimalPlaces, Locale locale, String symbol) {
		if (numberToFormat == 0) {
			return "0";
		}

		DecimalFormat formatter = (DecimalFormat) NumberFormat.getInstance(locale);
		DecimalFormatSymbols symbols = formatter.getDecimalFormatSymbols();
		symbols.setGroupingSeparator(',');
		formatter.setNegativePrefix(concate("- ", symbol));
		formatter.setPositivePrefix(symbol);
		formatter.setDecimalFormatSymbols(symbols);
		formatter.setMaximumFractionDigits(decimalPlaces);
		formatter.setMinimumFractionDigits(decimalPlaces);
		formatter.setRoundingMode(RoundingMode.HALF_UP);

		return formatter.format(numberToFormat);
	}

	public static String concate(String... s) {
		StringBuilder builder = new StringBuilder();
		for (int i = 0; i < s.length; i++) {
			builder.append(s[i]);
		}
		return builder.toString();
	}
}