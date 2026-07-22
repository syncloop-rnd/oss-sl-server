package packages.middleware.pub.client.sftp.commands;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.io.File;
import java.util.*;

import net.schmizz.sshj.SSHClient;
import net.schmizz.sshj.sftp.RemoteResourceInfo;
import net.schmizz.sshj.sftp.SFTPClient;
import net.schmizz.sshj.transport.verification.PromiscuousVerifier;
import net.schmizz.sshj.userauth.keyprovider.PKCS8KeyFile;
import net.schmizz.sshj.connection.channel.direct.Session;
import com.eka.middleware.service.PropertyManager;
public final class open{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
SSHClient client = null;
Session session = null;
SFTPClient sftp = null;
try {
			String remoteHost = dataPipeline.getString("host");
  			Integer port=dataPipeline.getInteger("port");
			String username = dataPipeline.getString("username");
			String password = dataPipeline.getString("password");
  			String pemFile=dataPipeline.getString("pemFileLocation");
  			String location = PropertyManager.getPackagePath(dataPipeline.rp.getTenant());
  			if(password==null && pemFile==null)
              throw new Exception("Password or pem file is required.");
            if(pemFile!=null)
              pemFile=location+pemFile;
			client=new SSHClient();
			client.addHostKeyVerifier(new PromiscuousVerifier());
			PKCS8KeyFile keyFile = new PKCS8KeyFile();
			//keyFile.
			keyFile.init(new File(pemFile));
  			if(port==null)
				client.connect(remoteHost);
  			else
                client.connect(remoteHost,port);
            if(pemFile!=null)
				client.authPublickey(username, keyFile);
  			else
  				client.authPassword(username, password);
			sftp=client.newSFTPClient();
  			session = client.startSession();
  			Map clientMap=new HashMap();
  			clientMap.put("sftpClient",sftp);
  			clientMap.put("sshClient",client);
  			clientMap.put("session",session);
  			dataPipeline.put("sshObjects",clientMap);
  			dataPipeline.put("status","success");
		} catch (Exception e) {
  			try{
              if(sftp!=null)
                sftp.close();
              if(session!=null)
                session.close();
              if(client!=null)
  				client.close();
            }catch(Exception ex){}
			dataPipeline.clear();
  			dataPipeline.put("status","failed");
    		dataPipeline.put("error",e.getMessage());
    		throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
		}
	}

}