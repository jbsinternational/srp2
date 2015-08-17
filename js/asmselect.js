
//*********************************************************************
// asmselect.js
//*********************************************************************
//
// notes:
//
// sortable: use insertion sort in asmAddListItem method.
//
//*********************************************************************

   //------------------------------------------------------------------
   //
   function initAsmSelect() {
      var options = {
         listType: 'ul',                           // Ordered list 'ol', or unordered list 'ul'
         sortable: true,                          // Should the list be sortable? (not supported)
         highlight: false,                         // Use the highlight feature?
         animate: false,                           // Animate the adding/removing of items in the list?
         addItemTarget: 'bottom',                  // Where to place new selected items in list: top or bottom
         hideWhenAdded: false,                     // Hide the option when added to the list? works only in FF
         debugMode: false,                         // Debug mode keeps original select visible

         removeLabel: 'remove',                    // Text used in the "remove" link
         highlightAddedLabel: 'Added: ',           // Text that precedes highlight of added item
         highlightRemovedLabel: 'Removed: ',       // Text that precedes highlight of removed item

         selectClass: 'asmSelect',                 // Class for the newly created <select>
         optionDisabledClass: 'asmOptionDisabled', // Class for items that are already selected / disabled
         listClass: 'asmList',                     // Class for the list ($ol)
         listSortableClass: 'asmListSortable',     // Another class given to the list when it is sortable
         listItemClass: 'asmListItem',             // Class for the <li> list items
         listItemLabelClass: 'asmListItemLabel',   // Class for the label text that appears in list items
         removeClass: 'asmListItemRemove',         // Class given to the "remove" link
         highlightClass: 'asmHighlight'            // Class given to the highlight <span>
      };
      
      var $optionId;                         // id of the option
      var $option;                           // the option we are manipulating
      var $selectId;                         // id of the select
      var $select;                           // the select we are manipulating
      var $ol;                               // the list that we are manipulating
      var ieClick = false;                   // in IE, has a click event occurred? ignore if not
      
      $("select.asmSelect").change(function(e) {
//?         if ($.browser.msie && $.browser.version < 7 && !ieClick)
//?            return;
          
         $optionId = $(this).children("option:selected").slice(0,1).attr('id');
         if (!$optionId) return;
            
         $option   = $("#"+$optionId);
         $selectId = $optionId.split("-")[0];
         $select   = $("#"+$selectId);
         $ol       = $("#"+$selectId+"-list");
         
         asmAddListItem($optionId);
         ieClick = false;
      });
         
      $("select.asmSelect").click(function(e) {
         ieClick = true;
      });

      //------------------------------------------------------------
      // Add a new item to the html list. Form of the optionId is
      //    f1234_12-i
      // where i is the index of the identified option.
      //
      function asmAddListItem(optionId) {

         if ($option.attr("selected"))
            return; // already has it
         $option.attr('selected', true);
        
         // Add an anchor link to remove the list item
         var $removeLink = $("<a></a>")
            .attr("href", "#")
            .addClass(options.removeClass)
            .prepend(options.removeLabel)
            .click(function() {
               $optionId = $(this).parent('li').attr('ref');
               
               if (!$optionId) return;
            
               $option   = $("#"+$optionId);
               $selectId = $optionId.split("-")[0];
               $select   = $("#"+$selectId);
               $ol       = $("#"+$selectId+"-list");
               
               asmDropListItem();
               return false;
            });

         // Add a span to display the option meaning
         var $itemLabel = $("<span></span>")
            .addClass(options.listItemLabelClass)
            .html($option.html());

         // Wrap the link and the span into a list item
         var $item = $("<li></li>")
            .attr('ref', $optionId)
            .addClass(options.listItemClass)
            .append($itemLabel)
            .append($removeLink)
            .hide();

         if    (options.sortable) {
            asmInsertItem($item);
         }
         else if (options.addItemTarget == 'top') {
            $ol.prepend($item);
         } 
         else {
            $ol.append($item);
         }

         asmAddListItemShow($item);

         asmDisableSelectOption();

//?         asmSetHighlight($item, options.highlightAddedLabel);

         asmSelectFirstItem();
      } // asmAddListItem
      
      //------------------------------------------------------------
      //
      function asmInsertItem($item) {
         var sibs = $ol.children("li");
         
         // First entry
         if (!sibs || sibs.length == 0) {
            $ol.append($item);
            return;
         }
         
         var text = $item.children("span").html();
         
         for (var i = 0; i < sibs.length; i++) {
            var sib = $(sibs[i]);
            var txt = sib.children("span").html();
            if (txt > text) {
               sib.before($item);
               return;
            }
         }
         
         $ol.append($item);
      } // asmInsertItem

      //------------------------------------------------------------
      // reveal the currently hidden item with optional animation
      // used only by addListItem()
      //
      function asmAddListItemShow($item) {

         if (options.animate) {
            $item.animate({
               opacity: "show",
               height: "show"
            }, 100, "swing", function() {
               $item.animate({
                  height: "+=2px"
               }, 50, "swing", function() {
                  $item.animate({
                     height: "-=2px"
                  }, 25, "swing");
               });
            });
         }
         else {
            $item.show();
         }
      } // asmAddListItemShow

      //------------------------------------------------------------
      // remove an item from the html list
      //
      function asmDropListItem(highlightItem) {

         $option.attr('selected', false);
         $item = $ol.children("li[ref=" + $optionId + "]");

         asmDropListItemHide($item);
         asmEnableSelectOption(); //? $("[ref=" + $optionId + "]", options.removeWhenAdded ?
            //?$selectRemoved : 
            //?$select));

//?         if (highlightItem == undefined)
//?            var highlightItem = true;
//?         if (highlightItem)
//?            asmSetHighlight($item, options.highlightRemovedLabel);

//?         triggerOriginalChange(optionId, 'drop');
      } // asmDropListItem

      //------------------------------------------------------------
      // remove the currently visible item with optional animation
      // used only by dropListItem()
      //
      function asmDropListItemHide($item) {

         if (options.animate) {

            var $prevItem = $item.prev("li");

            $item.animate({
               opacity: "hide",
               height: "hide"
            }, 100, "linear", function() {
               $prevItem.animate({
                  height: "-=2px"
               }, 50, "swing", function() {
                  $prevItem.animate({
                     height: "+=2px"
                  }, 100, "swing");
               });
               $item.remove();
            });
         }
         else {
            $item.remove();
         }
      } // asmDropListItemHide

      //------------------------------------------------------------
      // select the firm item from the regular select that we created
      //
      function asmSelectFirstItem() {

         $select.children(":eq(0)").attr("selected", true);
      } // asmSelectFirstItem

      //------------------------------------------------------------
      // disable an option to indicate that it's selected. Because
      // safari is the only browser that makes disabled items look
      // 'disabled', we apply a class that reproduces the disabled
      // look in other browsers.
      //
      function asmDisableSelectOption() {

         $option.addClass(options.optionDisabledClass)
                .attr("selected", false)
                .attr("disabled", true);

         if (options.hideWhenAdded)
            $option.hide();
            
//?         if ($.browser.msie)
         $select.hide().show(); // forces IE to update display
      } // asmDisableSelectOption

      //------------------------------------------------------------
      // Enable a disabled select option.
      //
      function asmEnableSelectOption() {

         $option.removeClass(options.optionDisabledClass)
                .attr("disabled", false);

         if (options.hideWhenAdded)
            $option.show();
            
//?         if ($.browser.msie)
         $select.hide().show(); // forces IE to update display
      } // asmEnableSelectOption

      //------------------------------------------------------------
      // set the contents of the highlight area that appears
      // directly after the <select> single
      // fade it in quickly, then fade it out
      //
/*?
      function asmSetHighlight($item, label) {

         if(!options.highlight) return;

         $select.next("#" + options.highlightClass + index).remove();

         var $highlight = $("<span></span>")
            .hide()
            .addClass(options.highlightClass)
            .attr('id', options.highlightClass + index)
            .html(label + $item.children("." + options.listItemLabelClass).slice(0,1).text());

         $select.after($highlight);

         $highlight.fadeIn("fast", function() {
            setTimeout(function() { $highlight.fadeOut("slow"); }, 50);
         });
      } // asmSetHighlight
?*/      
   } // function initAsmSelect
