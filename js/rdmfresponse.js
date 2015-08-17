
//*********************************************************************
// rdmfresponse.js
//*********************************************************************
//
// Set of methods to accept a response for any GET, POST, or PUT from 
// the server and to process it.
//
// The response is a JSON object or array of field set command objects.
//
// format:
//    [{cmd, id, value},{...},...]
// or
//    {cmd, id, value} 
//
// The commands that this method set recognizes are
//
//    attr        id, name, value
//    set         id, value
//    setid       id, newid (requires xid-attribute)
//    setvar      name, value
//    disable     id | *key
//    enable      id | *key
//    hide        id | *key
//    show        id | *key
//    lock        id | *key
//    unlock      id | *key
//    required    id
//    optional    id
//    remove      id
//    deck        deckid
//    goto        deckid, next
//    goto        deckid, previous
//    goto        deckid, id(card)
//    goto        deckid, index(card)
//    path        path
//    clear       gridid|selectid
//    addrow      gridid, rowid
//    delrow      gridid, rowid
//    addcheckbox fieldid,{concept,meaning,[checkboxid],[class]}
//    addradio    fieldid,{concept,meaning,[radioid],[class]}
//    addoption   fieldid,{concept,meaning,[optionid]} 
//    perform     name, value[, value2]
//    respond     response
//    alert       value
//    confirm     message, key
//    prompt      message, default, key
//    load        filename, filetype
//    restart
//    console     value
//    note        value
//
// Unless otherwise specified, id identifies an element within the
// resident HTML document.
//
// You control the layout of radio buttons and checkboxes using the
// data-orient attribute, which can take one of three values:
// "horizontal", "vertical", or empty. It can also be not present. The
// default orientation is vertical. You can also indicate the width in
// the data-orient attribute  by appending comma followed by a number.
// Zero or absent is the same as one button wide. Only the first
// character of the value of the data-orient attribute is checked. Get
// the first character right and I don't care how badly you misspell the
// rest of it. In case this is all too confusing, the code looks for a
// first character as one of the letters "h" and "v", and assumes "v"
// if neither are present. Note that the width number is ignored unless
// the orientation is specified as horizontal.
//
// Here is an example:
//
//    data-orient="h,4"
//
// which specifies that the radiobuttons be layed out horizontally four-
// wide. If there are more than four buttons, then they are continued on
// the next row, etc.
//
//*********************************************************************

//---------------------------------------------------------------------
// If string is from WCF, we expect to have the form
//
//    <string>...</string>
//
// Remove the XML wrapper and return the striped string.
// Note that we are assuming a WCF attribute as per the following
// sample endpoint declaration:
//
// [OperationContract]
// [WebInvoke(Method = "GET",
//  ResponseFormat   = WebMessageFormat.Xml,
//  BodyStyle        = WebMessageBodyStyle.Bare,
//  UriTemplate      = "report/{sid}/{rid}")]
//
function unwrap(str) {
   var i;

   i = str.indexOf("<string");
   if (i != 0) {
      return str;
   }
   i = str.indexOf(">");
   if (i < 0) {
      return str;
   }
   
   var s = str.substring(i+1);
   
   i = s.indexOf("</string>");
   if (i < 0) {
      return s;                             // really should not happen
   }

   return s.substring(0, i);
} // unwrap

//---------------------------------------------------------------------
// don't know yet. problem is css style. maybe not needed? one can hope.
//
function doButtongroup(node, values) {
   // TBD
} // doButtongroup

//---------------------------------------------------------------------
//
function doHtml(node, value) {
   var id = node.attr("id");
   console.log("rdmfresponse.doHtml: " + id + " = " + value);
   
   node.html(value);
} // doHtml

//---------------------------------------------------------------------
//
function doGrid(node, value) {
   var id = node.attr("id");
   console.log("rdmfresponse.doGrid: " + id + " = " + value);
   
   value = value.toString();
   
   var fid = id.split(fidgrd)[0];
   var dnode = $("[data-id='"+fid+"']");
   if (!dnode) {
      node.html(value);
      return;
   }
   
   var type = dnode.attr("data-type");
   if (type != "select") {
      node.html(value);
      return;
   }
   
   var options = dnode.children("option");
      console.log("doGrid: for id="+id+", #options = " + options.length);
      for (var i = 0; i < options.length; i++) {
         var option = options[i];
         var onode  = $(option);
         if (value == $(option).attr("value")) {
            console.log("doGrid: found match for "+value+" as "+$(option).html());
            node.html($(option).html());
            return;
         }
      }
   
   node.html(value);
} // doGrid

