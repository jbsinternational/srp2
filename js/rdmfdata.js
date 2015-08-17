
//*********************************************************************
// rdmfdata.js
//*********************************************************************
//
// table of contents:
//
// getData
// initBlurs
//    focus
//    blur
// 
/*
input types:
   button
   *checkbox
   color
   date
   *datetime
   *datetime-local
   email
   file
   hidden
   image
   month
   *number
   *password
   *radio
   range
   reset
   search
   submit
   tel
   *text
   time
   url
   week

-----------------------------------------------------------------------

RDMF Questionnaire Document

The questionnaire html document is constructed as a set of one or more
pages that are loaded as a single document, index.html, along with the
JavaScript needed to handle events. A small JavaScript library supports
the ability to switch among the document pages either randomly or step-
wise. The first page is the login page, usually followed by a selection
page, or homepage/landing page where the user can choose a role and
a document or document type. From there, the user can switch to the
questionnaire page where the selected questionnaire html and data, as
appropriate for the selected role. Other pages can be easily added to
the basic document as needed.  

-----------------------------------------------------------------------

Server Transactions

Data transactions with the server use Ajax to transfer data 
entered by the user. Each transaction involves data obtained from the
input and select elements in the questionnaires. jQuery tools are used
to identify html elements involved in the data transfers, and to construct
the JSON structures to send to the server.

A data transaction requires four pieces of information:

1. a unique session identifier, the sid,
2. a unique questionnaire identifier, the RID,
3. a unique field identifier, the FID, and
4. the data. 

The server provides the session identifier, while the HTML element id
of each input or select field provides the rid and fid.

-----------------------------------------------------------------------   
   
request-json ::= {cmd:data,sid:sessionid,rid:reportid,value:{fid:fieldid,value:inputvalue}

*/

//---------------------------------------------------------------------
// Common routine to construct a request uri for the web server and app
// server.
//
function makeRequest(op, sid, rid, value, post) {
   var request = "";
   
   if (typeServer == "wcf") {
      if (post == "post") {
         request = "/"+op;
         request += "/"+sid;
         if (rid != "") {
            request += "/"+rid;
         }
         if (value != "") {
            request += "&value="+value;
         }
      }
      else {
         request = "/"+op;
         if (op == "session") {
            request += "/"+value;
         }
         else {
            request += "/"+sid;
            if (rid != "") {
               request += "/"+rid;
               if (value != "") {
                  request += "/"+value;
               }
            }
         }
      }
   }
   else { // if (typeServer == "nodejs")
      request = "?op="    + op  +
                "&sid="   + sid +
                "&rid="   + rid +
                "&value=" + value;
   }
   return request;
} // makeRequest

//---------------------------------------------------------------------
//
function makeUrl(op, sid, rid, value, post) {
   return host + port + service + servlet + makeRequest(op, sid, rid, value, post);
} // makeUrl

//---------------------------------------------------------------------
// Get the rid from the fid, if available
// (assumes fid_rid-grd)
//
function getRid(fid, node) {
   var regx = /^.*_.*/; //? f\d{4,6}_\d{2}/;
/*?   
   var rid = "";
   if (regx.test(fid)) {
      rid = (fid+fidgrd).split(fidgrd)[0]; //? '-').split('-')[0];
      rid = (rid+fidrid).split(fidrid)[1]; //?'_').split('_')[1];
   }
   else {
      rid = node.parents("[rid]").attr("rid");
   }
?*/
   return rid;
} // getRid
      
//---------------------------------------------------------------------
// ...and ampersands and ...
//
/*
function escapeQuotes(text) {
   var rtn = "";
   for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      if      (ch === '"') {
         rtn += "'";
      }
      else if (ch === '&') {
         rtn += "%26";
      }
      else {
         rtn += ch;
      }
   }
   
   return rtn;
} // escapeQuotes
*/
function escapeQuotes(text) {
   var rtn = "";
   for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      if      (ch === '"') {
         rtn += "&quot;";
      }
      else if (ch === "'") {
         rtn += "&apos;";
      }
      else if (ch === '&') {
         rtn += "%26";
      }
      else {
         rtn += ch;
      }
   }
   
   return rtn;
} // escapeQuotes

