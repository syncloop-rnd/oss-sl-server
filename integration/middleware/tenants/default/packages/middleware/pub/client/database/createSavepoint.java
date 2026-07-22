package packages.middleware.pub.client.database;
import com.eka.middleware.adapter.SQL;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;

import java.sql.Connection;
import java.sql.Savepoint;
public final class createSavepoint{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
	try {

            String savePointName = dataPipeline.getString("savePointName");
            Connection txConn = (Connection)dataPipeline.get("txConn");
            Savepoint savepoint = SQL.createSavepoint(txConn, savePointName);
            dataPipeline.put("savepoint", savepoint);
        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
            new SnippetException(dataPipeline,"SnippetException exception", e);
        }
	}

}