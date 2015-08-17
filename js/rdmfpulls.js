
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
         
         var head = $("#"+id+"-heading");
         if (!head)
            console.log("clicked collapsible for "+id+" but got no heading");           
         
         var node = $("#"+id);
         if (!node)
            console.log("clicked collapsible for "+id+" but got nothin");
           
         if (!state) {
            bttn.attr("data-state", "open");
            state = "open";
         }
         if (state == "open") {
            bttn.attr("data-state", "closed");
            head.removeClass("active-tab-heading");
            node.removeClass("active-panel");
            node.slideUp(duration);
         }
         else {
            bttn.attr("data-state", "open");
            head.addClass("active-tab-heading");
            node.addClass("active-panel");
            node.slideDown(duration);
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
   
   $(document).ready();
