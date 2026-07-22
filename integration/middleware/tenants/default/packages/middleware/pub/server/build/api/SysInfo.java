package packages.middleware.pub.server.build.api;

import com.eka.middleware.licensing.License;
import com.eka.middleware.licensing.LicenseFile;
import com.eka.middleware.server.MiddlewareServer;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.PropertyManager;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.io.IOUtils;

import java.io.File;
import java.io.FileInputStream;
import com.eka.middleware.flow.KeywordResolver;

public final class SysInfo{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
	try {
			dataPipeline.appLog("OPERATION", "Sysinfo");
            String packagePath = PropertyManager.getPackagePath(dataPipeline.rp.getTenant());
			dataPipeline.appLog("EXTRACTED_PACKAGE_PATH", packagePath);
            dataPipeline.put("coreBuildName", MiddlewareServer.getBuildName());
      		dataPipeline.appLog("CORE_BUILD_NAME", MiddlewareServer.getBuildName());
            dataPipeline.put("isCommunityVersion", MiddlewareServer.getEnv(MiddlewareServer.EnvVariables.COMMUNITY_DEPLOYMENT));
			dataPipeline.appLog("IS_COMMUNITY_VERSION", MiddlewareServer.getEnv(MiddlewareServer.EnvVariables.COMMUNITY_DEPLOYMENT));
      		dataPipeline.put("isCoreVersion", MiddlewareServer.getEnv(MiddlewareServer.EnvVariables.CORE_DEPLOYMENT));
      
            boolean licenseKey = License.isLicenseFound(dataPipeline);
            dataPipeline.put("license_key", licenseKey);
      		dataPipeline.appLog("LICENSE_KEY",String.valueOf(licenseKey));

            License.instanceIds(dataPipeline);

            if (licenseKey) {
                LicenseFile licenseFile = License.getLicenseFile(dataPipeline);
                if (null != licenseFile) {
                    dataPipeline.put("license_name", licenseFile.getLicenseName());
                  	dataPipeline.appLog("LICENSE_NAME", licenseFile.getLicenseName());
                    dataPipeline.put("license_expiry", licenseFile.getExpiry());
                  	dataPipeline.appLog("LICENSE_EXPIRY", String.valueOf(licenseFile.getExpiry()));
                    dataPipeline.put("license_expiry_days_left", licenseFile.daysLeftInExpiring());
                  	dataPipeline.appLog("LICENSE_EXPIRY_DAYS_LEFT", String.valueOf(licenseFile.daysLeftInExpiring()));
                    dataPipeline.put("license_validity_type", licenseFile.getLicenseValidityType());
                  	dataPipeline.appLog("LICENSE_VALIDITY_TYPE", String.valueOf(licenseFile.getLicenseValidityType()));
                    
                    if (null != licenseFile.getLicenseValidityType() && LicenseFile.LicenseValidityType.CREDIT.equals(licenseFile.getLicenseValidityType())) {

                        dataPipeline.put("totalCredits", licenseFile.getTotalCredits());
                      	dataPipeline.appLog("TOTAL_CREDITS", String.valueOf(licenseFile.getTotalCredits()));
                        dataPipeline.put("currentCredits", licenseFile.getCurrentCredits());
                      	dataPipeline.appLog("CURRENT_CREDITS", String.valueOf(licenseFile.getCurrentCredits()));
                        dataPipeline.put("perHourCreditSpend", licenseFile.getPerHourCreditSpend());
                      	dataPipeline.appLog("PER_HOUR_CREDIT_SPEND", String.valueOf(licenseFile.getPerHourCreditSpend()));
                      
                    }
                }
            }

            File guiBuild = new File(packagePath + "gui/build");
      		dataPipeline.appLog("GUI_BUILD_PATH", guiBuild.getAbsolutePath());

            if (guiBuild.exists()) {
                FileInputStream guiStream = new FileInputStream(guiBuild);
                dataPipeline.put("guiVersion", IOUtils.toString(guiStream));
              	dataPipeline.appLog("GUI_VERSION",  IOUtils.toString(guiStream));
                guiStream.close();
            } else {
                dataPipeline.put("guiVersion", "Unknown");
              	dataPipeline.appLog("GUI_VERSION", "Unknown");
            }

            File packageBuild = new File(packagePath + "packages/global/dependency/config/build");
      		dataPipeline.appLog("PACKAGE_BUILD_PATH", packageBuild.getAbsolutePath());

            if (packageBuild.exists()) {
                FileInputStream packageStream = new FileInputStream(packageBuild);
                dataPipeline.put("packagesVersion", IOUtils.toString(packageStream));
              	dataPipeline.appLog("PACKAGES_VERSION", IOUtils.toString(packageStream));
                packageStream.close();
            } else {
                dataPipeline.put("packagesVersion", "Unknown");
              	dataPipeline.appLog("PACKAGES_VERSION", "Unknown");
            }
      
      		dataPipeline.put("api_url", KeywordResolver.find("*pub.middleware.host.name", dataPipeline));
      		dataPipeline.put("ui_url", KeywordResolver.find("*pub.middleware.cdn.endpoint", dataPipeline));
      		dataPipeline.put("ws_url", KeywordResolver.find("*pub.middleware.ws.endpoint", dataPipeline));

        } catch(Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
      dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
            dataPipeline.setResponseStatus(500);
            dataPipeline.put("status", "Not Modified");
            new SnippetException(dataPipeline,"Failed while saving file", new Exception(e));
        }
	}

}