
   //==================================================================
   //
   // How to control RQ paging:
   //
   // 1. Each RQ contains one deck element and a set of card elements,
   // which are the children of the deck.
   //
   // 2. The id of the deck element has the form <reportid>-pager. For
   // example, the id of the deck for the Pet Food Safety Report RQ is
   // "5-pager". The id of the deck for the Tobacco Product Report RQ
   // is "11-pager"; and for the login RQ, it is "login-pager".
   //
   // 3. Every card element in an RQ corresponds to an ioNode type group
   // row in the specific report in the Metadata DB.
   //
   // 4. There is one card element for each ioNode having a cardinality
   // of one.
   //
   // 5. The id of a card element has the form g<groupid>. I.e., it starts
   // with the lower-case letter "g", and is suffixed with the Metadata
   // group id. It is marked so that group ids do not conflict with field
   // ids, which have the form f<fieldid>. The group id is the group id
   // of the corresponding ioNode row.
   //
   //==================================================================
   //
   // A deck can be implemented using any HTML element, usually a div,
   // with an id attribute, and having a set of children, each of which
   // can display as a card within the deck. Only one card of a given deck is
   // visible at a time when the deck interface is used consistently.
   // 
   // example deck:
   //
   // <div id="deckid">
   //   <section>
   //     stuff for card 0
   //   </section>
   //   <section>
   //     stuff for card 1
   //   </section>
   //   more sections, divs, etc
   //   <section>
   //     stuff for card n
   //   </section>
   // </div>
   //
   // Each deck within the web page must first be initialized by calling
   // initDeck(), which initializes the specified deck. You can also init-
   // ialize a set of decks calling initPath(). Be sure not to call
   // initDeck() or initPath() until you are sure that the target HTML has
   // been loaded. After that, use the gotoCard(), gotoNextCard(), and
   // gotoPreviousCard() commands to navigate among the cards within an
   // initialized deck.
   //
   // bool = initDeck(deckid);
   // void = initPath(deckid=cardid[,deckid=cardid]
   // bool = gotoCard(deckid, cardid);
   // bool = gotoNextCard(deckid);
   // bool = gotoPreviousCard(deckid);
   // int  = whichCard(deckid);
   // int  = cardCount(deckid);
   //
   // The initPath command allows to initialize a set of decks to display
   // specified cards.
   // 
   // The gotoCard command allows the second parameter to be specified as
   // an index to the desired card, starting with the first card as the
   // zero-th card.
   //
   // The gotoCard command can also use the id of a target card, but you
   // must distinguish a cardid from a card index by starting all cardids
   // with a non-digit.
   // 
   // The gotoNextCard command takes no action if the last card is the
   // visible card. Likewise, the gotoPreviousCard command takes no action
   // if the first card is the visible card.
   //
   // Each of the goto* commands return the jQuery node made visible.
   //   
   // The data-card attribute is used in the deck element to track which
   // card is visible. The deck library uses the hidden attribute in the
   // card-elements to control their visibility.
   //
   // Since the library identifies deck elements by their id attribute,
   // any number of decks, both nested and otherwise, can be used. Note
   // that any HTML grouping element can be used as a deck, as well as
   // for any card.
   //
   //==================================================================
   
   //------------------------------------------------------------------
   // This method must be called to initialize the deck elements in the
   // HTML document, but only after the HTML document is fully loaded.
   // It insures that the first card of the specified deck is to be
   // visible by default, and it sets up the deck and card elements to
   // keep track of the visibility of the card elements.
   //
   function initDeck(_deck) {
      if (!_deck) {
         console.log("initDeck: no deck id specified");
         return;
      }
      
      console.log("initDeck for deck " + _deck);      

//?   $('#'+_deck).find("[data-type='deck']").each(function() {});
      var deck = $('#'+_deck);
      if (!deck) {
         console.log("initDeck error: deck element for " + _deck + " not found.");
         return false;
      }
         
      console.log("initializing deck " + deck.attr("id"));
  
      deck.attr("data-card", "0");
            
      var iCard = 0;
      $(deck.children()).each(function() {
         var card = $(this);
         if (iCard == 0) {
            card.removeAttr("hidden");
         }
         else {
            card.attr("hidden", "hidden");
         }
         iCard++;
      });
      
      return true;
   } // initDeck
   
   //------------------------------------------------------------------
   // Return the current card index
   //
   function whichCard(_deck) {
      if (_deck == "") {
         console.log("whichCard error: no deck specified");
         return 0;
      }
      
      var deck = $("#"+_deck);
      if (deck.length == 0) {
         console.log("whichCard error: deck element for " + _deck + " not found.");
         return 0;
      }

      return deck.attr("data-card");
   } // whichCard
   
   //------------------------------------------------------------------
   // Return the number of cards within the specified deck.
   //
   function cardCount(_deck) {
      if (!_deck) {
         console.log("cardCount: no deck id specified");
         return;
      }
      
      console.log("cardCount for deck " + _deck);
      
      var deck = $("#"+_deck);
      if (deck.length == 0) {
         console.log("cardCount error: deck element for " + _deck + " not found.");
         return 0;
      }

      var iCard = 0;
      
      $(deck.children()).each(function() {
         var card = $(this);
         iCard++;
      });

      return iCard;
   } // cardCount
   
   //------------------------------------------------------------------
   // If the specified card does not exist, then return false, else
   // make the specified card visible and return true. The iCard
   // parameter may be an index to the desired card, or it can be the
   // id of the desired card. In that case, the value must not be
   // numeric. Cards are numbered such that the first card is the
   // zero-th card.
   //
   function gotoCard(_deck, _iCard) {
      if (!_deck) {
         console.log("gotoCard: no deck id specified");
         return;
      }
      
      console.log("gotoCard "+_iCard+" for deck "+_deck);
      
      if (!_iCard) {
         console.log("gotoCard error: no card specified for deck " + _deck);
         return false;
      }
      
      var deck = $("#"+_deck);
      if (deck.length == 0) {
         console.log("gotoCard error: deck element for " + _deck + " not found.");
         return 0;
      }

      var thisCard  = parseInt(deck.attr("data-card"), 10);

      var iCard = 0;
      var foundCard = false;

      // Handle gotoCard by id
      var cardId = _iCard;
      if (isNaN(_iCard)){
         $(deck.children()).each(function() {
            var card = $(this);
            if (cardId == card.attr("id")) {
               deck.attr("data-card", iCard);
               card.removeAttr("hidden");
               foundCard = true;
            }
            else {
               card.attr("hidden", "hidden");
            }
            iCard++;
         });
      }
      
      // Handle gotoCard by index
      else {
         $(deck.children()).each(function() {
            var card = $(this);
            if (iCard == _iCard) {
               deck.attr("data-card", iCard);
               card.removeAttr("hidden");
               foundCard = true;
            }
            else {
               card.attr("hidden", "hidden");
            }
            iCard++;
        });
      }
      
      return foundCard;
   } // gotoCard

   //------------------------------------------------------------------
   // Allows to initialize a set of decks to specified cards.
   // form is
   //
   //    deckid=cardid[,deckid=cardid]
   //
   // Entries missing a deck specifier are ignored. Entries missing a
   // card specifier (either id or index) default to the first card.
   //
   function initPath(_path) {
      if (!_path) {
         console.log("initPath: no path specified");
         return;
      }
      
      console.log("initPath "+_path);

      var path = _path.split(',');
      for (var i = 0; i < path.length; i++) {
         var pi    = path[i];
         if (!pi)
            continue;
         var dAndC = pi.split('=');
         var deck  = dAndC[0];
         var card  = dAndC[1];
         if (!deck)
            continue;
         if (!card)
            card = '0';
         initDeck(deck);
         gotoCard(deck, card);
      }      
   } // initPath
   
   //------------------------------------------------------------------
   // If the deck is not at the last card, then display the next card
   // and return true. Otherwise, make no change and return false.
   //
   function gotoNextCard(_deck) {
      if (!_deck) {
         console.log("gotoNextCard: no deck id specified");
         return;
      }
      
      console.log("gotoNextCard for deck " + _deck);
      
      var deck = $("#"+_deck);
      if (deck.length == 0) {
         console.log("gotoNextCard error:  error: deck element for " + _deck + " not found.");
         return 0;
      }

      var thisCard = parseInt(deck.attr("data-card"), 10);
      
      var nextCard = thisCard + 1;
      var lastCard = cardCount(_deck);
      if (nextCard == lastCard) {
         console.log("gotoNextCard: already at end of deck " + _deck);
         return false;
      }

      var iCard = 0;
      var foundCard = false;

      $(deck.children()).each(function() {
         var card = $(this);
         if (iCard == nextCard) {
            deck.attr("data-card", nextCard);
            card.removeAttr("hidden");
            foundCard = true;
         }
         else {
            card.attr("hidden", "hidden");
         }
         iCard++;
      });
      
      return foundCard;
   } // gotoNextCard

   //------------------------------------------------------------------
   // If the deck is not at the first card, then display the previous
   // card and return true. Otherwise, make no change and return false.
   //
   function gotoPreviousCard(_deck) {
      if (!_deck) {
         console.log("gotoPreviousCard: no deck id specified");
         return;
      }
      
      console.log("gotoPreviousCard in deck " + _deck);

      var deck = $("#"+_deck);
      if (deck.length == 0) {
         console.log("gotoPreviousCard error: deck element for " + _deck + " not found.");
         return 0;
      }

      var thisCard = parseInt(deck.attr("data-card"), 10);
      var prevCard = thisCard - 1;
      if (prevCard < 0) {
         console.log("gotoPreviousCard: already at beginning of deck " + _deck);
         return false;
      }
     
      var iCard = 0;
      var foundCard = false;

      $(deck.children()).each(function() {
         var card = $(this);
         if (iCard == prevCard) {
            deck.attr("data-card", prevCard);
            card.removeAttr("hidden");
            foundCard = true;
         }
         else {
            card.attr("hidden", "hidden");
         }
         iCard++;
      });
      
      return foundCard;
   } // gotoPreviousCard   
