
//---------------------------------------------------------------------
// rdmfsrp2.js
//---------------------------------------------------------------------
//
// Routines specific to SRP2
//
//    select      id, {key, attrname, attrvalue}
//    RQSelect    id
//    status      id, {key, state}
//    RQStatus    id, state
//    error       id, msg
//
//---------------------------------------------------------------------

//---------------------------------------------------------------------
// Set a specified attribute of one of a specified set of elements
// while clearing the same attribute from all the others in the same set.
//
// Find the set of elements whose data-keys attributes contain the value
// specified by the key parameter, and remove their attributes as
// identified by the name parameter.
//
// Next, find the element whose data-keys attribute contains both the
// specified id and the specified key and set its attribute to the
// specified value.
//
// The function pre-supposes that each element in the set contains a
// data-keys attribute that contains a specified id and a key value that
// associates them as a set. The data-keys attribute also contains
// the word "select."
// 
// Form of menuSelect command values is
//    {id:?,key:?,attrname:?,attrvalue:?}
//
// All parameters are required.
//
function doSelectTOC(rec) {
   var id    = rec.id;
   var key   = rec.value.key;
   var attr  = rec.value.attr;
   var value = rec.value.value;
   
   if (!id)
      return true;
   
   if (!key)
      return true;
   
   if (!attr)
      return true;
   
   if (attr === "class") {
      $("[data-keys~='"+key+"'][data-keys~='select']").removeClass(value);
      $("[data-keys~='"+key+"'][data-keys~='"+id+"'][data-keys~='select']").addClass(value);
   }
   else {
      $("[data-keys~='"+key+"'][data-keys~='select']").removeAttr(attr);
      $("[data-keys~='"+key+"'][data-keys~='"+id+"'][data-keys~='select']").attr(attr, value);
   }
   return true;
} // doSelectTOC

//---------------------------------------------------------------------
// Manages the left-hand buttons on the My Reports page. Requires only
// page id. The other parameters are plugged in.
// (UserHome select userhome)
//
function doMyReportsSelect(rec) {
   rec.value = {key: "userhome", attr: "class", value: "active"};
   
   return doSelectTOC(rec);
} // doMyReportsSelect

//---------------------------------------------------------------------
// Requires only page id. The other parameters are plugged in.
//
function doRQSelect(rec) {
   rec.value = {key: "RQTOC", attr: "class", value: "active"};
   
   return doSelectTOC(rec);
} // doRQSelect

//---------------------------------------------------------------------
// Find the img element in the set of img elements whose data-keys
// attributes contain the value specified by the key parameter, and set
// its src attribute to specify the image associated with the state
// parameter.
//
// The function pre-supposes that each img element in the set contains
// a data-keys attribute that contains a specified id and the key value
// that associates them as a set. The data-keys attribute also contains
// the word "status."
// 
// Form of status command values is
//    {id:?,value:{key:?,state:?}}
//
// The id parameter is not required. If it is omitted, all the elements
// within the set identified by the key will be set to the specified state.
//
// [7/2/2015 5:21 PM] Paul Donovan: 
//   Not visited
//   Current (not used here)
//   Incomplete
//   Completed
//
function doStatusTOC(rec) {
   var id    = rec.id;
   var key   = rec.value.key;
   var state = rec.value.state;
   
   if (!key)
      return;
   
   if (!state)
      return;
   
   var src = "";
   state = state.toLowerCase();
   if      (state === "not visited")
      src = "icon_untouched.png";
   else if (state === "notvisited")
      src = "icon_untouched.png";
   else if (state === "incomplete")
      src = "icon_incomplete.png";
   else if (state === "completed")
      src = "icon_complete.png";
   
   if (!id) // allow to set all to specific status
      $("[data-keys~='"+key+"'][data-keys~='status']").attr("src", "img/" + src);
   else
      $("[data-keys~='"+id+"'][data-keys~='"+key+"'][data-keys~='status']").attr("src", "img/" + src);
   
   return true;
} // doStatusTOC