//---------------------------------------------------------------------
// <label id="f793-label" data-type="text">text</label>
// <h4 id="heading" data-type="text">text</h4>
// etc.
//
function doText(node, value) {
   var id = node.attr("id");
   console.log("rdmfresponse.doText: " + id + " = " + value);
   
   node.html(value);
} // doText

//---------------------------------------------------------------------
// Routine assumes that node is the <input> element.
//
// <input id="f862" type="datetime" data-type="text">
//
function doInput(node, value) {
   var id = node.attr("id");
   console.log("rdmfresponse.doInput: " + id + " = " + value);
   
   node.value = value;
} // doInput

//---------------------------------------------------------------------
// Routine assumes that node is the <ul> element.
//
// Structure of an anonymous list:
//
//   <ul id="f862" data-type="list">
//     <li><a href="#">Home</a></li>
//     <li><a href="#">FAQS</a></li>
//     etc...
//   </ul>
//
// form of values is
//    [{"text":"..."},...]
//
function doList(node, values) {
   var id = node.attr("id");
   
   var html = "";
   for (var i = 0; i < values.length; i++) {
      var value = values[i];
      html = html + "<li>"+value.text+"</li>";
   }
   
   if (html != "") { 
      node.empty();
      node.html(html);
   }
} // doList

//---------------------------------------------------------------------
// Structure is
//
//    <select id="f2552" type="select">
//      <option value="ADOL">ADOL: Adolescent</option>
//      <option value="AIAN">AIAN</option>
//      <option value="CJ">CJ: Criminal Justice</option>
//      <option value="HIT">HIT: Health Information Technology</option>
//    </select>
//
// Match the specified value to a value attribute, and then select the
// matching option(s).
//
// $("#mySelect").val( [2, 4] );
//
function doSelect(node, value) {
   var id       = node.attr("id");
   var multiple = node.attr("multiple");
   
   console.log("rdmfresponse.doSelect: " + id + " = " + value);
   
   value = value.toString();
   if (!value) {
       if (multiple)
           node.val([]);
      return;
   }
   
   if (!multiple) {
      var options = node.children("option");
      console.log("doSelect-single: #options = " + options.length);
      for (var i = 0; i < options.length; i++) {
         var option = options[i];
         if (value == $(option).attr("value")) {
            node.val($(option).val());
           //? option.selected = true;
            return;
         }
      }
   }
   else {
      var values  = value.split('|');
      var vals    = [];
      for (var i = 0; i < values.length; i++) {
         var val = values[i];
         vals.push(val);
      }
      node.val(vals);
   }
} // doSelect

//---------------------------------------------------------------------
// Routine assumes that node is the container <div>.
//
// Structure of a radiogroup:
//
//   <div id="f252" data-type="radiogroup" dtat-orient="vertical">
//     <input id="f252-1" type="radio" value="C41331" name="f252"></input>
//     <label for="f252-1">Adverse Event (a symptom, reaction or disease associated with the product)</label>
//     <br/>
//     <input id="f252-2" type="radio" value="C53054" name="f252"></input>
//     <label for="f252-2">Product Problem (an observed or detected product issue or defect that has the potential to cause harm)</label>
//     <br/>
//     etc...
//   </div>
//
// Form of values is
//    [{"label":"...","value":"..."}, ...]
// i.e., the list of commands to construct all the buttons within the
// group.
//
function doRadiogroup(node, values) {
   var radios = node.find("input");
   console.log("doRadiogroup: #radios = " + radios.length);

   var values = values.toString().split('|');

   for (var i = 0; i < radios.length; i++) {
      var radio = radios[i];
      if (!radio && radio.nodeType != 1)
         continue;
      var value = radio.getAttribute("value");
      var checkit = false;
      for (var j = 0; j < values.length; j++) {
         var selval = values[j];
         if (value == selval) {
            checkit = true;
            break;
         }
      }
      if (checkit) {
         radio.checked = true;
      }
      else {
         radio.checked = false;
      }
   }
} // doRadiogroup

