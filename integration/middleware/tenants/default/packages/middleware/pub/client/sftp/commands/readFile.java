package packages.middleware.pub.client.sftp.commands;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import net.schmizz.sshj.sftp.SFTPClient;
import java.util.*;
import net.schmizz.sshj.sftp.RemoteFile;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.util.List;
import net.schmizz.sshj.sftp.SFTPFileTransfer;
public final class readFile{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
SFTPClient sftp=(SFTPClient)dataPipeline.get("sftpClient");
String fileName=dataPipeline.getString("absoluteFilePath");

try(ByteArrayOutputStream baos = new ByteArrayOutputStream()){
    File tempFile=File.createTempFile("sftp-", System.currentTimeMillis()+".tmp");
    new SFTPFileTransfer(sftp.getSFTPEngine()).download(fileName, tempFile.getAbsolutePath());
    
    try(FileInputStream fios=new FileInputStream(tempFile)){
      fios.transferTo(baos);
    }catch(Exception e){
    	throw new Exception(e);
    } 
    tempFile.delete();
	final byte[] fullFileBytes = baos.toByteArray();
    dataPipeline.put("fileBytes",fullFileBytes);
    dataPipeline.put("status","success");
  }catch(Exception e){
    dataPipeline.clear();
  	dataPipeline.put("status","failed");
    dataPipeline.put("error",e.getMessage());
    throw new SnippetException(dataPipeline,"Sneppet exception", new Exception(e));
  }
	}

}