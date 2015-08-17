
//*********************************************************************
// rdmfvalidate.js
//*********************************************************************
//
// This module provides user input validation based on the declared type
// of the input element so that only type-valid data is sent to the 
// server.
//
// Note: if present in the specified node, the data-regx attribute
// provides an expression to apply to the specified value. 
//
//*********************************************************************

//---------------------------------------------------------------------
//
function validField(node, value) {
   var maxlength = node.attr("maxlength");
   if (maxlength && maxlength > 0) {
      if (value.length > maxlength)
         return "Input text is too long. Must not be longer than " + maxlength + " characters.";      
   }
   
   return null;
} // validField

//---------------------------------------------------------------------
// node: <input id="username" type="text" maxlength="50">
//
function validText(node, id, value) {
   console.log("validText: " + id + " = " + value);
   
   if (!value || value.length == 0)
      return null;
   
   return validField(node, value);
} // validText

//---------------------------------------------------------------------
// node: <input id="password" type="password" maxlength="50">
//
function validPswd(node, id, value) {
   console.log("validPswd: " + id + " = " + value);
   
   if (!value || value.length == 0)
      return null;
   
   return validField(node, value);
} // validPswd

//---------------------------------------------------------------------
// node: <input id="f68" type="number" maxlength="6">
//
// data-type="[int|float]" is optional. If absent, then any number
// that is short enough is accepted.
//
function validNumber(node, id, value)
{
   console.log("validNumber: " + id + " = " + value);
   
   if (!value || value.length == 0)
      return null;
   
   var dataType = node.attr("data-type");
   if (dataType) {
      dataType = dataType.toLowerCase();

      switch (dataType) {
         case "int":
            var msg = validField(node, value);
            if (msg) {
               return msg;
            }

            var regx = /^[-+]?[0-9]*$/;
            if (!regx.test(value)) {
               return "Input (int) format is not recognized";
            }
            break;
         case "decimal":
            var msg = validField(node, value);
            if (msg) {
               return msg;
            }

            var regx = /^[-+]?[0-9]*\.?[0-9]+$/;
            if (!regx.test(value)) {
               return "Input (decimal) format is not recognized";
            }
            break;
         case "float":               
            var msg = validField(node, value);
            if (msg) {
                   return msg;
            }
            //MP: added by Matt Parantha for standard SRP validation for input type = float
            //1) get width and scale for this float     
            var specs = node.attr("data-width");
            var arr = specs.split(",");
            var width = parseInt(arr[0]);
            var scale = parseInt(arr[1]);
            var err1 = "Input (float) format is not recognized. Exponential notation is not supported.";
            var err2 = "";
            if (scale == 0) {
               err2 = "Invalid number. Valid numbers must have 1 to " + width + " digits. No decimal point is accepted. Commas can be used as thousand separators, i.e. to group exactly 3 digits at the right of the comma. Note commas are not considered as parts of the numeric data.";
            }
            else {
               err2 = "Input (float) format is not recognized. Valid numbers must have 1 to " + width + " digits including up to " + scale + " fractional digits. Also valid numbers must not have comma (,) or dot (.) as the last character.";
            }
               
            if (value != null && value != "") {
               //2) We don't allow exponential notation if scale and precision are specified for a numeric
               if (value.lastIndexOf('e') >= 0 || value.lastIndexOf('E') >= 0)
                  return err1;                       
               //3)Verify decimal posi
   
               // var pattern = "^[-+]?([0-9]{1,3}),?([0-9]{3},?)*([0-9]{3}|[0-9]+)(\.[0-9]{1," + ((scale>0)?scale:1) + "})?$";
   
               var pattern = "^[-+]?([0-9]{1,3}),?([0-9]{3},?)*([0-9]{3}|[0-9]+)";

               if (scale > 0)
                  pattern += "(\.[0-9]{1," + scale + "})?$";
               else
                  pattern += "$";

               var doublefloatRegEx = new RegExp(pattern);
               if (!doublefloatRegEx.test(value)) {
                  console.log("I'm here!");
                  return err2;
               }
               else {
                  var count = 0;
                  for (var i = 0; i < value.length; i++) {
                     var ch = value.charAt(i);
                     count += (0 <= ch && 9 >= ch) ? 1 : 0;
                  } 
                  if (count > width) {
                     return err2;
                  }

/*
                  var valueAsFloat = parseFloat(value);
                  if (scale > width || valueAsFloat == null ||isNaN(valueAsFloat) || value != valueAsFloat) {
                     return err2;
                  }
                  else {
                     var calculatedPrecision = 0;
                     var calculatedScale = 0;
                     var valueAsString = value;
                     valueAsString = valueAsString = valueAsString.replace("-", "").trim();
                     valueAsString = valueAsString.replace("+", "").trim();
                     valueAsString = valueAsString.replace(",", "").trim();
                     calculatedPrecision = valueAsString.replace(".", "").length;
                     var decimalPosition = valueAsString.lastIndexOf('.');
                     if (decimalPosition >= 0) {
                        calculatedScale = Math.max(0, (calculatedPrecision - decimalPosition));
                     }
                     else {
                        calculatedScale = 0;
                     }
                     if (!((calculatedPrecision <= precision) && (calculatedScale <= scale))) {
                        return err2;
                     }
                  }
*/
               }
            }
            break;
         case "money":
            var msg = validField(node, value);
            if (msg) {
               return;
            }

            var specs = node.attr("data-width");
            var arr = specs.split(",");
            var width = parseInt(arr[0]);
            var scale = parseInt(arr[1]);
            var newWidth = width + scale;
            var newWidth2 = width-scale;
            regx = new RegExp("^[0-9]{0,"+newWidth2+"}(\\.[0-9][0-9])?$");
            if (!regx.test(value)) {
               return "Please enter the cost value without the currency symbol or commas. Example: 5001.01 or 45678";
            }
            break;
         default:
            return validField(node, value);
      }           
   }        
   return null;
} // validNumber

//---------------------------------------------------------------------
// node: <input id="f845" type="datetime" maxlength="35">
//
// assumes that the field only contains a standard numeric date, no
// time.
//
// data-form="MM/dd/yyyy" is optional. If absent, then US standard.
//
function validDatetime(node, id, value) {
   console.log("validDatetime: " + id + " = " + value);
   
   if (!value || value.length == 0)
      return null;
   
   var msg = validField(node, value);
   if (msg) {
      return msg;
   }
   
   var regx = /^[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}$/;
   if (!regx.test(value)) {
      return "Date requires MM/dd/yyyy format.";
   }
   
   var fields = value.split('/');
   
   if (fields.length != 3) {
      return "Date requires MM/dd/yyyy format.";
   }
   
   var mo = fields[0];
   var da = fields[1];
   var yr = fields[2];
   
   if (yr < 1900 || yr > 2099)
      return "Year should be between 1900 and 2099."; 
   
   if (mo < 1 || mo > 12)
      return "Month must be between 1 and 12.";
      
   // Compute the number of days in the specified month
   var max = 31;
   if      (mo == 4 || mo == 6 || mo == 9 || mo == 11)
      max = 30;
   else if (mo == 2) {
      max = 28;
      if (yr % 4 == 0) {
         max = 29;
         if ((yr % 100) == 0 && ((yr / 100) % 4) != 0)
            max = 28;
      }
   }
   
   if (da < 1 || da > max)
      return "Day must be between 1 and " + max + ".";

   return null;
} // validDatetime