//---------------------------------------------------------------------
// Routine assumes that node is the container <div>.
//
// Structure of a checkgroup:
//
//   <div id="f454" data-type="checkgroup" data-orient="vertical">
//     <input id="f454-1" type="checkbox" value="FC0010" name="f454"/>
//     <label for="f454-1">Store/Place of Purchase</label>
//     <br/>
//     <input id="f454-2" type="checkbox" value="C48289" name="f454"></input>
//     <label for="f454-2">Distributor</label>
//     <br/>
//     etc...
//   </div>
//
// Form of values is
//    [{"label":"...","value":"..."}, ...]
//
// how to:
// go through the checkbox children of the checkboxgroup.
// get the value of the checkbox
// search the value list in the values parameter.
// if a match then check thae checkblox, otherwise uncheck it.
//
function doCheckgroup(node, values) {
   var cboxes = node.find("input");
   console.log("doCheckgroup: #checkboxes = " + cboxes.length);
   
   var values = values.toString().split('|');
   
   for (var i = 0; i < cboxes.length; i++) {
      var cbox = cboxes[i];
      if (!cbox && cbox.nodeType != 1)
         continue;
      var value = cbox.getAttribute("value");
      var checkit = false;
      for (var j = 0; j < values.length; j++) {
         var selval = values[j];
         if (value == selval) {
            checkit = true;
            break;
         }
      }
      if (checkit) {
         cbox.checked = true;
      }
      else {
         cbox.checked = false;
      }
   }
} // doCheckgroup
 
//---------------------------------------------------------------------
// Routine assumes that node is the <input> element referencing the
// <datalist> element, or the <datalist> element, itself.
//
// Structure of a datalist:
//
//   <input type="text" data-type="datalist" list="f161-datalist" id="f161">
//   <datalist id="f161-datalist">
//     <option data-value="USA" value="United States"/>
//     <option data-value="CAN" value="Canada"/>
//     etc...
//   </datalist>
//
// orm of values is
//    [{"label":"...","value":"..."}, ...]
//
// The id specified by the command may identify a datalist element or an
// input element, which references a datalist element via its list attribute.
// Note that the current version of the RCD does not generate shared
// datalists.
//
function doDatalist(node, values) {
   console.log("rdmfresponse.doDatalist: " + node.toString() + " not handled. TBD");
   return;
   
   var list = node;
//? (doesn't like nodeName)   var type = node.nodeName; // .toLowerCase();
   if (type == "input") {
      name = node.attr("list");
      list = $("#"+name);
   }
   
   if (list == null)
      return;
      
   var html = "";
   for (var i = 0; i < values.length; i++) {
      var value = values[i];
      html = html + "<option value='"+value.label+"' data-value='"+value.value+"'/>";
   }
   
   if (html != "") {
      list.empty();
      list.html(html);
   }
} // doDatalist

//---------------------------------------------------------------------
//
function doTd(node, value) {
   node.html(value);
} // doTd

//---------------------------------------------------------------------
// Form of value depends on the type of element being set.
//
function doSet(rec) {
   var id    = rec.id;
   var value = rec.value;

   $("#"+id).each(function() {
      var node = $(this);
      var type = node.attr("type");
      if (!type)
         type = node.attr("data-type");
      
      console.log("doSet: "+id+"="+type+": "+value);
      
      if      (!type)
         doText(node, value)
      else if (type == "buttongroup")
         doButtongroup(node, value);
      else if (type == "html")
         doHtml(node, value);
      else if (type == "grid")
         doGrid(node, value);
      else if (type == "text")
         doText(node, value);
      else if (type == "input")
         doInput(node, value);
      else if (type == "datetime")
         doText(node, value);
      else if (type == "select")
         doSelect(node, value);
      else if (type == "list")
         doList(node, value);
      else if (type == "radiogroup")
         doRadiogroup(node, value);
      else if (type == "checkgroup")
         doCheckgroup(node, value);
      else if (type == "datalist")
         doDatalist(node, value);
      else if (type == "td")
         doTd(node, value);
   });
} // doSet

//---------------------------------------------------------------------
// form of rec is
//    {"id":"...","value":"..."}
//
function doSetId(rec) {
   console.log("doSetId: " + rec.id + " = " + rec.value);
   
   var id  = rec.id;
   var value = rec.value;
   
   var node = $("[data-id='"+id+"']");
   if (node) {
      node.attr("id", value);
   }
} // doSetId
   