//---------------------------------------------------------------------
// Return true if the specified value contains characters other than
// whitespace (space, tab, return, linefeed, etc.)
//
function trimTest(value) {
   var val = value;
   while (val && val.charAt(0) <= ' ') {
      val = val.substring(1);
   }
   while (val && val.charAt(val.length-1) <= ' ') {
      val = val.substr(0, val.length-1);
   }
   return (val.length > 0);
} // trimTest

//---------------------------------------------------------------------
// Return "name":"value" for the specified <input> element.
//
function input2json(node) {
   var id    = node.attr("id");
   var value = node.val();
   
   value = '{"id":"'+id+'","value":"'+escapeQuotes(value)+'"}';
   console.log("input2json sending "+value);
   
   return value; 
} // input2json

//---------------------------------------------------------------------
//
function selectMultiple2json(node) {
   var id   = node.attr("id");
   var list = node.val() || [];
   
   value = "";
   for (var i = 0; i < list.length; i++) {
      var item = list[i];
      value = value + '|' + item;
   }
   
   if (value && value.charAt(0) == '|') {
      value = value.substr(1);
   }
   
   value = '{"id":"'+id+'","value":"'+escapeQuotes(value)+'"}';
   console.log("selectMultiple2json sending "+value);
   
   return value; 
} // selectMultiple2json

//---------------------------------------------------------------------
//
function selectAsmSelect2json(node) {
   var id   = node.attr("id");
   var list = node.children(":disabled") || [];
   
   value = "";
   for (var i = 0; i < list.length; i++) {
      var item = list[i];
      value = value + '|' + $(item).attr("value");
   }
   
   if (value && value.charAt(0) == '|') {
      value = value.substr(1);
   }
   
   value = '{"id":"'+id+'","value":"'+escapeQuotes(value)+'"}';
   console.log("selectMultiple2json sending "+value);
   
   return value; 
} // selectAsmSelect2json

//---------------------------------------------------------------------
//
function selectSingle2json(node) {
   var id      = node.attr("id");
   var iopt    = node.prop("selectedIndex");
   var options = node.children();
   var option  = options[iopt];
   var value   =  option.getAttribute("value");
   
   value = '{"id":"'+id+'","value":"'+escapeQuotes(value)+'"}';
   console.log("selectSingle2json sending "+value);
   
   return value; 
} // selectSingle2json

//---------------------------------------------------------------------
// Return {name,[value]} for the checked radio button. Return "" if
// nothing checked.
//
function radio2json(node) {
   var id    = node.attr("id");
   var name  = node.attr("name");
   var value = "";
   node.parent().children("input:checked").each(function() {
      var val = $(this).attr("value");
      value   = value + '|'+val;
   });
   
   if (value && value.charAt(0) == '|') {
      value = value.substr(1);
   }
   
   // Yes, the reversal is intentional
   value = '{"id":"'+name+'","name":"'+id+'","value":"'+escapeQuotes(value)+'"}';
   console.log("radio2json sending "+value);
   
   return value; 
} // radio2json

//---------------------------------------------------------------------
// Return {name,value:[value,...]} for all checkboxes within the group
// checked. Return name:[] if no checkboxes within the group checked.
// Note: Node parameter must specify the parent node of the checkbox
// group, rather than a specific checkbox element within the group.
//
function checkbox2json(node) {
   var id    = node.attr("id");
   var name  = node.attr("name");
   var value = "";
   node.parent().children("input:checked").each(function() {
      var val = $(this).attr("value");
      value   = value + '|'+val;
   });
   
   if (value && value.charAt(0) == '|') {
      value = value.substr(1);
   }
      
   // Yes, the reversal is intentional
   value = '{"id":"'+name+'","name":"'+id+'","value":"'+escapeQuotes(value)+'"}';
   console.log("checkbox2json sending "+value);
   
   return value; 
} // checkbox2json

