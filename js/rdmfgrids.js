   //------------------------------------------------------------------
   //
   function initGrids(tableRid) {
      console.log("initGrids for "+tableRid);

      $("[data-type='grid'][rid='"+tableRid+"']").each(function() {
         var node    = $(this);
         var type    = node.attr("data-type");
         var gridid  = node.attr("id");
         if (!gridid || gridid.length == 0) {
            alert("initGrids: Could not find grid id.");
            return;
         }
         
         console.log("initGrids: initializing "+gridid+" as type "+type);
         
         // Get the rid and test for relevance
         var myrid = node.attr("rid");
         if (tableRid != myrid) {
            console.log("initGrids: ignore because gid="+gridid+" but rid="+tableRid);
            return;
         }
         
/*?
         // Connect to the dialog that services this grid (if any)
         var dlg = $("[data-gridid='"+gridid+"']:first");
         if (dlg) {
            var dlgid = dlg.attr("id");
            node.attr("data-dlgid", dlgid);
            console.log("dialog for grid="+gridid+" is "+dlgid);
         }
?*/
         
         // Find the parent row for the header titles
         var header = $("#"+gridid+"-header");
         if (!header) {
            alert("initGrids: Could not find header row.");
            return;
         }
         
         // Find the parent row for the footer buttons
         var footer = $("#"+gridid+"-footer .actions");
         if (!footer) {
            alert("initGrids: Could not find footer row.");
            return;
         }
      
         // Find the templates for the header fields
         var templates = $("#"+gridid+"-templates");
         if (!templates) {
            alert("initGrids: Could not find templates container.")
            return;
         }
         
         var children = templates.children();
         if (!children) {
            alert("initGrids: Could not find column information.");
            return;
         }

         // Create the header field html
         var headerHtml = "<th width='20px'>&nbsp;</th>";
         var footerHtml = "";
         children.each(function() {
            var child  = $(this);
            var fid    = child.attr("id");
            var dmem   = child.attr("data-member");
            var title  = child.attr("data-title");
            var width  = child.attr("data-width");
            if (!width)
               width = "25";
            var type   = child.attr("type");
            var cls    = child.attr("class");
            console.log("fid="+fid);
            if (type === "button") {
               var onclick = child.attr("onclick");
               var button = "<button type=\"button\" class=\""+cls+"\" onclick=\""+onclick+"\">"+title+"</button>";
               footerHtml = footerHtml+button;
            }
            else {
               var onclick = "sortGrid('"+gridid+","+rid+","+dmem+"')";
               var heading = "<th onclick=\""+onclick+"\" style=\"width:"+width+"%\">"+title+"</th>";
               headerHtml = headerHtml+heading;
            }
         });
         
         // Insert the heading fields into the table header row
         header.html(headerHtml);
         
         // Insert the buttons into the table footer row
         footer.html(footerHtml);
         
         // Create the footer field html
         
/*?
         // Build the reference field id list
            var key  = "";
            var refs = '[';
            children.each(function() {
               var node = $(this);
               var fid  = node.attr("id");
               if (node.attr("data-key") == "true") {
                  key = fid;
               }               

               console.log("fid="+fid+", key="+key);
               
               var ref  = node.attr("data-ref");
               if (!fid || !ref) {
                  alert("picklist template field missing id or ref attr\nThis must be fixed");
                  return;
               }
               refs = refs + '{"id":"'+fid+'","ref":"'+ref+'"},';
            });
         
            if (refs.length > 1) {
               var len = refs.length-1;
               if (refs.charAt(len) == ',') {
                  refs = refs.substr(0, len);
               }
            }
            refs = refs + ']';
            
            if (key != null) {
               key = '"key":"'+key+'"';
            }
?*/
            
         // Request the app server to provide the data to fill the table

         // Put the necessary information into the submit request
         var value = '{"event":"loadGrid","id":"'+gridid+'","page":"F"}'; //? ,'+key+',"refs":'+refs+'}';
         var url   = makeUrl("submit", sid, myrid, value, "post");
         console.log("initGrids: " + url);
         
         // Paul wants the app server to load all the data, including
         // the grids in a single getData("all") call.
//?      SimpleAJAXCall(url, doResponse, "POST", "");
      });
   } // initGrids
   
//---------------------------------------------------------------------
// Handle a user onclick event on a grid row.
//
// parameter: gridid,rowid,rid
//
function selectRow(parm) {
   var parms = parm.split(',');
   var grid  = parms[0];
   var row   = parms[1];
   var rid   = parms[2];
   
   console.log("selectRow: gridid="+grid+", row="+row+", rid="+rid);
   
   // Check if disabled
   var disabled = $("#"+grid).attr("disabled");
   if (disabled && disabled == "true") {
      return;
   }
   
   // Construct the submit value...
   var value = '{"event":"selectRow","id":"'+grid+'","row":"'+row+'"}';
   
   console.log("submit: value="+value);
      
   // ...and submit it
   var url = makeUrl("submit", sid, rid, value, "post");
   console.log("selectRow: " + url);
   SimpleAJAXCall(url, doResponse, "POST", "");
} // selectRow

//---------------------------------------------------------------------
// Handle an onclick event on a grid paging button
// 
// Paging buttons must have the following onclick attributes:
//
//    onclick="loadGrid('grid,rid,F')" for first
//    onclick="loadGrid('grid,rid,P')" for previous
//    onclick="loadGrid('grid,rid,N')" for next
//    onclick="loadGrid('grid,rid,L')" for last
//
// They are set up in the renderer template for the grid
//
// This code uses the parameter to generate an app server request having
// the following form:
//
// value = {event:loadGrid,id:<gridid>,op:SetPage,value:[F(irst|P(rev|N(ext|L(ast]}
//
function loadGrid(pkid) {
   var fields = pkid.split(',');
   var grid   = fields[0];
   var rid    = fields[1];
   var dir    = fields[2];
      
   // Put the information into the submit request and ship it.
   var value = enquote('event:loadGrid,id:'+grid+',op:SetPage,value:'+dir);
   var url   = makeUrl("submit", sid, rid, value, "post");
   console.log("loadGrid: " + url);
   SimpleAJAXCall(url, doResponse, "POST", "");
} // loadGrid

//---------------------------------------------------------------------
// Handle an onclick event on a grid sortable column header
// 
// Sortable column headers must have the following onclick attributes:
//
//    onclick="sortGrid('grid,rid,columnid')"
//
// They are set up in the renderer template for the grid
//
// This code uses the parameter to generate an app server request having
// the following form:
//
// value = {event:loadGrid,id:<gridid>,columnid}
//
function sortGrid(pkid) {
   var fields = pkid.split(',');
   var grid   = fields[0];
   var rid    = fields[1];
   var colid  = fields[2];
      
   // Put the information into the submit request and ship it.
   var value = enquote('event:loadGrid,id:'+grid+',op:SetSortColumn,value:'+colid);
   var url   = makeUrl("submit", sid, rid, value, "post");
   console.log("sortGrid: " + url);
   SimpleAJAXCall(url, doResponse, "POST", "");
} // sortGrid

