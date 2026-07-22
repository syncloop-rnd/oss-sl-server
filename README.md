
Getting started Syncloop version 2.0.1:
1. Download the zip (https://github.com/syncloop-rnd/oss-sl-server/archive/refs/heads/main.zip) file and unzip.
2. Download JDK 25+ https://learn.microsoft.com/en-gb/java/openjdk/download
	Choose one for your OS:
	https://aka.ms/download-jdk/microsoft-jdk-25.0.3-windows-x64.zip
	https://aka.ms/download-jdk/microsoft-jdk-25.0.3-linux-x64.tar.gz
	https://aka.ms/download-jdk/microsoft-jdk-25.0.3-macos-x64.tar.gz
3. Unzip the JDK-25 inside the oss-sl-server folder.
4. Update the JAVA_HOME in start server scripts:
	start-api-server.sh: JAVA_HOME="$APP_HOME/jdk-25.0.3"
	start-api-server.bat: SET "JAVA_HOME=%CD%\jdk-25.0.3"
5. Update the file inside <unzipped sl folder>/resources/config/server.properties
	middleware.server.home.dir=/oss-sl-server/integration/middleware/
	ignite.workingDirectory.path=/oss-sl-server/ignite
	
6. Run start-api-server
7. Install http-server and run start-http-server
9. Open http://localhost:3000 
10. User: admin
    Password: admin01