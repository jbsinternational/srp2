
//*********************************************************************
// rdmfpulls.js
//*********************************************************************

   //------------------------------------------------------------------
   //
   function initClicks() {
   
      //------------------------------------------------------------------
      //
      $(".datetime").formatter({'pattern':'{{99}}/{{99}}/{{9999}}', 'persistent': true});
      
      //------------------------------------------------------------------
      //
      $("section").click(function(event) {
         var tagname = $(event.target).prop("tagName").toLowerCase();
         if (tagname != "img") {
            if (pickfid) {
               $("#"+pickfid+"-datediv").datepicker().hide();
               pickfid = "";
            }
         }
      });
      
      //------------------------------------------------------------------
      //
/*? some sample code from a suggestion re 
   "Problem using multiple datePicker instances and renaming fields"
      $('.datepicker').live('focus',function(){
            $(this).removeClass('datepicker').datepicker().focus();
            return false;
         });
?*/         
   $("img.dateshow").click(function(event) {
      var node = $(this);
      var fid = node.attr("data-ref");
      pickfid = fid.split(fidgrd)[0];
      $("#"+pickfid+"-datediv").datepicker( {
            onSelect: function(datetext, inst) {
               if (datetext) {
                  var fid = node.attr("data-ref");
                  $("#"+fid).val(datetext);
                  
                  // Get the rid from the fid, if available 
                  rid = getRid(fid, node);                  
      
                  console.log("select.submit.change: fid="+fid+", rid="+rid);
      
                  var value = '{"id":"'+fid+'","value":"'+datetext+'"}';
                  var url   = makeUrl("data", sid, rid, value, "post");
                  console.log("datepicker.onSelect: " + url);
                  SimpleAJAXCall(url, doResponse, "POST", "");
                  
                  window.setTimeout(function() {
                     $("#"+pickfid+"-datediv").datepicker().hide();}, 5);
               }
            }
         }).show();
   });

   $("[data-type='dialog-add']").click(function() {
         var dialogid = $(this).attr("data-ref");
         var dialog   = $("#"+dialogid);
         var rcdid    = dialog.attr("data-rcdref");
         var ctxid    = dialog.attr("data-ctxref");
         var value    = '{"event":"dialog-add","dialogid":"'+dialogid+'","rcdid":"'+rcdid+'","ctxid":"'+ctxid+'"}';
         var url      = makeUrl("submit", sid, rid, value, "post");
         console.log("dialog.add: " + url);
         SimpleAJAXCall(url, doResponse, "POST", "");
      });
      
      //---------------------------------------------------------------
      //
      $("[data-type='dialog-accept']").click(function() {
         var dialogid = $(this).attr("data-ref");
         var dialog   = $("#"+dialogid);
         var rcdid    = dialog.attr("data-rcdref");
         var ctxid    = dialog.attr("data-ctxref");
         var value    = '{"event":"dialog-accept","dialogid":"'+dialogid+'","rcdid":"'+rcdid+'","ctxid":"'+ctxid+'"}';
         var url      = makeUrl("submit", sid, rid, value, "post");
         console.log("dialog.accept: " + url);
         SimpleAJAXCall(url, doResponse, "POST", "");
      });
      
      //---------------------------------------------------------------
      //
      $("[data-type='dialog-cancel']").click(function() {
         var dialogid = $(this).attr("data-ref");
         var dialog   = $("#"+dialogid);
         var rcdid    = dialog.attr("data-rcdref");
         var ctxid    = dialog.attr("data-ctxref");
         var value    = '{"event":"dialog-cancel","dialogid":"'+dialogid+'","rcdid":"'+rcdid+'","ctxid":"'+ctxid+'"}';
         var url      = makeUrl("submit", sid, rid, value, "post");
         console.log("dialog.cancel: " + url);
         SimpleAJAXCall(url, doResponse, "POST", "");
      });
      
      //---------------------------------------------------------------
      //
      $("[data-type='dialog-delete']").click(function() {
         var dialogid = $(this).attr("data-ref");
         var dialog   = $("#"+dialogid);
         var rcdid    = dialog.attr("data-rcdref");
         var ctxid    = dialog.attr("data-ctxref");
         var value    = '{"event":"dialog-delete","dialogid":"'+dialogid+'","rcdid":"'+rcdid+'","ctxid":"'+ctxid+'"}';
         var url      = makeUrl("submit", sid, rid, value, "post");
         console.log("dialog.delete: " + url);
         SimpleAJAXCall(url, doResponse, "POST", "");
      });
      
      //---------------------------------------------------------------
      //
      $('.hamburger').click(function() {
         $(this).toggleClass('open').siblings('nav').slideToggle(1000);
      });

      //---------------------------------------------------------------
      //
      $("[data-type='collapsible']").on("click", function() {
         var bttn  = $(this);
         var id    = bttn.attr("data-ref");
         var state = bttn.attr("data-state");
         console.log("clicked collapsible for " + id + " state = " + state);
         
         var node = $("#"+id);
         if (!node)
            console.log("clicked collapsible for "+id+" but got nothin");
           
         if (!state) {
            bttn.attr("data-state", "open");
            state = "open";
         }
         if (state == "open") {
            bttn.attr("data-state", "closed");
            node.slideUp(500);
         }
         else {
            bttn.attr("data-state", "open");
            node.slideDown(500);
         }
      });
   } // initClicks

   //---------------------------------------------------------------------
   //
   function navHideShow(ulx) {
      console.log("hideShowList: "+ulx);
      var ul = $("#"+ulx);
      var hidden = ul.attr("data-state");
      if (hidden == "true") {
         ul.attr("data-state", "false");
         ul.slideDown(300);
      }
      else {
         ul.attr("data-state","true");
         ul.slideUp(300);   
      }
   } // navHideShow

   //------------------------------------------------------------------
   //
   function initKeyboard() {

      $("input[type=number]").keypress(function(event) {
         if (!isNumber(event)) {
            alert("This field requires number inputs");
            return false;
         }
      });
   }
   
   //------------------------------------------------------------------
   //
   function initTables(tableRid) {
      console.log("initTables for "+tableRid);

      $("[data-type='picklist'][id$='_"+tableRid+"'],[data-type='grid'][id$='_"+tableRid+"']").each(function() {
         var node = $(this);
         var type = node.attr("data-type");
         var gid  = node.attr("id");
         if (!gid || gid.length == 0) {
            alert("initTables: Could not find id.");
            return;
         }
         
         console.log("initTables: initializing "+gid+" as type "+type);
         
         if (type == "grid") {
            // Find the dialog that services this grid
            var dlg = $("[data-rcdref='"+gid+"']:first");
            if (!dlg) {
               alert("initTables: Could not find the dialog servicing "+gid);
               return;
            }
            var did = dlg.attr("id");
            node.attr("data-dlgref", did);
            console.log("dialog for grid="+gid+" is "+did);
            }
         
         // Get the rid from the id and test for relevance
         var parts = gid.split(fidrid);
         var myrid = parts[parts.length-1];

         if (tableRid != myrid) {
            console.log("initTables: ignore because gid="+gid+" but rid="+tableRid);
            return;
         }
         
         // This is where we insert the heading fields
         var header = $("#"+gid+"-header");
         if (!header) {
            alert("initTables: Could not find header.");
            return;
         }
      
         var template = $("#"+gid+"-template");
         if (!template) {
            alert("initTables: Could not find template container.")
            return;
         }
         
         var children = template.children();
         if (!children) {
            alert("initTables: Could not find column information.");
            return;
         }

         // Create the header field html
         var html = "";
         var refs = '[';
         children.each(function() {
            var node  = $(this);
               var fid  = node.attr("id");
               console.log("fid="+fid);
            var title = node.attr("data-title");
            var width = node.attr("data-width");
            html      = html+"<th style='width:"+width+"%'>"+title+"</th>";
         });
         
         // Insert the heading fields into the table heading row
         header.html(html);
         
         // Request the app server to provide the data to fill the table
         // if picklist or grid has the data-load attribute.
         var dataload = node.attr("data-load");
         if (dataload) {
            var page = node.attr("data-page");
            if (!page) {
               page="0";
            }
               
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
            
            // Put the necessary information into the submit request
            var value = '{"event":"'+dataload+'","page":"'+page+'",'+key+',"refs":'+refs+'}';
            var url   = makeUrl("submit", sid, myrid, value, "post");
            console.log("initTables: " + url);
            SimpleAJAXCall(url, doResponse, "POST", "");
         }
      });
   } // initTables
   
   $(document).ready();
