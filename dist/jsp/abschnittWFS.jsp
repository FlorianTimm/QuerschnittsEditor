<%@page language="java" pageEncoding="utf-8" contentType="application/xml; charset=utf-8" %><%@ page import="java.sql.*, java.util.*, java.net.*, oracle.jdbc.*, oracle.sql.*" %><%
// Change these details to suit your database and user details
 
String connStr = "jdbc:oracle:thin:@10.62.42.25:6543:verklhhp";
String dbUser  = "QUERSCHNITTSEDITORSIB";
String dbPass  = "LGVSIB";
 
request.setCharacterEncoding("UTF-8");

java.util.Properties info=new java.util.Properties();
Connection conn  = null;
 
String st_maxFeatures = request.getParameter("MAXFEATURES");
int maxFeatures = 200;
if (st_maxFeatures != null) {
	try {
		maxFeatures = Integer.parseInt(st_maxFeatures);
	} catch (Exception e) {};
}

String filter = "";

String abschnittId = request.getParameter("ABSCHNITTID");
if (abschnittId != null) {
	filter += " and ID = '" + abschnittId + "'";
}

String vnk = request.getParameter("VNK");
String nnk = request.getParameter("NNK");
if (vnk != null && nnk != null) {
	filter += " and VNP = '" + vnk + "' and NNP = '" + nnk + "'";
}


String bbox = request.getParameter("BBOX");
if (bbox != null) {
	filter += " and sdo_filter(GEOMETRY, SDO_geometry(2003,25832,NULL,SDO_elem_info_array(1,1003,3),SDO_ordinate_array("+bbox+"))) = 'TRUE'";
}




try {
  DriverManager.registerDriver(new oracle.jdbc.driver.OracleDriver() );
  info.put ("user",     dbUser);
  info.put ("password", dbPass);
  conn      = DriverManager.getConnection(connStr,info);
  
  Statement stmt = conn.createStatement();
  String sql;
  //sql = "select PROJEKT, SDO_UTIL.TO_WKTGEOMETRY(GEOMETRY) from GEOADM.VI_STRASSENNETZ WHERE PROJEKT = 0 AND ROWNUM <= 5";
  //sql = "select SDO_UTIL.TO_GMLGEOMETRY(GEOMETRY) from GEOADM.VI_STRASSENNETZ WHERE PROJEKT = 0 AND ROWNUM <= 5";
  sql = "SELECT xmlelement(\"VI_STRASSENNETZ\", xmlattributes('http://www.opengis.net/gml' as \"xmlns:gml\"),  xmlforest(ID as \"ABSCHNITT_ID\", VNP as \"VNP\", " + 
	"NNP as \"NNP\", STRNAME as \"STRNAME\", LEN as \"LEN\" , xmltype(sdo_util.to_gmlgeometry(SDO_UTIL.SIMPLIFY(GEOMETRY, 0.01, 0.001))) as \"gml:geometryProperty\")).getCLobVal() AS theXMLElements  from GEOADM.VI_STRASSENNETZ WHERE PROJEKT = 0" + filter + " AND ROWNUM <= " + maxFeatures;
  //out.println(sql);
  out.print("<Objektmenge>");
  ResultSet rset = stmt.executeQuery(sql);
  while ( rset.next() ) {
      out.print(rset.getString(1)+"\n"); 
  }
  out.print("</Objektmenge>");
}
  catch (SQLException e) {
%>    <b>Error: </b> <%= e %><p>  <%
  } finally {
	  conn.close();
  }
  
  
  
%>