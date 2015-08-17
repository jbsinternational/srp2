
//*********************************************************************
// rdmfmethods.js
//*********************************************************************
//
// Methods performed on request by the app server
//
//*********************************************************************

//=====================================================================
// loadReport
//=====================================================================
// Loads the report page(s) into the insertion point specified by the
// app server. Always follows up with a request to the app server for
// data.
//=====================================================================

//---------------------------------------------------------------------
// example:
//
// <div hidden="hidden" id="RQTableOfPages">
//   <table class="ReportInformationTableStyle">
//     <tbody>
//       <tr>
//         <td class="ReportInformationIndentStyle"></td>
//         <td onclick="submit('event:RQGotoPage,id:$id^,rid:$rid^')" 
//           class="ReportInformationValueStyle">SRP2 Login RCD</td>
//       </tr>
//     </tbody>
//   </table>
// </div>
//
// Issues: if there are more than one rcd with a toc to be managed,
// this will not work because, since the ids are all hard-coded, the
// ids will not be uniq1ue.
//
function initPageLinks(node) {
   var div   = $("#RQTableOfPages");
   var links = div.children();
   if (!links)
      return;
   
   console.log("initPageLinks: found the links");
   
   var menu = $("#RQPagesSocket");
   if (!menu)
      return;
   
   console.log("initPageLinks: found the socket");
   
   menu.children().remove();
   links.appendTo(menu);

   div.remove();   
} // initPageLinks

//---------------------------------------------------------------------
// sample value:
//    {"rid":"17",
//     "pluginid":"masterPlugin",
//     "path":"rdmf-deck=report;report-deck=masterPlugin"}
//
function rptCallback(response, value) {
   var rsp = unwrap(response);
   
   if (rsp.charAt(0) == '[' ||
       rsp.charAt(0) == '{') {
       doResponse(rsp, "");
       return;
   }
   
   console.log("rptCallback: %s, %s, %s", value.rid,
                                          value.pluginid,
                                          value.path);
   $("#busy-image").hide();

   rid = value.rid;
   var node = $("#"+value.pluginid);
   node.empty();
   node.html(rsp);
   
   // Remove event listeners already added
   $("[data-type='collapsible']").off("click");
   $("input.submit,select.submit").off("change");      
   $("select.asmSelect").off("change").off("click");
   $("input,select").off("blur");
   
   initAsmSelect();
   initBlurs();
   initClicks();
   initKeyboard();
   initGrids(value.rid);
   initPath(value.path);
   initPageLinks(node);

   // Follow up request to the app server to obtain report data
   var url = makeUrl("data", sid, value.rid, "all", "get");
   SimpleAJAXCall(url, doResponse, "GET", "");
} // rptCallback
   
//---------------------------------------------------------------------
//  {"cmd":"perform",
//   "name":"loadReport",
//   "value":{"rid":"21","pluginid":"masterPlugin","path":"..."}},
//   
function loadReport(value) {
   console.log("loadReport: plugin=" + JSON.stringify(value));
   
   rid = value.rid;
   pid = "all";
   if (value.pid) {
      pid = value.pid;
   }
   
   var url = makeUrl("report", sid, rid, pid, "get");
   SimpleAJAXCall(url, rptCallback, "GET", value);
   
   // indicate to pause processing the command stream
   return false;
} // loadReport

//---------------------------------------------------------------------
//   "value":{"rid":"21","fid":"f1234_21","pluginid":"f1234_21-note"}},
//
function noteCallback(response, value) {
   var rsp = unwrap(response);
   
   if (rsp.charAt(0) == '[' ||
       rsp.charAt(0) == '{') {
       doResponse(rsp, "");
       return;
   }
   
   console.log("noteCallback: %s, %s, %s", value.rid,
                                           value.fid);
   $("#busy-image").hide();

   var node = $("#"+value.pluginid);
   node.empty();
   node.html(rsp);
} // noteCallback

//---------------------------------------------------------------------
// sends: {event: getNote, rid: rid, fid: fid}
//   "value":{"rid":"21","fid":"f1234_21","pluginid":"f1234_21-note"}},
//
function loadNote(value) {
   rid = value.rid;
   fid = value.fid;
   
   console.log("loadNote: loading note for fid="+fid);
   
   // Request the note document for the specified fid
   var url = makeUrl("submit", sid, rid, fid, "get");
   SimpleAJAXCall(url, noteCallback, "GET", value);
   
   // indicate to pause processing the command stream
   return false;
} // loadNote

//---------------------------------------------------------------------
//   "value":{"rid":"21","fid":"f1234_21"}},
//
function helpCallback(response, value) {
   var rsp = unwrap(response);
   
   if (rsp.charAt(0) == '[' ||
       rsp.charAt(0) == '{') {
       doResponse(rsp, "");
       return;
   }
   
   console.log("helpCallback: %s, %s, %s", value.rid,
                                           value.fid);
   $("#busy-image").hide();

} // helpCallback

//---------------------------------------------------------------------
// sends: {event: gethelp, rid: rid}
//
function loadHelp(value) {
   console.log("loadHelp: loading help for rid="+rid);
   
   // Request the help document for the specified rid
   var url = makeUrl("submit", sid, rid, "", "get");
   SimpleAJAXCall(url, helpCallback, "GET", value);
   
   // indicate to pause processing the command stream
   return false;
} // loadHelp

//---------------------------------------------------------------------
// Executed by dsi.html on load, and also by the logout rule
//
function newSession(value) {
   console.log("newSession");
   
   var url = makeUrl("session", "", "", app, "get");
   SimpleAJAXCall(url, doResponse, "GET", "");
   
   // indicate to pause processing the command stream
   return false;
} // newSession

//=====================================================================
// doPerform
//=====================================================================
// form of rec is
//    {"name":"method","value":"parameters"}
//
// called from rdmfresponse.doResponse.
// note that this should be the last command in a response list.
//
function doPerform(rec) {
   var name  = rec.name;
   var value = rec.value;
   
   if      (name === "loadReport")
      return loadReport(value);
   else if (name === "loadNote")
      return loadNote(value);
   else if (name === "loadHelp")
      return loadHelp(value);
   else if (name === "newSession")
      return newSession(value);
      
   // etc for additional methods
   
   return true;
} // doPerform