//---------------------------------------------------------------------
// Simplifies the Application Server's command to set the status image 
// of a menu item associated with the RQ page specified by the id.
//
// If the id is omitted, then the status images of all the menu items
// are set according to the specified state.
//
// Below is a list of the possible states:
//  
//   Not visited
//   Incomplete
//   Completed
// 
function doRQStatus(rec) {
   rec.value = {key: "RQTOC", state: rec.state};
   
   return doStatusTOC(rec);
} // doRQStatus

//---------------------------------------------------------------------
// helper function for doSRPError
//
function setInputControlFocus(id) {
   if (!id)
      return;
   
   $("#"+id).focus();
} // setInputControFocus

//---------------------------------------------------------------------
// form of rec is {id,msg}
//
// where
//    id  = id of field in error
//    msg = the error message
//
// field error sample:
//
// <span style="" 
//       for="ctrlValEmailAddress_216" 
//       class="PromptErrorText" 
//       id="lblErrMsgEmailAddress_216">Please retype your email address in the Confirm Email field below.</span>
//
// error list sample:
//
// <div id="ctl00_m_MainAreaContentPlaceHolder_m_ErrorSummary">
//   <ul style="" class="JbsPromptErrorList" id="ctl00_m_MainAreaContentPlaceHolder_m_ErrorSummary_m_ctrlErrorList">
//     <li style="display:none;" id="ctl00_m_MainAreaContentPlaceHolder_m_ErrorSummary_m_liRendererError"></li>
//     <li promptname="EmailAddress_216" style="">
//       <h3 class="Header3ValidationErrors">
//         <a onclick="return jbsSetInputControlFocus('EmailAddress_216');" href="#" class="CustomValidationErrorMessage">Email : Please retype your email address in the Confirm Email field below.
//         </a>
//       </h3>
//     </li>
//     <li promptname="ConfirmEmailAddress_1343">
//       <h3 class="Header3ValidationErrors">
//         <a onclick="return jbsSetInputControlFocus('ConfirmEmailAddress_1343');" href="#" class="CustomValidationErrorMessage">Confirm Email : Error: Email address and confirmation email address fields do not match. Please re-enter email address.
//         </a>
//       </h3>
//     </li>
//   </ul>
// </div>
//
function doSRPError(rec) {
   var id  = rec.id;
   var msg = rec.value;
   
   if (!id)
      return true;
   
   // Use $errorid^-error to delete error span if any.
   $("#"+id+"-error").remove();
   
   // Find the field div using $errorid^-div as id, and
   // append error message span as last child to the div.
   $("#"+id+"-div").append("<span id='"+id+"-error' for='"+id+"' class='PromptErrorText'>"+msg+"</span>"); 
   
   // Find the ionode ancestor of the field.
   var pageid = $("#"+id).parents("[data-type='page']").attr("id");
   if (!pageid)
      return true;
   
   // Find the error list (ul) using the $pageid^-errorlist as the id,
   // and append an li element to the list with the error message.
   var onclick = 'onclick="setInputControlFocus('+"'"+id+"');";
   $("#"+pageid+"-errorlist").append('<li><h3 class="Header3ValidationErrors"><a '+onclick+'" href="#" class="CustomValidationErrorMessage">'+msg+'</a></h3></li>');
   
   return true;
} // doSRPError

//---------------------------------------------------------------------
// form of rec is
//    {"name":"method","value":"parameters"}
//
// called from rdmfresponse.doResponse.
// note that this should be the last command in a response list.
//
function doSRP2(rec) {
   var cmd = rec.cmd;
   
   if      (cmd === "MyReportsSelect")
      return doMyReportsSelect(rec);
   else if (cmd === "RQSelect")
      return doRQSelect(rec);
   else if (cmd === "RQStatus")
      return doRQStatus(rec);
   else if (cmd === "error")
      return doSRPError(rec);
      
   // etc for additional methods
   
   return true;
} // doSRP2
