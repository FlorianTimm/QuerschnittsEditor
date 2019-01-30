<%@page session="false"%>
<%@page import="java.net.*,java.io.*,javax.xml.bind.DatatypeConverter" %>
<%@page trimDirectiveWhitespaces="true"%> 
<%
HttpURLConnection urlConnection = null;
try {
	String reqUrl = request.getQueryString();
	/*String decodedUrl = "";
	if (reqUrl != null) {
		reqUrl = URLDecoder.decode(reqUrl, "UTF-8");
	} else {
		reqUrl = "";
	}*/
	
	// Hier URL anpassen
	String urlStr = "http://Nutzer:Passwort@Server/publicWFS/WFS?" + reqUrl;
	
	URL url = new URL(urlStr);
	urlConnection = (HttpURLConnection) url.openConnection();

	if (url.getUserInfo() != null) {
		String basicAuth = "Basic " + new String(DatatypeConverter.printBase64Binary(url.getUserInfo().getBytes()));
		urlConnection.setRequestProperty("Authorization", basicAuth);
	}
	
	
	urlConnection.setDoOutput(true);
	urlConnection.setRequestMethod(request.getMethod());
	String reqContenType = request.getContentType();
	if(reqContenType != null) {
		urlConnection.setRequestProperty("Content-Type", reqContenType);
	}
	else {
		urlConnection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
	}
	
	int clength = request.getContentLength();
	if(clength > 0) {
		InputStream is = request.getInputStream(); 
		BufferedInputStream in = new BufferedInputStream(is);
		
		byte[] contents = new byte[1024];

		int bytesRead = 0;
		String strFileContents = ""; 
		urlConnection.setDoInput(true);
		while((bytesRead = in.read(contents)) != -1) { 
			//strFileContents += new String(contents, 0, bytesRead);
			urlConnection.getOutputStream().write(contents, 0, bytesRead);				
		}
	}
	//out.print(strFileContents);
	

	InputStream inputStream = urlConnection.getInputStream();

	response.setContentType("text/xml");
	response.setCharacterEncoding("ISO-8859-1");
	//response.setCharacterEncoding("UTF-8");
	BufferedReader rd = new BufferedReader(new InputStreamReader(inputStream));
	String line;
	int i = 0;
	while ((line = rd.readLine()) != null) {
		out.println(line);	
	}
	rd.close();
} catch(Exception e) {
	response.setStatus(500);
	e.printStackTrace(response.getWriter());
	out.println("ERROR 500: An internal server error occured. " + e.getMessage());	
}
%>