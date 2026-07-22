package packages.middleware.pub.client.sftp.commands;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import net.schmizz.sshj.sftp.SFTPClient;
public final class rename{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
SFTPClient sftp=(SFTPClient)dataPipeline.get("sftpClient");
String fileName=dataPipeline.getString("absoluteFilePath");
String newFileName=dataPipeline.getString("newAbsoluteFilePath");
try{
    sftp.rename(fileName, newFileName);
    dataPipeline.put("status","success");
  }catch(Exception e){
    dataPipeline.clear();
  	dataPipeline.put("status","failed");
    dataPipeline.put("error",e.getMessage());
    throw new SnippetException(dataPipeline,"Sneppet exception", new Exception(e));
  }
	}

}