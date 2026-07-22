package packages.middleware.pub.client.sftp.commands;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import net.schmizz.sshj.sftp.SFTPClient;
import java.util.*;
import net.schmizz.sshj.sftp.RemoteFile;
import java.util.EnumSet;
import net.schmizz.sshj.sftp.OpenMode;
public final class getFileOutputStream{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
SFTPClient sftp=(SFTPClient)dataPipeline.get("sftpClient");
String fileName=dataPipeline.getString("absoluteFilePath");
String data=dataPipeline.getString("data");
RemoteFile rf=null;
RemoteFile.RemoteFileOutputStream rfos = null;
try{
    byte bytes[]=null;
    if(data==null)
      bytes=(byte[])dataPipeline.get("bytes");
    rf=sftp.getSFTPEngine().open(fileName,EnumSet.of(OpenMode.WRITE,
                    OpenMode.CREAT,
                    OpenMode.TRUNC));
	rfos = rf.new RemoteFileOutputStream();
	dataPipeline.put("fileOutputStream",rfos);
    dataPipeline.put("remoteFile",rf);
    dataPipeline.put("status","success");
  }catch(Exception e){
  try{
      rf.close();
      rfos.close();
    }catch(Exception ex){
    }
    dataPipeline.clear();
  	dataPipeline.put("status","failed");
    dataPipeline.put("error",e.getMessage());
    throw new SnippetException(dataPipeline,"Sneppet exception", new Exception(e));
  }
	}

}