package packages.middleware.pub.client.sftp.commands;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import net.schmizz.sshj.SSHClient;
import net.schmizz.sshj.connection.channel.direct.Session;
import net.schmizz.sshj.connection.channel.direct.Session.Command;
import net.schmizz.sshj.common.IOUtils;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import net.schmizz.sshj.connection.channel.direct.Session;
import net.schmizz.sshj.connection.channel.direct.Session.Command;
public final class createFile{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
Session session=(Session)dataPipeline.get("session");
String absoluteFilePath=dataPipeline.getString("absoluteFilePath");
InputStream ios=null;
try{
	final Command cmd = session.exec("touch "+absoluteFilePath);
	ios=cmd.getInputStream();
    ByteArrayOutputStream baos= IOUtils.readFully(ios);
	String resp=baos.toString();
	if(!(resp==null || resp.trim().length()==0))
      throw new Exception(resp);
    dataPipeline.put("status","success");
  }catch(Exception e){
    dataPipeline.clear();
  	dataPipeline.put("status","failed");
    dataPipeline.put("error",e.getMessage());
    throw new SnippetException(dataPipeline,"Sneppet exception", new Exception(e));
  }finally{
    try{
      ios.close();
    }catch(Exception e){}
    }
	}

}