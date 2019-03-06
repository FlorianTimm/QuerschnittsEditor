<%@page import="java.net.*,java.io.*,javax.xml.bind.DatatypeConverter" %>
<%@page trimDirectiveWhitespaces="true"%>
<%
String urlStr = "http://lverkpa001.fhhnet.stadt.hamburg.de:8380/publicWFS/WFS?";
//String urlStr = "http://lverkpa001.fhhnet.stadt.hamburg.de:8380/publicWFS/webservices/EBFFCore?wsdl";

String basicAuth = "";

HttpURLConnection urlConnection = null;

if (request.getParameter("user") != null && request.getParameter("password") != null) {
	basicAuth = "Basic " + new String(DatatypeConverter.printBase64Binary((request.getParameter("user") + ":" + request.getParameter("password")).getBytes()));
	request.getSession().setAttribute("Authorization", basicAuth);
} else if (request.getSession().getAttribute("Authorization") != null) {
	basicAuth = (String) request.getSession().getAttribute("Authorization");
} else if (request.getHeader("Authorization") != null) {
	basicAuth = (String) request.getHeader("Authorization");
	request.getSession().setAttribute("Authorization", basicAuth);
}

if (basicAuth == null || basicAuth.length() < 12) {
	response.setStatus(401);
	response.addHeader("WWW-Authenticate", "Basic realm=\"Login zum publicWFS\"");
	return;
}

try { 
	URL url = new URL(urlStr);
	urlConnection = (HttpURLConnection) url.openConnection();

	urlConnection.setRequestProperty("Authorization", basicAuth);
	urlConnection.setConnectTimeout(1000);
	urlConnection.setReadTimeout(1000);
	urlConnection.setRequestMethod("GET");
	
	urlConnection.connect();
	int code = urlConnection.getResponseCode();
	if (code == 200) {
		response.sendRedirect("../ereignisraum.html");
	} else {
		response.sendRedirect("../index.html#failed");
	}
	//out.println(code);
} catch(Exception e) {
	response.setStatus(500);
	e.printStackTrace(response.getWriter());
	out.println("ERROR 500: An internal server error occured. " + e.getMessage());	
}
%>