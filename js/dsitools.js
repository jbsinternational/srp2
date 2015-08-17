
//---------------------------------------------------------------
// Loads and displays the guidance panel
//
function doHelp() {
   var card = whichCard("rdmf-deck");
   var link;
   switch (card) {
      case '0': {
         return;
      }
      case '1': {
         link = "home";
         break;
      }
      case '2': {
         card = whichCard("report-deck");
         switch (card) {
            case '0': {
               link = $($("#masterPlugin").children()[0]).attr("id");
               break;
            }
            case '1': {
               card = whichCard("19-plugin_19");
               link = $($("#19-plugin_19").children()[card]).attr("id");
               break;
            }
            default: {
               return;
            }
         }
         break;
      }
      default: {
         return;
      }
   }
   var url = "dsi-help.html#"+link;
   if (helpWindow == null || helpWindow.closed) {
      helpWindow = window.open(url,"Guidance","scrollbars=yes,width=800,height=640");
   }
   else {
      helpWindow.open(url,"Guidance");
   }
} // doHelp
      
//---------------------------------------------------------------------
// Download file
//
function downloadFile(url, success) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = "blob";
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (success) {
                success(xhr.response);
                console.log('Downloaded file');
            }
        }
    };
    xhr.send(null);
} // downloadFile

//---------------------------------------------------------------------
// GetSaisReport button
//    - Generate SAIS report functionality using DDRWH Reporting WebApi (Girish)
//
function GetSaisReport() {
    var taId = $('#f2687_20').val().substring(1);   // get rid of the 'S' in taid
    var taPrefix = $('#f2687_20').val().charAt(0);
    var fullDate = new Date(); //console.log(fullDate);
    var twoDigitMonth = fullDate.getMonth() + ""; if (twoDigitMonth.length == 1) twoDigitMonth = "0" + twoDigitMonth;
    var twoDigitDate = fullDate.getDate() + ""; if (twoDigitDate.length == 1) twoDigitDate = "0" + twoDigitDate;
    var currentDate = twoDigitMonth + twoDigitDate + fullDate.getFullYear(); //console.log(currentDate);

//    $(document = function () {
//        $("#btnXmlPost").click(function () {
 //           downloadFile('http://localhost:65449/' + "template/getbinarytasaisdatav1/" + taId + "/" + taPrefix, function (blob) { saveAs(blob, "SAIS-" + taId + "-" + currentDate + ".docx"); });
    downloadFile('http://p-datamart.jbsinternational.com/' + "template/getbinarytasaisdatav1/" + taId + "/" + taPrefix, function (blob) { saveAs(blob, "SAIS-" + taId + "-" + currentDate + ".docx"); });
    //        });
//    });
} // GetSaisReport

//---------------------------------------------------------------------
// ExportData button
//      - Generate a dump of all TA data in DDRWH as a Excel spreadsheet
//
function ExportData() {
//    $(document = function () {
//        $("#btnXmlPost").click(function () {
            downloadFile('http://p-datamart.jbsinternational.com/' + "template/getbinarytamasterdatav1", function (blob) { saveAs(blob, "GrantDataV3.xlsx"); });
//            downloadFile('http://localhost:65449/' + "template/getbinarytamasterdatav1", function (blob) { saveAs(blob, "GrantDataV3.xlsx"); });
//        });
//    });
} // ExportData