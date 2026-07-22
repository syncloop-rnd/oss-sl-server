package packages.middleware.pub.client.database;
import com.eka.middleware.adapter.SQL;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;

import java.sql.Connection;
public final class setTransactionIsolationLevel{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
	try {

            Integer isolationLevel = dataPipeline.getAsInteger("isolationLevel");
            Connection txConn = (Connection)dataPipeline.get("txConn");
            SQL.setTransactionIsolationLevel(txConn, isolationLevel);

        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
            new SnippetException(dataPipeline,"SnippetException exception", e);
        }
	}

}