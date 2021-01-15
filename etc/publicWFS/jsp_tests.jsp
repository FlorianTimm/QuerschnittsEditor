<%@page session="false"%>
<%@page import="java.net.*,java.io.*,javax.xml.bind.DatatypeConverter, java.nio.charset.StandardCharsets" %>
<%@page trimDirectiveWhitespaces="true"%> 
<%
URLConnection urlConnection = null;
try {
	/*
	String reqUrl = request.getQueryString();
	
	
	out.println(reqUrl);
	out.println(request.getMethod());
	out.println(request.getParameterMap());
	
		int clength = request.getContentLength();
		out.println(clength);
		if(clength > 0) {
			byte[] idata = new byte[clength];
			request.getInputStream().read(idata, 0, clength);
			out.println(new String(idata, StandardCharsets.UTF_8));	
		}
	
	*/
	InputStream is = request.getInputStream(); 
	BufferedInputStream in = new BufferedInputStream(is);
	
	byte[] contents = new byte[1024];

	int bytesRead = 0;
	String strFileContents = ""; 
	while((bytesRead = in.read(contents)) != -1) { 
		strFileContents += new String(contents, 0, bytesRead);              
	}

	out.print(strFileContents);

	/*
	byte buf[] = new byte[1024]; 
	int letti; 

	while ((letti = is.read(buf)) > 0) {
	//baos.write(buf, 0, letti); 
		out.println(new String(buf, StandardCharsets.UTF_8));	
	}

	//data = new String(baos.toByteArray()); 

	//log.debug("Data : " + data); */
} catch(Exception e) {
	response.setStatus(500);
	out.println("ERROR 500: An internal server error occured. " + e.getMessage());	
}
%>