//---------------------------------------------------------------------
// form of rec is
//    {"name":"...","value":"..."}
//
function doSetVar(rec) {
   console.log("doSetVar: " + rec.name + " = " + rec.value);
   
   var name  = rec.name;
   var value = rec.value;
   
   if      (name === "sid")
      sid = value;
   else if (name === "rid")
      rid = value;
   else if (name === "pid")
      pid = value;
   else if (name === "title")
      title = value;
   else if (name === "duration")
      duration = parseInt(value, 10);
   
   // etc for additional variables as needed
   
} // doSetVar

//---------------------------------------------------------------------
//
function hideForDatetime(id) {
   var type = $("#"+id).attr("type");
   if (type && type == "datetime") {
      var calendarId = (id+fidgrd).split(fidgrd)[0]+"-calendar";
      $("#"+calendarId).hide();
   }
} // hideForDatetime

//---------------------------------------------------------------------
//
function showForDatetime(id) {
   var type = $("#"+id).attr("type");
   if (type && type == "datetime") {
      var calendarId = (id+fidgrd).split(fidgrd)[0]+"-calendar";
      $("#"+calendarId).show();
   }
} // showForDatetime

//---------------------------------------------------------------------
// Selector iterator function
//
function getKey(id, callback) {
   var key;
   if      (id.charAt(0) === '*')
      key = "[data-keys~='"+id.substring(1)+"']";
   else if (id.charAt(0) == '.' ||
            id.charAt(0) == '#') {
      key = id;
   }
   else
      key = "#" + id;

   return key;
} // getKey

//---------------------------------------------------------------------
// Sets the specified attribute to the specified value. If the attribute
// name is preceded with a minus-sign, the attribute is removed. If the
// attribute name is "class", then we use addClass and removeClass.
// Supports *, #, and . notation on the id.
//
function doAttr(rec) {
   var id    = rec.id;
   var attr  = rec.attr;
   var value = rec.value;
   
   var remove = false;
   if (attr.charAt(0) === '-') {
      remove = true;
      attr = substring(1);
   }
   
   console.log("doAttr: id="+id+", attr="+attr+", value="+value);
    
   var key = getKey(id);
   $(key).each(function() {
      var node = $(this);
      if (attr === "class") {
         if (remove)
            node.removeClass(value);
         else
            node.addClass(value);
      }
      else {
         if (remove)
            node.removeAttr(attr);
         else
            node.attr(attr, value);
      }
   });
} // doAttr

//---------------------------------------------------------------------
// If the first character of the id is an asterisk (*), then the id is
// used to match all elements with a data-key attribute that contains
// the id. Otherwise, only the single element having an id matching the
// specified id is affected. Note that the data-key attribute can contain
// multiple keywords separated by spaces.
//
function doDisable(rec) {
   var id = rec.id;
   
   console.log("doDisable: id="+id);
   
   var key = getKey(id);
   $(key).each(function() {
      var node = $(this);
      node.attr("disabled", true);
      
      var type = node.attr("type");
      if (type && type == "datetime") {
         var calendarId = (id+fidgrd).split(fidgrd)[0]+"-calendar";
         $("#"+calendarId).hide();
      }
   });
} // doDisable

//---------------------------------------------------------------------
// If the first character of the id is an asterisk (*), then the id is
// used to match all elements with a data-key attribute that contains
// the id. Otherwise, only the single element having an id matching the
// specified id is affected. Note that the data-key attribute can contain
// multiple keywords separated by spaces.
//
function doEnable(rec) {
   var id = rec.id;
   
   console.log("doEnable: id="+id);
   
   var key = getKey(id);
   $(key).each(function() {
     var node = $(this);
     node.removeAttr("disabled");
      
      var type = node.attr("type");
      if (type && type == "datetime") {
         var calendarId = (id+fidgrd).split(fidgrd)[0]+"-calendar";
         $("#"+calendarId).show();
      }
   });
} // doEnable

//---------------------------------------------------------------
// hide/show styles
var visStyle    = '0';
var hideStyle   = '1';
var fadeStyle   = '2';
var slideStyle  = '3';
var dialogStyle = '4';

//---------------------------------------------------------------------
//
function hideDialog(rec) {
   var id = rec.id;
         
   console.log("hideDialog for " + id);
   
   $("#"+id).colorbox.close();
 } // hideDialog