//---------------------------------------------------------------------
// Sends a post data message to the App Server when the user blurs a
// field when the field is empty.
//
function postVoid(node) {
   var id = node.attr("id");
   value  = '{"id":"'+id+'","value":""}';
   
   console.log("postVoid sending "+value);
   
   var url = makeUrl("data", sid, rid, value, "post");
   console.log("void: " + url);
   SimpleAJAXCall(url, doResponse, "POST", fid);
} // postVoid

//---------------------------------------------------------------------
// Must call this after loading a report (see rdmfmethods.loadReport())
// to arm the data submit event handling functionality.
//
function initBlurs() {

   //------------------------------------------------------------------
   // The submit class allows to send input change events to the app
   // server immediately for immediate action. A blur event will follow.
   //
   $("input.submit").change(function(event) {
      var node  = $(this);
      
      var name  = node.attr("id");
      var fid   = node.attr("name");
      var value = node.attr("value");
      
      value = '{"event":"'+fid+'","name":"'+name+'","value":"'+escapeQuotes(value)+'"}';
      
      var type  = node.attr("type");
      if      (type == "bit") {
         value = radio2json(node);
      }
      else if (type == "radio") {
         value = radio2json(node);
      }
      else if (type == "checkbox") {
         value = checkbox2json(node);
      }
      
      // Replace the id field name with rule field name
      var whereId = value.indexOf("id");
      if (whereId > 0) {
         value = value.substr(0, whereId) + "event" + value.substr(whereId+2);
      }

      console.log("input.submit.change has value = "+value);      
      
      rid = getRid(fid, node);
      
      console.log("select.submit.change: fid="+fid+", rid="+rid);
      
      var url = makeUrl("submit", sid, rid, value, "post");
      console.log("input.submit: " + url);
      SimpleAJAXCall(url, doResponse, "POST", fid);
   }); // input.submit
   
   //------------------------------------------------------------------
   // The submit class allows to send select change events to the app
   // server immediately.
   //
   $("select.submit").change(function(event) {
      var node    = $(this);
      
      var fid     = node.attr("id");
      var iopt    = node.prop("selectedIndex");
      var options = node.children();
      var option  = options[iopt];
      var choice  = option.getAttribute("value");
   
      var value;
      if (node.attr("multiple")  == "multiple") {
         console.log("select-multiple");
         value = selectMultiple2json(node);
      }
      else if (node.attr("data-type") == "asmselect") {
         console.log("select-asmselect");
         value = selectAsmSelect2json(node);
      }
      else {
         console.log("select-single");
         value = selectSingle2json(node);
      }
      
      console.log("User selected "+choice+" in "+fid);
      
      var value = '{"event":"' + fid + '","value":"'+choice+'"}';

      rid = getRid(fid, node);
      
      console.log("select.submit.change: fid="+fid+", rid="+rid);
      
      var url = makeUrl("submit", sid, rid, value, "post");
      console.log("select.submit: " + url);
      SimpleAJAXCall(url, doResponse, "POST", fid);
   }); // select.submit
   
   //------------------------------------------------------------------
   //
   $("input,select").blur(function(event) {
      console.log("onBlur: ",event);
      var node     = $(this);
      var type     = node.attr("type");
      var dataType = node.attr("data-type");
      var list     = node.attr("list");
      var grp      = node.attr("name");
      var fid      = node.attr("id");
      var value    = node.val();
      var readonly = node.attr("readonly");
      
      // Ignore it if it is readonly
      if (readonly && readonly == "readonly") {
         console.log("Ignoring blur event from field "+fid);
         return;
      }
      
      rid = getRid(fid, node);

      console.log("onBlur: fid="+fid+", rid="+rid);
      
      if (!value) {
         postVoid(node);
         return;
      }
      
      // Test if the field contains only whitespace
      if (!trimTest(value)) {
         postVoid(node);
         return;
      }
      
      // Ignore blur events on elements that are not part of a
      // plugin. The form of plugin ids is f####. This form is
      // reserved.
      if (!fid || fid.length < 2)
         return;
      
      if      (type == "text") {
         if (dataType == "int"   ||
             dataType == "float" ||
             dataType == "money") {
            var msg = validNumber(node, fid, value);
            if (msg) {
               alert(msg);
			   node.val('');
            }
            else {
               var value = input2json(node);
               var url   = makeUrl("data", sid, rid, value, "post");
               console.log("number: " + url);
               SimpleAJAXCall(url, doResponse, "POST", fid);
            }
         }
         else {
            var msg = validText(node, fid, value);
            if (msg) {
               alert(msg);
            }
            else {
               var value = input2json(node);
               var url   = makeUrl("data", sid, rid, value, "post");
               console.log("text: " + url);
               SimpleAJAXCall(url, doResponse, "POST", fid);
            }
         }
      }
      else if (type == "password") {
         var msg = validPswd(node, fid, value);
         if (msg) {
            alert(msg);
         }
         else {
            var value = input2json(node);
            var url   = makeUrl("data", sid, rid, value, "post");
            console.log("password: " + url);
            SimpleAJAXCall(url, doResponse, "POST", fid);
         }
      }
      else if (type == "number") {
         var msg = validNumber(node, fid, value);
         if (msg) {
            alert(msg);
         }
         else {
            var value = input2json(node);
            var url = makeUrl("data", sid, rid, value, "post");
            console.log("number: " + url);
            SimpleAJAXCall(url, doResponse, "POST", fid);
         }
      }
      else if (type == "money") {
         var msg = validNumber(node, fid, value);
         if (msg) {
            alert(msg);
         }
         else {
            var value = input2json(node);
            var url   = makeUrl("data", sid, rid, value, "post");
            console.log("money: " + url);
            SimpleAJAXCall(url, doResponse, "POST", fid);
         }
      }
      else if (type == "datetime") {
         var msg = validDatetime(node, fid, value);
         if (msg) {
            alert(msg);
            node.val("");
         }
         else {
            var value = input2json(node);
            var url   = makeUrl("data", sid, rid, value, "post");
            console.log("datetime: " + url);
            SimpleAJAXCall(url, doResponse, "POST", fid);
         }
      }
      else if (type == "datetime-local") {
         var msg = validDatetime(node, fid, value);
         if (msg) {
            alert(msg);
         }
         else {
            var value = input2json(node);
            var url   = makeUrl("data", sid, rid, value, "post");
            console.log("datetime-local: " + url);
            SimpleAJAXCall(url, doResponse, "POST", fid);
         }
      }
      else if (type == "select") {
         var value = "";
         if (node.attr("multiple")  == "multiple") {
            console.log("select-multiple");
            value = selectMultiple2json(node);
         }
         else if (node.attr("data-type") == "asmselect") {
            console.log("select-asmselect");
            value = selectAsmSelect2json(node);
         }
         else {
            console.log("select-single");
            value = selectSingle2json(node);
         }
         var url = makeUrl("data", sid, rid, value, "post");
         SimpleAJAXCall(url, doResponse, "POST", fid);
      }
      else if (type == "bit") {
         var value = radio2json(node);
         var url   = makeUrl("data", sid, rid, value, "post");
         console.log("bit: " + url);
         SimpleAJAXCall(url, doResponse, "POST", fid);
      }
      else if (type == "radio") {
         var value = radio2json(node);
         var url   = makeUrl("data", sid, rid, value, "post");
         console.log("radio: " + url);
         SimpleAJAXCall(url, doResponse, "POST", fid);
      }
      else if (type == "checkbox") {
         var value = checkbox2json(node);
         var url   = makeUrl("data", sid, rid, value, "post");
         console.log("radio: " + url);
         SimpleAJAXCall(url, doResponse, "POST", fid);
      }
   }); // blur
} // initBlurs
