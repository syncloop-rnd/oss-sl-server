package packages.middleware.pub.client.sftp.commands;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import net.schmizz.sshj.sftp.SFTPClient;
import net.schmizz.sshj.sftp.RemoteFile;
public final class getFileInputStream{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
SFTPClient sftp=(SFTPClient)dataPipeline.get("sftpClient");
String fileName=dataPipeline.getString("absoluteFilePath");
RemoteFile rf=null;
RemoteFile.RemoteFileInputStream rfis=null;
try{
    rf=sftp.getSFTPEngine().open(fileName);
	rfis = rf.new RemoteFileInputStream();
	//byte bytes[]=rfis.readAllBytes();
	//rf.close();
    dataPipeline.put("fileInputStream",rfis);
    dataPipeline.put("status","success");
  }catch(Exception e){
    try{
      rf.close();
      rfis.close();
    }catch(Exception ex){
    }
    dataPipeline.clear();
  	dataPipeline.put("status","failed");
    dataPipeline.put("error",e.getMessage());
    throw new SnippetException(dataPipeline,"Sneppet exception", new Exception(e));
  }
	}

}