//---------------------------------------------------------------------
// If the first character of the id is an asterisk (*), then the id is
// used to match all elements with a data-keys attribute that contains
// the id. Otherwise, only the single element having an id matching the
// specified id is affected. Note that the data-keys attribute can contain
// multiple keywords separated by spaces.
//
function doHide(rec) {
   var id    = rec.id;
   var style = rec.value;
   
   console.log("doHide: id="+id+", style="+style);
   
   var key = getKey(id);
   $(key).each(function() {
      var node = $(this);
      if      (style == visStyle)
         node.hide();
      else if (style == hideStyle)
         node.hide(duration);
      else if (style == fadeStyle)
         node.fadeOut(duration);
      else if (style == slideStyle)
         node.slideUp(duration);
      else if (style=== dialogStyle)
         hideDialog(rec);
      
      var type = node.attr("type");
      if (type && type == "datetime") {
         var calendarId = (id+fidgrd).split(fidgrd)[0]+"-calendar";
         $("#"+calendarId).hide();
      }
   });
} // doHide

//---------------------------------------------------------------------
//
function showDialog(rec) {
   var id = rec.id;
         
   console.log("showDialog for " + id);
   
   var node = $("#"+id);
   $("#"+id).colorbox({open:true, inline:true, href:node, width:"90%",height:"90%"});
 } // showDialog

//---------------------------------------------------------------------
// If the first character of the id is an asterisk (*), then the id is
// used to match all elements with a data-keys attribute that contains
// the id. Otherwise, only the single element having an id matching the
// specified id is affected. Note that the data-keys attribute can contain
// multiple keywords separated by spaces.
//
function doShow(rec) {
   var id    = rec.id;
   var style = rec.value;
   
   console.log("doShow: id="+id+", style="+style);
   
   var key = getKey(id);
   $(key).each(function() {
      var node = $(this);
      if      (style == visStyle)
         node.show();
      else if (style == hideStyle)
         node.show(duration);
      else if (style == fadeStyle)
         node.fadeIn(duration);
      else if (style == slideStyle)
         node.slideDown(duration); 
      else if (style === dialogStyle)
         showDialog(rec);         
      
      var type = node.attr("type");
      if (type && type == "datetime") {
         var calendarId = (id+fidgrd).split(fidgrd)[0]+"-calendar";
         $("#"+calendarId).show();
      }
   });
} // doShow

//---------------------------------------------------------------------
// If the first character of the id is an asterisk (*), then the id is
// used to match all elements with a data-key attribute that contains
// the id. Otherwise, only the single element having an id matching the
// specified id is affected. Note that the data-key attribute can contain
// multiple keywords separated by spaces.
//
function doLock(rec) {
   var id = rec.id;
   
   console.log("doLock: id="+id);
   
   var key = getKey(id);
   $(key).each(function() {
      var node = $(this);
      node.attr("readonly", "readonly");
   });
} // doLock

//---------------------------------------------------------------------
// If the first character of the id is an asterisk (*), then the id is
// used to match all elements with a data-key attribute that contains
// the id. Otherwise, only the single element having an id matching the
// specified id is affected. Note that the data-key attribute can contain
// multiple keywords separated by spaces.
//
function doUnlock(rec) {
   var id = rec.id;
   
   console.log("doUnlock: id="+id);
   
   var key = getKey(id);
   $(key).each(function() {
      var node = $(this);
      node.removeAttr("readonly");
   });
} // doUnlock

//---------------------------------------------------------------------
// Finds the label for the specified field and marks it as required. Has
// no effect if the label already has the required mark. Note that this
// code assumes that the label associated with the specified field/group
// uses the id with the "-label" suffix. The user should only specify the
// id. Set the value parameter to 0 or leave it empty to clear an existing
// required mark, and set it to something other than 0 to set the mark.
//
function doRequired(rec) {
   var id  = rec.id;
   var clr = rec.value;
   if (clr && clr === '0') {
      clr = "";
   }
   
   console.log("doRequired: id="+id);
   
   // Some text in labels, some in spans
   $("#"+id).each(function() {
      var label = $(this);
      if (!label) {
         return;
      }
      
      var span = label.children("span");
      if (span) {
         span.remove();
      }
      
      if (clr) {
         label.prepend('<span style="color:red">* </span>');
      }
      
      return;
   });
   
   $("#"+id+"-label").each(function() {
      var label = $(this);
      if (!label) {
         return;
      }
      var span = label.children("span");
      if (span) {
         span.remove();
      }
      
      if (clr) {
         label.prepend('<span style="color:red">* </span>');
      }
   });
} // doRequired

