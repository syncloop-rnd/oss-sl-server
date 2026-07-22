package packages.middleware.pub.client.sftp.commands;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import net.schmizz.sshj.connection.channel.direct.Session;
import net.schmizz.sshj.sftp.SFTPClient;
import net.schmizz.sshj.sftp.RemoteFile;
import net.schmizz.sshj.SSHClient;
public final class close{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{

try{
    RemoteFile.RemoteFileOutputStream rfos=(RemoteFile.RemoteFileOutputStream)dataPipeline.get("remoteFileOutputStream");
    if(rfos!=null)
  		try{rfos.flush();rfos.close();}catch(Exception e){}
	RemoteFile.RemoteFileInputStream rfis=(RemoteFile.RemoteFileInputStream)dataPipeline.get("remoteFileInputStream");
    if(rfis!=null)
      try{rfis.close();}catch(Exception e){}
    RemoteFile rfr=(RemoteFile)dataPipeline.get("remoteFileReader");
    if(rfr!=null)
      try{rfr.close();}catch(Exception e){}
	RemoteFile rfw=(RemoteFile)dataPipeline.get("remoteFileWriter");
    if(rfw!=null)
      try{rfw.close();}catch(Exception e){}
    SFTPClient sftp=(SFTPClient)dataPipeline.get("sftpClient");
    if(sftp!=null)
      try{sftp.close();}catch(Exception e){}
    Session session=(Session)dataPipeline.get("session");
  	if(session!=null)
      try{session.close();}catch(Exception e){}
	SSHClient ssh=(SSHClient)dataPipeline.get("sshClient");
    if(ssh!=null)
      try{ssh.close();}catch(Exception e){}
    dataPipeline.put("status","success");
  }catch(Exception e){
    dataPipeline.clear();
  	dataPipeline.put("status","failed");
    dataPipeline.put("error",e.getMessage());
    throw new SnippetException(dataPipeline,"Sneppet exception", new Exception(e));
  }
	}

}