/**
*  Ajax Autocomplete for jQuery, version 1.2.4
*  (c) 2013 Tomas Kirda
*
*  Ajax Autocomplete for jQuery is freely distributable under the terms of an MIT-style license.
*  For details, see the web site: http://www.devbridge.com/projects/autocomplete/jquery/
*
*  Local modifications by Jim Homan Feb-Mar 2013.
*/

/*jslint  browser: true, white: true, plusplus: true */
/*global define, window, document, jQuery */

// Expose plugin as an AMD module if AMD loader is present:
(function (factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    'use strict';

    var
        utils = (function () {
            return {

                extend: function (target, source) {
                    return $.extend(target, source);
                },

                addEvent: function (element, eventType, handler) {
                    if (element.addEventListener) {
                        element.addEventListener(eventType, handler, false);
                    } else if (element.attachEvent) {
                        element.attachEvent('on' + eventType, handler);
                    } else {
                        throw new Error('Browser doesn\'t support addEventListener or attachEvent');
                    }
                },

                removeEvent: function (element, eventType, handler) {
                    if (element.removeEventListener) {
                        element.removeEventListener(eventType, handler, false);
                    } else if (element.detachEvent) {
                        element.detachEvent('on' + eventType, handler);
                    }
                },

                createNode: function (html) {
                    var div = document.createElement('div');
                    div.innerHTML = html;
                    return div.firstChild;
                }

            };
        }()),

        keys = {
            ESC: 27,
            TAB: 9,
            RETURN: 13,
            UP: 38,
            DOWN: 40
        };

    function Autocomplete(el, options) {
        var noop = function () { },
            that = this,
            defaults = {
                autoSelectFirst: false,
                appendTo: 'body',
                serviceUrl: null,
                lookup: null,
                onSelect: null,
                width: 'auto',
                minChars: 1,
                maxHeight: 300,
                deferRequestBy: 0,
                params: {},
                formatResult: Autocomplete.formatResult,
                delimiter: null,
                zIndex: 9999,
                type: 'GET',
                noCache: false,
                onSearchStart: noop,
                onSearchComplete: noop,
                containerClass: 'autocomplete-suggestions',
                tabDisabled: false,
                dataType : 'text',
                lookupFilter: function (suggestion, originalQuery, queryLowerCase) {
                    return suggestion.value.toLowerCase().indexOf(queryLowerCase) !== -1;
                },
                paramName: 'query',
                transformResult: function (response) {
                    return response.suggestions;
                },
                callbackData: null,
                initialValue: null,
                dataKey: null,
                initialData: null,
                noFabricate: false,
                instructions: null,
                onlyValuesFromSuggestions: false
            };

        // Shared variables:
        that.element = el;
        that.el = $(el);
        that.suggestions = [];
        that.selectedIndex = -1;
        that.currentValue = that.element.value;
        that.intervalId = 0;
        that.cachedResponses = {};
        that.onChangeInterval = null;
        that.onChange = null;
        that.ignoreValueChange = false;
        that.isLocal = false;
        that.suggestionsContainer = null;
        that.options = $.extend({}, defaults, options);
        that.classes = {
            selected: 'autocomplete-selected',
            suggestion: 'autocomplete-suggestion'
        };
        that.lastActionMadeSelection = false,
        that.valueAtFocusTime = false,
        that.ignoreBlurUntilListCloses = false;
        that.curWidth = null;
        that.instructionsDisplayed = false;
        that.valueFromSuggestion = null;

        // Initialize and set options:
        that.initialize();
        that.setOptions(options);
    }

    Autocomplete.utils = utils;

    $.Autocomplete = Autocomplete;

    Autocomplete.formatResult = function (suggestion, currentValue) {
        var reEscape = new RegExp('(\\' + ['/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\'].join('|\\') + ')', 'g'),
            pattern = '(' + currentValue.replace(reEscape, '\\$1') + ')';

        return suggestion.value.replace(new RegExp(pattern, 'gi'), '<strong>$1<\/strong>');
    };

    Autocomplete.prototype = {

        killerFn: null,

        initialize: function () {
            var that = this,
                suggestionSelector = '.' + that.classes.suggestion,
                selected = that.classes.selected,
                options = that.options,
                container;

            // Remove autocomplete attribute to prevent native suggestions:
            that.element.setAttribute('autocomplete', 'off');

            that.killerFn = function (e) {
                if ($(e.target).closest('.' + that.options.containerClass).length === 0) {
                    that.killSuggestions();
                    that.disableKillerFn();
                }
            };

            // Determine suggestions width:
            if (!options.width || options.width === 'auto') {
                that.curWidth = that.el.outerWidth();
            } else {
                that.curWidth = options.width;
            }

            that.suggestionsContainer = Autocomplete.utils.createNode('<div class="' + options.containerClass + '" style="position: absolute; display: none;"></div>');

            container = $(that.suggestionsContainer);

            container.appendTo(options.appendTo).width(that.curWidth);

            // Listen for mouse over event on suggestions list:
            container.on('mouseover', suggestionSelector, function () {
                that.activate($(this).data('index'));
            });

            // Deselect active element when mouse leaves suggestions container:
            container.on('mouseout', function () {
                that.selectedIndex = -1;
                container.children('.' + selected).removeClass(selected);
            });

            // Listen for click event on suggestions list:
            container.on('click', suggestionSelector, function () {
                that.select($(this).data('index'), false);
            });

            // Listen for mousedown event on suggestions list:
            container.on('mousedown', suggestionSelector, function () {
                // If a blur will happen because the selection list is clicked, some of
                // the onBlur handling should not happen. mousedown happens before blur,
                // while click happens after blur.
                that.ignoreBlurUntilListCloses = true;
            });

            that.fixPosition();

            // Opera does not like keydown:
            if (window.opera) {
                that.el.on('keypress', function (e) { that.onKeyPress(e); });
            } else {
                that.el.on('keydown', function (e) { that.onKeyPress(e); });
            }

            if (that.options.initialValue) {
                // Set initial value if it's supplied
                that.el.val(that.options.initialValue);
                that.valueFromSuggestion = that.options.initialValue;
                that.instructionsDisplayed = false;
                that.el.removeClass('autocomplete-instructions');
            }
            else {
                // Display instructions if they're supplied
                that.el.val(that.options.instructions);
                that.instructionsDisplayed = true;
                that.el.addClass('autocomplete-instructions');
            }

            if (that.options.dataKey) {
                that.el.data(that.options.dataKey, that.options.initialData);
            }

            that.el.on('keyup', function (e) { that.onKeyUp(e); });
            that.el.on('blur', function () { that.onBlur(); });
            that.el.on('focus', function () { that.onFocus(); });
        },
        reinitialize: function(newOptions) {
            var that = this;
            that.setOptions(newOptions);
            that.initialize();
        },

        onFocus: function() {
            var that = this;
            that.fixPosition();
            if (that.instructionsDisplayed) {
                that.el.val('');
                that.el.removeClass('autocomplete-instructions');
                that.instructionsDisplayed = false;
            }
            that.valueAtFocusTime = that.el.val();
            // The assumption is that value when entering the field is a valid value.
            that.valueFromSuggestion = that.el.val();
        },

        onBlur: function () {
            var that = this;


            if (that.options.onlyValuesFromSuggestions && !that.ignoreBlurUntilListCloses) {
                // If the user has typed the full text of the only remaining suggestion
                // before leaving the autocompleter, treat that as making a selection.
                if (that.suggestions.length === 1) {
                    if (that.currentValue.toLowerCase() === that.suggestions[0].value.toLowerCase()) {
                        that.select(0);
                    }
                }

                // If the user has not selected a value from the list, and the value is
                // not the value the control started with when it got the focus, clear
                // the textbox before leaving. Instructions will subsequently get redisplayed.
                if (that.valueFromSuggestion === '' && that.el.val() != that.valueAtFocusTime) {
                    that.currentValue = '';
                    that.el.val('');
                    that.instructionsDisplayed = false;
                    that.el.removeClass('autocomplete-instructions');
                    if (that.options.dataKey) {
                        that.el.data(that.options.dataKey, '');
                    }
                    if ($.isFunction(that.options.onSelect)) {
                        that.options.onSelect.call(that.element, null, that.options.callbackData);
                    }
                }
            }

            // If value is empty or only white space, redisplay instructions
            if (that.options.instructions && !that.instructionsDisplayed && /^\s*$/.test(that.el.val())) {
                that.el.val(that.options.instructions);
                that.instructionsDisplayed = true;
                that.el.addClass('autocomplete-instructions');
            }

            this.enableKillerFn();
        },

        setOptions: function (suppliedOptions) {
            var that = this,
                options = that.options;

            utils.extend(options, suppliedOptions);

            that.isLocal = $.isArray(options.lookup);

            if (that.isLocal) {
                options.lookup = that.verifySuggestionsFormat(options.lookup);
            }

            // Adjust height, width and z-index:
            $(that.suggestionsContainer).css({
                'max-height': options.maxHeight + 'px',
                'width': that.curWidth + 'px',
                'z-index': options.zIndex
            });
        },

        clearCache: function () {
            this.cachedResponses = [];
        },

        disable: function () {
            this.disabled = true;
        },

        enable: function () {
            this.disabled = false;
        },

        fixPosition: function () {
            var that = this,
                offset;

            // Don't adjsut position if custom container has been specified:
            if (that.options.appendTo !== 'body') {
                return;
            }

            offset = that.el.offset();

            $(that.suggestionsContainer).css({
                top: (offset.top + that.el.outerHeight()) + 'px',
                left: offset.left + 'px'
            });
        },

        enableKillerFn: function () {
            var that = this;
            $(document).on('click', that.killerFn);
        },

        disableKillerFn: function () {
            var that = this;
            $(document).off('click', that.killerFn);
        },

        killSuggestions: function () {
            var that = this;
            that.stopKillSuggestions();
            that.intervalId = window.setInterval(function () {
                that.hide();
                that.stopKillSuggestions();
            }, 300);
        },

        stopKillSuggestions: function () {
            window.clearInterval(this.intervalId);
        },

        onKeyPress: function (e) {
            var that = this;

            that.lastActionMadeSelection = false;

            // If suggestions are hidden and user presses arrow down, display suggestions:
            if (!that.disabled && !that.visible && e.keyCode === keys.DOWN && that.currentValue) {
                that.suggest();
                return;
            }

            if (e.keyCode !== keys.TAB && e.keyCode !== keys.RETURN) {
                that.valueFromSuggestion = '';
            }

            if (that.disabled || !that.visible) {
                return;
            }

            switch (e.keyCode) {
                case keys.ESC:
                    that.el.val(that.currentValue);
                    that.hide();
                    break;
                case keys.TAB:
                case keys.RETURN:
                    if (that.selectedIndex === -1) {
                        that.hide();
                        return;
                    }
                    that.select(that.selectedIndex, e.keyCode === keys.RETURN);
                    that.lastActionMadeSelection = true;
                    if (e.keyCode === keys.TAB && this.options.tabDisabled === false) {
                        return;
                    }
                    break;
                case keys.UP:
                    that.moveUp();
                    break;
                case keys.DOWN:
                    that.moveDown();
                    break;
                default:
                    return;
            }

            // Cancel event if function did not return:
            e.stopImmediatePropagation();
            e.preventDefault();
        },

        onKeyUp: function (e) {
            var that = this;

            if (that.disabled) {
                return;
            }

            switch (e.keyCode) {
                case keys.UP:
                case keys.DOWN:
                    return;
            }

            clearInterval(that.onChangeInterval);

            if (that.currentValue.toLowerCase() !== that.el.val().toLowerCase()) {
                if (that.options.deferRequestBy > 0) {
                    // Defer lookup in case when value changes very quickly:
                    that.onChangeInterval = setInterval(function () {
                        that.onValueChange();
                    }, that.options.deferRequestBy);
                } else {
                    that.onValueChange();
                }
            }
        },

        onValueChange: function () {
            var that = this,
                q;

            clearInterval(that.onChangeInterval);
            that.currentValue = that.element.value;

            q = that.getQuery(that.currentValue);
            that.selectedIndex = -1;

            if (that.ignoreValueChange) {
                that.ignoreValueChange = false;
                return;
            }

            if (q.length < that.options.minChars) {
                that.hide();
            } else {
                that.getSuggestions(q);
            }
        },

        getQuery: function (value) {
            var delimiter = this.options.delimiter,
                parts;

            if (!delimiter) {
                return $.trim(value);
            }
            parts = value.split(delimiter);
            return $.trim(parts[parts.length - 1]);
        },

        getSuggestionsLocal: function (query) {
            var that = this,
                queryLowerCase = query.toLowerCase(),
                filter = that.options.lookupFilter;

            return {
                suggestions: $.grep(that.options.lookup, function (suggestion) {
                    return filter(suggestion, query, queryLowerCase);
                })
            };
        },

        getResponseFromCache: function (q) {
            var that = this;

            if (that.options.noCache) {
                return null;
            }

            q = q.toLowerCase();

            if (that.cachedResponses[q]) {
                return that.cachedResponses[q];
            }

            if (that.options.noFabricate) {
                return null;
            }

            // Look for a cached response that can be pruned to make the response we'd
            // get from the AJAX call. For example, if there's a cached response for "no"
            // and the new input is "nor", the "no" and "n" responses contain all the
            // suggestions that would match "nor".  We can copy the "nor" matches from
            // one of those responses, to fabricate a response for "nor", thereby
            // avoiding a service call.
            for (var substrlen = q.length - 1; substrlen > 0; --substrlen) {
                var qsubstr = q.substring(0, substrlen);
                var cachedResponse = that.cachedResponses[qsubstr];
                if (cachedResponse != null) {
                    var fabricatedResponse = { query: q, suggestions: [] };
                    for (var i = 0; i < cachedResponse.suggestions.length; ++i) {
                        var suggestion = cachedResponse.suggestions[i];
                        if (suggestion.value.toLowerCase().indexOf(q) >= 0) {
                            fabricatedResponse.suggestions.push(suggestion);
                        }
                    }

                    // Put the fabricated response in the cache and return it.
                    that.cachedResponses[fabricatedResponse[that.options.paramName]] = fabricatedResponse;
                    return fabricatedResponse;
                }
            }

            return null;
        },

        getSuggestions: function (q) {
            var response,
                that = this,
                options = that.options;

            q = q.toLowerCase();
            response = that.isLocal ? that.getSuggestionsLocal(q) : that.getResponseFromCache(q);

            if (response && $.isArray(response.suggestions)) {
                that.suggestions = response.suggestions;
                that.suggest();
            } else {
                options.onSearchStart.call(that.element, q, that.options.callbackData);
                options.params[options.paramName] = q;
                $.ajax({
                    url: options.serviceUrl,
                    data: options.params,
                    type: options.type,
                    dataType: options.dataType
                }).done(function (txt) {
                    that.processResponse(txt);
                    options.onSearchComplete.call(that.element, q, that.options.callbackData);
                });
            }
        },

        hide: function () {
            var that = this;
            that.visible = false;
            that.selectedIndex = -1;
            $(that.suggestionsContainer).hide();
            that.ignoreBlurUntilListCloses = false;
        },

        suggest: function () {
            if (this.suggestions.length === 0) {
                this.hide();
                return;
            }

            var that = this,
                formatResult = that.options.formatResult,
                value = that.getQuery(that.currentValue),
                className = that.classes.suggestion,
                classSelected = that.classes.selected,
                container = $(that.suggestionsContainer),
                html = '';

            // Build suggestions inner HTML:
            $.each(that.suggestions, function (i, suggestion) {
                html += '<div class="' + className + '" data-index="' + i + '">' + formatResult(suggestion, value) + '</div>';
            });

            container.html(html).show();
            that.visible = true;

            // Set suggestions width again, because the textbox could have changed width.
            if (that.options.width === 'auto') {
                that.curWidth = that.el.outerWidth();
                $(that.suggestionsContainer).css({ 'width': that.curWidth + 'px' });
            }

            // Select first value by default:
            if (that.options.autoSelectFirst) {
                that.selectedIndex = 0;
                container.children().first().addClass(classSelected);
            }
        },

        verifySuggestionsFormat: function (suggestions) {
            // If suggestions is string array, convert them to supported format:
            if (suggestions.length && typeof suggestions[0] === 'string') {
                return $.map(suggestions, function (value) {
                    return { value: value, data: null };
                });
            }

            return suggestions;
        },

        processResponse: function (text) {
            var that = this,
            response = typeof text == 'string' ? $.parseJSON(text) : text;

            response.suggestions = that.verifySuggestionsFormat(that.options.transformResult(response));

            // Cache results if cache is not disabled:
            if (!that.options.noCache) {
                that.cachedResponses[response[that.options.paramName]] = response;
            }

            // Display suggestions only if returned query matches current value:
            if (response[that.options.paramName].toLowerCase() === that.getQuery(that.currentValue).toLowerCase()) {
                that.suggestions = response.suggestions;
                that.suggest();
            }
        },

        activate: function (index) {
            var that = this,
                activeItem,
                selected = that.classes.selected,
                container = $(that.suggestionsContainer),
                children = container.children();

            container.children('.' + selected).removeClass(selected);

            that.selectedIndex = index;

            if (that.selectedIndex !== -1 && children.length > that.selectedIndex) {
                activeItem = children.get(that.selectedIndex);
                $(activeItem).addClass(selected);
                return activeItem;
            }

            return null;
        },

        select: function (i, shouldIgnoreNextValueChange) {
            var that = this,
                selectedValue = that.suggestions[i];

            if (selectedValue) {
                that.el.val(selectedValue);
                that.ignoreValueChange = shouldIgnoreNextValueChange;
                that.hide();
                that.onSelect(i);
            }
        },

        moveUp: function () {
            var that = this;

            if (that.selectedIndex === -1) {
                return;
            }

            if (that.selectedIndex === 0) {
                $(that.suggestionsContainer).children().first().removeClass(that.classes.selected);
                that.selectedIndex = -1;
                that.el.val(that.currentValue);
                return;
            }

            that.adjustScroll(that.selectedIndex - 1);
        },

        moveDown: function () {
            var that = this;

            if (that.selectedIndex === (that.suggestions.length - 1)) {
                return;
            }

            that.adjustScroll(that.selectedIndex + 1);
        },

        adjustScroll: function (index) {
            var that = this,
                activeItem = that.activate(index),
                offsetTop,
                upperBound,
                lowerBound,
                heightDelta = 25;

            if (!activeItem) {
                return;
            }

            offsetTop = activeItem.offsetTop;
            upperBound = $(that.suggestionsContainer).scrollTop();
            lowerBound = upperBound + that.options.maxHeight - heightDelta;

            if (offsetTop < upperBound) {
                $(that.suggestionsContainer).scrollTop(offsetTop);
            } else if (offsetTop > lowerBound) {
                $(that.suggestionsContainer).scrollTop(offsetTop - that.options.maxHeight + heightDelta);
            }

            that.el.val(that.getValue(that.suggestions[index].value));
        },

        onSelect: function (index) {
            var that = this,
                onSelectCallback = that.options.onSelect,
                suggestion = that.suggestions[index];

            that.el.val(that.getValue(suggestion.value));
            that.valueFromSuggestion = that.getValue(suggestion.value);
            if (that.options.dataKey) {
                that.el.data(that.options.dataKey, suggestion.data);
            }
            if ($.isFunction(onSelectCallback)) {
                onSelectCallback.call(that.element, suggestion, that.options.callbackData);
            }
        },

        getValue: function (value) {
            var that = this,
                delimiter = that.options.delimiter,
                currentValue,
                parts;

            if (!delimiter) {
                return value;
            }

            currentValue = that.currentValue;
            parts = currentValue.split(delimiter);

            if (parts.length === 1) {
                return value;
            }

            return currentValue.substr(0, currentValue.length - parts[parts.length - 1].length) + value;
        }
    };

    // Create chainable jQuery plugin:
    $.fn.autocomplete = function (options, args) {
        return this.each(function () {
            var dataKey = 'autocomplete',
                inputElement = $(this),
                instance;

            if (typeof options === 'string') {
                instance = inputElement.data(dataKey);
                if (typeof instance[options] === 'function') {
                    instance[options](args);
                }
            } else {
                instance = new Autocomplete(this, options);
                inputElement.data(dataKey, instance);
            }
        });
    };
}));