//---------------------------------------------------------------------
// Finds the label for the specified field and clears the required
// indicator. Use this only to clear a required mark. Has no effect if
// the label does not have the required mark. Note that this code assumes
// that the label associated with the specified field/group uses the id
// with the "-label" suffix. The user should only specify the id.
//
function doOptional(rec) {
   var id = rec.id;
   
   console.log("doOptional: id="+id);
   
   $("#"+id+"-label").each(function() {
      var label = $(this);
      if (!label) {
         return;
      }
      var span = label.children("span");
      if (span) {
         span.remove();
      }
   });
} // doOptional

//---------------------------------------------------------------------
// If the specified node is a grid or a picklist, then clear the rows
// from its table. If the node is another type of group, then clear all
// of its children. This option can be used to remove a plugin, for
// example.
//
function doClear(rec) {
   console.log("doClear: " + rec.id);
   
   var id = rec.id;
   if (!id)
      return;
      
   $("#"+id).each(function() {
      var type = $(this).attr("data-type");

      if (type == "grid") {
         $("#"+id+"-body").children().remove();
      }
      else {
         $("#"+id).children().remove();
      }
   });   
} // doClear

//---------------------------------------------------------------------
// receives: value:{filename,filetype}
// returns:  nothing
// src:      http://www.javascriptkit.com/javatutors/loadjavascriptcss.shtml
//
function doLoad(rec) {
   var filename = rec.filename;
   var filetype = rec.filetype;

   // if filename is an external JavaScript file
   if      (filetype=="js") {
      var fileref = document.createElement('script');
      fileref.setAttribute("type","text/javascript");
      fileref.setAttribute("src", filename);
   }

   // if filename is an external CSS file
   else if (filetype=="css"){
      var fileref=document.createElement("link");
      fileref.setAttribute("rel", "stylesheet");
      fileref.setAttribute("type", "text/css");
      fileref.setAttribute("href", filename);
   }

   if (typeof fileref != "undefined")
      document.getElementsByTagName("head")[0].appendChild(fileref);
} // doLoad

//---------------------------------------------------------------------
// Receives grid id and row id. Gets the template fields and creates an
// empty row in the specified grid table using the specified row id. Note
// that the field id of each field in a row must have the form 
// fid-rowid-gridid.
//
function doAddRow(rec) {
   var grid  = rec.id;
   var rowid = rec.value.row;
   
   if (!grid || !rowid)
      return;
      
   console.log("doAddRow: " + grid + " = " + rowid);
   
   // Add the row to the specified grid
   var root = $("#"+grid);
   if (!root)
      return;
      
   var type = root.attr("data-type");
   if (type != "grid")
      return;
   
   var rid = root.attr("rid");
   if (!rid)
      return;
   
   var templates = root.children("div").eq(0).children();
   var table = $("#"+grid+"-table tbody");
         
   // Construct and append the row to the table
   var html = "<tr id='"+rowid+"' title='Click to edit this row'>";

   // Include the leading radio
   html = html + "<td><input type='radio' onclick='selectRow(\""+grid+","+rowid+","+rid+"\")'></span></td>";
         
   // This code requires that the tablecolumn elements are the first in
   // the templates list for the grid. I.e., the buttons are the last in
   // the list.
   var fields = rec.value.fields;
   for (var i = 0; i < templates.length; i++) {
     var template = templates[i];
     if (template.getAttribute("data-type") == "column" && fields.length > i)
        html = html + "<td><span data-type='"+type+"'>"+fields[i]+"</span></td>";
   }
   
   html = html + "</tr>";
   table.append(html);
} // doAddRow

//---------------------------------------------------------------------
// receives: id:fieldid,value:{concept,meaning,[id],[class]}
// adds:     <input type="checkbox" class="value.class" value="value.concept" id="value.id" name="id">
//           <label id="value.id-label" for="value.id">value.meaning</label>
//
function doAddCheckbox(rec) {
   var fieldId  = rec.id;
   var concept  = rec.value.concept;
   var meaning  = rec.value.meaning;
   var radioId  = rec.value.id;
   var theClass = rec.value.class;
   
   console.log("doAddCheckbox: id="+fieldId+", value="+concept+", label="+meaning);
   
   var html = "<input type='checkbox' name='"+fieldId+"' value='"+concept+"'";
   if (radioId) {
      html += " id='"+radioId+"'";
   }
   if (theClass) {
      html += " class='"+theClass+"'";
   }
   
   html = ">"+meaning+"</input>";
   
   html += "<label id='"+radioId+"-label' for='"+radioId+"'>"+meaning+"</label>";

   $('#'+fieldId).append(html);
} // doAddCheckbox

