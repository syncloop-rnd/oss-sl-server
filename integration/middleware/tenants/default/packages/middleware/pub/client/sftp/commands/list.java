package packages.middleware.pub.client.sftp.commands;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import net.schmizz.sshj.sftp.RemoteResourceInfo;
import net.schmizz.sshj.sftp.SFTPClient;
import java.util.*;
public final class list{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
  try{
      SFTPClient sftp=(SFTPClient)dataPipeline.get("sftpClient");
      String path=dataPipeline.getString("path");
      List<Map> infoList=new ArrayList<Map>();
      List<RemoteResourceInfo> list= sftp.ls(path);
      for (RemoteResourceInfo remoteResourceInfo : list) {
        Map info=new HashMap();
        info.put("isDirectory",(Boolean)remoteResourceInfo.isDirectory());
        info.put("name",remoteResourceInfo.getName());
        info.put("path",remoteResourceInfo.getPath());
        info.put("actedTime",new Date(remoteResourceInfo.getAttributes().getAtime()));
        info.put("size",remoteResourceInfo.getAttributes().getSize());
        info.put("id",remoteResourceInfo.getAttributes().getUID());
        infoList.add(info);
      }
      dataPipeline.put("info",infoList);
  }catch(Exception e){
    e.printStackTrace();
  	dataPipeline.clear();
  	dataPipeline.put("status","failed");
    dataPipeline.put("error",e.getMessage());
    throw new SnippetException(dataPipeline,"Sneppet exception", new Exception(e));
  }
	}

}