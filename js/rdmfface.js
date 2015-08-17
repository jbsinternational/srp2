
//*********************************************************************
// rdmfface.js
//*********************************************************************
//
// object dump:
//
// for (var i in obj) {
//    if (obj.hasOwnProperty(i)) {
//       console.log(i, '' + obj[i]);
//    }
// }
//
//*********************************************************************

//---------------------------------------------------------------------
// Prepare an unquoted value string for sending via JSON. Input form
// should be strings separated by commas and colons. I.e., a JSON string
// without the quotes. 
//
// if the input is
//    event:showEvent,page:3
//
// then the output will be
//    {"event":"showEvent","page":"3"}
//
// arrays are not supported
//
// note that the braces are also added automatically as a "bonus". So don't
// put them on your input string.
// 
function enquote(s) {
   var t = "";
   var scomma = s.split(',');
   for (var i = 0; i < scomma.length; i++) {
      var scolon = scomma[i].split(':');
      var name   = ',"'+scolon[0]+'"';
      var value  = '"'+scolon[1]+'"';
      t += name+':'+value;
   }
   
   return '{'+t.substr(1)+'}';
} // enquote

//---------------------------------------------------------------------
//
function onClick(mssg) {
   alert("onClick: " + mssg);
} // onClick
   
//?function updatePage() {
//?   document.getElementById("pidP").innerHTML = pid;
//?}
   
//---------------------------------------------------------------------
// "value":{"event":"deckId-page","value":"valstr"}
//
function gotoAjax(deckId, valstr) {
   // Construct the submit value...
   var value = '{"event":"'+deckId+'-page",'+valstr+'}';
   
   console.log("gotoAjax: value=" + value);

   var url = makeUrl("submit", sid, rid, value, "post");
   console.log("gotoAjax: " + url);
   SimpleAJAXCall(url, doResponse, "POST", "");
} // gotoAjax
 
//---------------------------------------------------------------------
// onclick="gotoPage('deckId1=topage1,deckId2=topage2,...')"
//
// output: "goto":"page","args":"deckId1=topage1,deckId2=topage2,..."
//
// Order of deckIds in parameter must be leaf-most deck to root-most deck.
// 
function gotoPage(deckTos) {
   var value  = '"goto":"page","args":"'+deckTos+'"';
   
   var decks  = deckTos.split(',');
   var deckId = decks[0].split('=')[0];
   gotoAjax(deckId, value);
 } // gotoPage
   
//---------------------------------------------------------------------
// onclick="gotoNextPage('deckId1,deckId2,...')"
//
// output: "goto":"next","args":"deckId1=page1,deckId2=page2,..."
//
// Order of deckIds in parameter must be leaf-most deck to root-most deck.
// 
function gotoNextPage(deckIds) {
   var decks = deckIds.split(',');
   var value = "";
   for (var i = 0; i < decks.length; i++) {
      value += ','+decks[i]+'='+whichCard(decks[i]);
   }
   
   if (value) {
      value = '"goto":"next","args":"'+value.substr(1)+'"';
      gotoAjax(decks[0], value);
   }
} // gotoNextPage
   
//---------------------------------------------------------------------
// onclick="gotoPreviousPage('deckId1,deckId2,...')"
//
// output: "goto":"prev","args":"deckId1=page1,deckId2=page2,..."
//
// Order of deckIds in parameter must be leaf-most deck to root-most deck.
// 
function gotoPreviousPage(deckIds) {
   var decks = deckIds.split(',');
   var value = "";
   for (var i = 0; i < decks.length; i++) {
      value += ','+decks[i]+'='+whichCard(decks[i]);
   }
   
   if (value) {
      value = '"goto":"prev","args":"'+value.substr(1)+'"';
      gotoAjax(decks[0], value);
   }
} // gotoPreviousPage
   
//---------------------------------------------------------------------
// note icon has ref to the annotation and a ref to the field id.
// <img src=icon" onclick="openNote('19', 'a1234_19','f1234_19')"/>
//
// a note:
//
// how to convert an element to a jquery object and vice versa:
//
//   var jelm    = $(elm); //convert to jQuery Element
//   var htmlElm = jelm[0]; //convert to HTML Element
//
function openNote(noteRid, noteId, fieldId) {
   var sibling = document.getElementById(fieldId);
   if (!sibling) {
      return;
   }
   
   var parent = sibling.parentNode;
   if (!parent) {
      return;
   }
   
   var lastChild = parent.lastChild();
   if (!lastChild) {
      return;
   }
   
   // Check that note is already in place
   var type = lastChild.getAttribute("data-type");
   if (type && type != "note") {
      // Find the annotation document for the specified rid
      var noteDoc = null;
      for (var i = 0; i < notes.length; i++) {
         var notepad = notes[i];
         if (notepad.rid == noteRid) {
            noteDoc = notepad.doc;
            break;
         }
      }
   
      if (!noteDoc) {
         return;
      }
   
      var note = noteDoc.getElementById(noteId);
      if (!note) {
         return;
      }
   
      lastChild = document.importNode(note, true);
      parent.appendChild(lastChild);
   }

   $(lastChild).slideDown(500);   
} // openNote

//---------------------------------------------------------------------
//
function cancelNote(fieldId) {
   var sibling = document.getElementById(fieldId);
   if (!sibling) {
      return;
   }
   
   var parent = sibling.parentNode;
   if (!parent) {
      return;
   }
   
   var lastChild = parent.lastChild();
   if (!lastChild) {
      return;
   }
   
   $(lastChild).slideUp(500);   
} // cancelNote

//---------------------------------------------------------------------
// <textarea id="'+aid+'-input_text" ...
//
function okNote(fieldId) {
// must send the user input to the app server
   $("#"+fieldId+"-input_text").each(function() {
      var text = $(this).html();
      console.log("okNote: "+text);
      
      // post this to the app server
   });

   cancelNote(fieldId);
} // okNote

//---------------------------------------------------------------------
// 
function submit(text) {
   var value = enquote(text);
   
   console.log("submit: value=" + value);

   var url = makeUrl("submit", sid, rid, value, "post");
   console.log("submit: " + url);
   SimpleAJAXCall(url, doResponse, "POST", "");
} // submit