//---------------------------------------------------------------------
// receives: id:fieldid,value:{concept,meaning,[id],[class]}
// adds:     <input type="radio" class="value.class" value="value.concept" id="value.id" name="id">
//           <label id="value.id-label" for="value.id">value.meaning</label>
//
function doAddRadio(rec) {
   var fieldId  = rec.id;
   var concept  = rec.value.concept;
   var meaning  = rec.value.meaning;
   var radioId  = rec.value.id;
   var theClass = rec.value.class;
   
   console.log("doAddRadio: id="+fieldId+", value="+concept+", label="+meaning);
   
   var html = "<input type='radio' name='"+fieldId+"' value='"+concept+"'";
   if (radioId) {
      html += " id='"+radioId+"'";
   }
   if (theClass) {
      html += " class='"+theClass+"'";
   }
   
   html = ">"+meaning+"</input>";

   html += "<label id='"+radioId+"-label' for='"+radioId+"'>"+meaning+"</label>";

   $('#'+fieldId).append(html);
} // doAddRadio

//---------------------------------------------------------------------
// receives: fieldid,value:{concept,meaning,[optionid]}
//    addcheckbox fieldid,{concept,meaning,[checkboxid],[class]}
//    addradio    fieldid,{concept,meaning,[radioid],[class]}
//
// adds:     <option value="ADOL" [id="f1234-5"]>ADOL</option>
// 
function doAddOption(rec) {
   var fieldId  = rec.id;
   var concept  = rec.value.concept;
   var meaning  = rec.value.meaning;
   var optionId = rec.value.id;
   
   console.log("doAddOption: id="+fieldId+", concept="+concept+", meaning="+meaning);
   
   var field = $("#"+fieldId);
   var type = field.attr("data-type");
   if (!type)
      return;
   if (type === "checkgroup")
      return doCheckbox(rec);
   if (type === "radiogroup")
      return doAddRadio(rec);
   
   var html;
   if (optionId) {
      html = "<option value='"+concept+"',id='"+optionId+"'>"+meaning+"</option>";
   }
   else {
      html = "<option value='"+concept+"'>"+meaning+"</option>";
   }
   field.append(html);
} // doAddOption

//---------------------------------------------------------------------
// Cause the browser to refresh and load the requested url
//
function doRestart(rec) {
   var serv;
   if (typeServer === "java")
      serv = "";
   else 
      serv = servlet;
   var href = host + port + service + serv + folder + app + ".html";
   window.location.href = href;
} // doRestart

//---------------------------------------------------------------------
// receives: value:{message,eventname,parameter}
// returns:  {event:eventname,response:[true,false]}
//
function doConfirm(rec) {
   var message    = rec.value.message;
   var eventname  = rec.value.eventname;
   var parameter  = rec.value.parameter;
   if (!parameter) {
      parameter = "null";
   }
   
   console.log("doConfirm: message="+message+", event="+eventname+", parameter="+parameter);
   
   var r = confirm(message) ? "true" : "false";

   var value = '{"event":"'+eventname+'","response":"'+r+'","parameter":"'+parameter+'"}';
   var url   = makeUrl("submit", sid, rid, value, "post");
   console.log("doConfirm: " + url);
   SimpleAJAXCall(url, doResponse, "POST", "");
} // doConfirm

//---------------------------------------------------------------------
// receives: value:{message,dflt,eventname}
// returns:  {event:eventname,response:userinput}
// (note that there is a big hole here in what the user inputs!?)
//
function doPrompt(rec) {
   var message   = rec.value.message;
   var dflt      = rec.value.dflt;
   var eventname = rec.value.eventname;

   console.log("doPrompt: message="+message+", dflt="+dflt+", event="+eventname);
   
   var r = prompt(msg, dflt);

   var value = '{"event":"'+eventname+'","response":"'+r+'"}';
   var url   = makeUrl("submit", sid, rid, value, "post");
   console.log("doPrompt: " + url);
   SimpleAJAXCall(url, doResponse, "POST", "");
} // doPrompt

//---------------------------------------------------------------------
// TBD - find the field specified by the id, insert the note and open
// it. Need an indicator to record that a note is open to warn the user
// whenever saving. 
//
function doNote(rec) {
   var fid  = rec.id;
   var note = rec.value;
   
   console.log("doNote: fid="+fid+", note="+note);
   
   var node = $("#"+fid);
   if (!node) {
      console.log("doNote: Could not find node for fid="+fid);
      return;
   }
   node.html(note);
   
   var nid = 'n'+fid.substr(1);
   node = $("#"+nid);
   if (!node) {
      console.log("doNote: Could not find node for nid="+nid);
      return;
   }
   node.slideDown(300);
} // doNote

//---------------------------------------------------------------------
//
function doMsg(msg) {
  var msgWindow = window.open("","Server Error","scrollbars=yes,width=800,height=640");
  msgWindow.document.write(msg);
} // doMsg

//---------------------------------------------------------------------
//
function doCmd(rec) {
   var cmd = rec.cmd;

   console.log("doCmd cmd = " + cmd);
         
   cmd = cmd.toLowerCase();
   
   if      (cmd == "html") {
      $("#"+rec.id).each(function() {
         var node = $(this);
         node.html(rec.value);
      });
   }
   else if (cmd == "attr") {
      doAttr(rec);
   }
   else if (cmd == "set") {
      doSet(rec);
   }
   else if (cmd == "setid") {
      doSetId(rec);
   }
   else if (cmd == "setvar") {
      doSetVar(rec);
   }
   else if (cmd == "disable") {
      doDisable(rec);
   }
   else if (cmd == "enable") {
      doEnable(rec);
   }
   else if (cmd == "hide") {
      doHide(rec);
   }
   else if (cmd == "show") {
      doShow(rec);
   }
   else if (cmd == "lock") {
      doLock(rec);
   }
   else if (cmd == "unlock") {
      doUnlock(rec);
   }
   else if (cmd == "required") {
      doRequired(rec);
   }
   else if (cmd == "optional") {
      doOptional(rec);
   }
   else if (cmd == "remove") {
      $("#"+rec.id).remove();
   }
   else if (cmd == "deck") {
      var deck = rec.id;
      initDeck(deck);
   }
   else if (cmd == "goto") {
      var deck = rec.id;
      var value  = rec.value.toLowerCase();
      if      (value == "next") {
         gotoNextCard(deck);
      }
      else if (value == "previous") {
         gotoPreviousCard(deck);
      }
      else {
         gotoCard(deck, rec.value);
      }
   }
   else if (cmd == "path") {
      initPath(rec.value);
   }
   else if (cmd == "clear") {
      doClear(rec);
   }
   else if (cmd == "addrow") {
      doAddRow(rec);
   }
   else if (cmd == "delrow") {
      // TBD
   }
   else if (cmd == "addcheckbox") {
      doAddCheckbox(rec);
   }
   else if (cmd == "addradio") {
      doAddRadio(rec);
   }
   else if (cmd == "addoption") {
      doAddOption(rec);
   }
   else if (cmd == "perform") {
      return doPerform(rec);
   }
   else if (cmd == "load") {
      doLoad(rec);
   }
   else if (cmd == "restart") {
      doRestart(rec);
   }
   else if (cmd == "respond") {
      var url = makeUrl("submit", sid, rid, rec.value, "post");
      console.log("doCmd.respond: " + url);
      SimpleAJAXCall(url, doResponse, "POST", rec.value);
      return false;
   }
   else if (cmd == "alert") {
      alert(rec.value);
   }
   else if (cmd == "confirm") {
      doConfirm(rec);
   }
   else if (cmd == "prompt") {
      doPrompt(rec);
   }
   else if (cmd == "console") {
      console.log(rec.value);
   }
   else if (cmd == "note") {
      doNote(rec);
   }
   else if (doSRP2(rec))
      return true;
//?else if (doDSI(rec))
//?   return true;
//?etc...      
   
   return true;
} // doCmd

//---------------------------------------------------------------------
//
function doResponse(response, p) {
   $("#busy-image").hide();

   if (response.charAt(0) == '<') {
      doMsg(response);
      return;
   }
   
   if (response == "") {
      console.log("doResponse: response was empty");
      return;
   }
   
   console.log("doResponse: " + response);
   
   var cmds = JSON.parse(unwrap(response));
   
   if ($.isArray(cmds)) {
      for (var i = 0; i < cmds.length; i++) {
         var cmd = cmds[i];
         doCmd(cmd);
      }
   }         
   else {
      doCmd(cmds);
   }      
} // doResponse

