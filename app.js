(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * dat-gui JavaScript Controller Library
 * http://code.google.com/p/dat-gui
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

/** @namespace */
var dat = dat || {};

module.exports = dat;

/** @namespace */
dat.gui = dat.gui || {};

/** @namespace */
dat.utils = dat.utils || {};

/** @namespace */
dat.controllers = dat.controllers || {};

/** @namespace */
dat.dom = dat.dom || {};

/** @namespace */
dat.color = dat.color || {};

dat.utils.css = (function () {
  return {
    load: function (url, doc) {
      doc = doc || document;
      var link = doc.createElement('link');
      link.type = 'text/css';
      link.rel = 'stylesheet';
      link.href = url;
      doc.getElementsByTagName('head')[0].appendChild(link);
    },
    inject: function(css, doc) {
      doc = doc || document;
      var injected = document.createElement('style');
      injected.type = 'text/css';
      injected.innerHTML = css;
      doc.getElementsByTagName('head')[0].appendChild(injected);
    }
  }
})();


dat.utils.common = (function () {

  var ARR_EACH = Array.prototype.forEach;
  var ARR_SLICE = Array.prototype.slice;

  /**
   * Band-aid methods for things that should be a lot easier in JavaScript.
   * Implementation and structure inspired by underscore.js
   * http://documentcloud.github.com/underscore/
   */

  return {

    BREAK: {},

    extend: function(target) {

      this.each(ARR_SLICE.call(arguments, 1), function(obj) {

        for (var key in obj)
          if (!this.isUndefined(obj[key]))
            target[key] = obj[key];

      }, this);

      return target;

    },

    defaults: function(target) {

      this.each(ARR_SLICE.call(arguments, 1), function(obj) {

        for (var key in obj)
          if (this.isUndefined(target[key]))
            target[key] = obj[key];

      }, this);

      return target;

    },

    compose: function() {
      var toCall = ARR_SLICE.call(arguments);
            return function() {
              var args = ARR_SLICE.call(arguments);
              for (var i = toCall.length -1; i >= 0; i--) {
                args = [toCall[i].apply(this, args)];
              }
              return args[0];
            }
    },

    each: function(obj, itr, scope) {


      if (ARR_EACH && obj.forEach === ARR_EACH) {

        obj.forEach(itr, scope);

      } else if (obj.length === obj.length + 0) { // Is number but not NaN

        for (var key = 0, l = obj.length; key < l; key++)
          if (key in obj && itr.call(scope, obj[key], key) === this.BREAK)
            return;

      } else {

        for (var key in obj)
          if (itr.call(scope, obj[key], key) === this.BREAK)
            return;

      }

    },

    defer: function(fnc) {
      setTimeout(fnc, 0);
    },

    toArray: function(obj) {
      if (obj.toArray) return obj.toArray();
      return ARR_SLICE.call(obj);
    },

    isUndefined: function(obj) {
      return obj === undefined;
    },

    isNull: function(obj) {
      return obj === null;
    },

    isNaN: function(obj) {
      return obj !== obj;
    },

    isArray: Array.isArray || function(obj) {
      return obj.constructor === Array;
    },

    isObject: function(obj) {
      return obj === Object(obj);
    },

    isNumber: function(obj) {
      return obj === obj+0;
    },

    isString: function(obj) {
      return obj === obj+'';
    },

    isBoolean: function(obj) {
      return obj === false || obj === true;
    },

    isFunction: function(obj) {
      return Object.prototype.toString.call(obj) === '[object Function]';
    }

  };

})();


dat.controllers.Controller = (function (common) {

  /**
   * @class An "abstract" class that represents a given property of an object.
   *
   * @param {Object} object The object to be manipulated
   * @param {string} property The name of the property to be manipulated
   *
   * @member dat.controllers
   */
  var Controller = function(object, property) {

    this.initialValue = object[property];

    /**
     * Those who extend this class will put their DOM elements in here.
     * @type {DOMElement}
     */
    this.domElement = document.createElement('div');

    /**
     * The object to manipulate
     * @type {Object}
     */
    this.object = object;

    /**
     * The name of the property to manipulate
     * @type {String}
     */
    this.property = property;

    /**
     * The function to be called on change.
     * @type {Function}
     * @ignore
     */
    this.__onChange = undefined;

    /**
     * The function to be called on finishing change.
     * @type {Function}
     * @ignore
     */
    this.__onFinishChange = undefined;

  };

  common.extend(

      Controller.prototype,

      /** @lends dat.controllers.Controller.prototype */
      {

        /**
         * Specify that a function fire every time someone changes the value with
         * this Controller.
         *
         * @param {Function} fnc This function will be called whenever the value
         * is modified via this Controller.
         * @returns {dat.controllers.Controller} this
         */
        onChange: function(fnc) {
          this.__onChange = fnc;
          return this;
        },

        /**
         * Specify that a function fire every time someone "finishes" changing
         * the value wih this Controller. Useful for values that change
         * incrementally like numbers or strings.
         *
         * @param {Function} fnc This function will be called whenever
         * someone "finishes" changing the value via this Controller.
         * @returns {dat.controllers.Controller} this
         */
        onFinishChange: function(fnc) {
          this.__onFinishChange = fnc;
          return this;
        },

        /**
         * Change the value of <code>object[property]</code>
         *
         * @param {Object} newValue The new value of <code>object[property]</code>
         */
        setValue: function(newValue) {
          this.object[this.property] = newValue;
          if (this.__onChange) {
            this.__onChange.call(this, newValue);
          }
          this.updateDisplay();
          return this;
        },

        /**
         * Gets the value of <code>object[property]</code>
         *
         * @returns {Object} The current value of <code>object[property]</code>
         */
        getValue: function() {
          return this.object[this.property];
        },

        /**
         * Refreshes the visual display of a Controller in order to keep sync
         * with the object's current value.
         * @returns {dat.controllers.Controller} this
         */
        updateDisplay: function() {
          return this;
        },

        /**
         * @returns {Boolean} true if the value has deviated from initialValue
         */
        isModified: function() {
          return this.initialValue !== this.getValue()
        }

      }

  );

  return Controller;


})(dat.utils.common);


dat.dom.dom = (function (common) {

  var EVENT_MAP = {
    'HTMLEvents': ['change'],
    'MouseEvents': ['click','mousemove','mousedown','mouseup', 'mouseover'],
    'KeyboardEvents': ['keydown']
  };

  var EVENT_MAP_INV = {};
  common.each(EVENT_MAP, function(v, k) {
    common.each(v, function(e) {
      EVENT_MAP_INV[e] = k;
    });
  });

  var CSS_VALUE_PIXELS = /(\d+(\.\d+)?)px/;

  function cssValueToPixels(val) {

    if (val === '0' || common.isUndefined(val)) return 0;

    var match = val.match(CSS_VALUE_PIXELS);

    if (!common.isNull(match)) {
      return parseFloat(match[1]);
    }

    // TODO ...ems? %?

    return 0;

  }

  /**
   * @namespace
   * @member dat.dom
   */
  var dom = {

    /**
     *
     * @param elem
     * @param selectable
     */
    makeSelectable: function(elem, selectable) {

      if (elem === undefined || elem.style === undefined) return;

      elem.onselectstart = selectable ? function() {
        return false;
      } : function() {
      };

      elem.style.MozUserSelect = selectable ? 'auto' : 'none';
      elem.style.KhtmlUserSelect = selectable ? 'auto' : 'none';
      elem.unselectable = selectable ? 'on' : 'off';

    },

    /**
     *
     * @param elem
     * @param horizontal
     * @param vertical
     */
    makeFullscreen: function(elem, horizontal, vertical) {

      if (common.isUndefined(horizontal)) horizontal = true;
      if (common.isUndefined(vertical)) vertical = true;

      elem.style.position = 'absolute';

      if (horizontal) {
        elem.style.left = 0;
        elem.style.right = 0;
      }
      if (vertical) {
        elem.style.top = 0;
        elem.style.bottom = 0;
      }

    },

    /**
     *
     * @param elem
     * @param eventType
     * @param params
     */
    fakeEvent: function(elem, eventType, params, aux) {
      params = params || {};
      var className = EVENT_MAP_INV[eventType];
      if (!className) {
        throw new Error('Event type ' + eventType + ' not supported.');
      }
      var evt = document.createEvent(className);
      switch (className) {
        case 'MouseEvents':
          var clientX = params.x || params.clientX || 0;
          var clientY = params.y || params.clientY || 0;
          evt.initMouseEvent(eventType, params.bubbles || false,
              params.cancelable || true, window, params.clickCount || 1,
              0, //screen X
              0, //screen Y
              clientX, //client X
              clientY, //client Y
              false, false, false, false, 0, null);
          break;
        case 'KeyboardEvents':
          var init = evt.initKeyboardEvent || evt.initKeyEvent; // webkit || moz
          common.defaults(params, {
            cancelable: true,
            ctrlKey: false,
            altKey: false,
            shiftKey: false,
            metaKey: false,
            keyCode: undefined,
            charCode: undefined
          });
          init(eventType, params.bubbles || false,
              params.cancelable, window,
              params.ctrlKey, params.altKey,
              params.shiftKey, params.metaKey,
              params.keyCode, params.charCode);
          break;
        default:
          evt.initEvent(eventType, params.bubbles || false,
              params.cancelable || true);
          break;
      }
      common.defaults(evt, aux);
      elem.dispatchEvent(evt);
    },

    /**
     *
     * @param elem
     * @param event
     * @param func
     * @param bool
     */
    bind: function(elem, event, func, bool) {
      bool = bool || false;
      if (elem.addEventListener)
        elem.addEventListener(event, func, bool);
      else if (elem.attachEvent)
        elem.attachEvent('on' + event, func);
      return dom;
    },

    /**
     *
     * @param elem
     * @param event
     * @param func
     * @param bool
     */
    unbind: function(elem, event, func, bool) {
      bool = bool || false;
      if (elem.removeEventListener)
        elem.removeEventListener(event, func, bool);
      else if (elem.detachEvent)
        elem.detachEvent('on' + event, func);
      return dom;
    },

    /**
     *
     * @param elem
     * @param className
     */
    addClass: function(elem, className) {
      if (elem.className === undefined) {
        elem.className = className;
      } else if (elem.className !== className) {
        var classes = elem.className.split(/ +/);
        if (classes.indexOf(className) == -1) {
          classes.push(className);
          elem.className = classes.join(' ').replace(/^\s+/, '').replace(/\s+$/, '');
        }
      }
      return dom;
    },

    /**
     *
     * @param elem
     * @param className
     */
    removeClass: function(elem, className) {
      if (className) {
        if (elem.className === undefined) {
          // elem.className = className;
        } else if (elem.className === className) {
          elem.removeAttribute('class');
        } else {
          var classes = elem.className.split(/ +/);
          var index = classes.indexOf(className);
          if (index != -1) {
            classes.splice(index, 1);
            elem.className = classes.join(' ');
          }
        }
      } else {
        elem.className = undefined;
      }
      return dom;
    },

    hasClass: function(elem, className) {
      return new RegExp('(?:^|\\s+)' + className + '(?:\\s+|$)').test(elem.className) || false;
    },

    /**
     *
     * @param elem
     */
    getWidth: function(elem) {

      var style = getComputedStyle(elem);

      return cssValueToPixels(style['border-left-width']) +
          cssValueToPixels(style['border-right-width']) +
          cssValueToPixels(style['padding-left']) +
          cssValueToPixels(style['padding-right']) +
          cssValueToPixels(style['width']);
    },

    /**
     *
     * @param elem
     */
    getHeight: function(elem) {

      var style = getComputedStyle(elem);

      return cssValueToPixels(style['border-top-width']) +
          cssValueToPixels(style['border-bottom-width']) +
          cssValueToPixels(style['padding-top']) +
          cssValueToPixels(style['padding-bottom']) +
          cssValueToPixels(style['height']);
    },

    /**
     *
     * @param elem
     */
    getOffset: function(elem) {
      var offset = {left: 0, top:0};
      if (elem.offsetParent) {
        do {
          offset.left += elem.offsetLeft;
          offset.top += elem.offsetTop;
        } while (elem = elem.offsetParent);
      }
      return offset;
    },

    // http://stackoverflow.com/posts/2684561/revisions
    /**
     *
     * @param elem
     */
    isActive: function(elem) {
      return elem === document.activeElement && ( elem.type || elem.href );
    }

  };

  return dom;

})(dat.utils.common);


dat.controllers.OptionController = (function (Controller, dom, common) {

  /**
   * @class Provides a select input to alter the property of an object, using a
   * list of accepted values.
   *
   * @extends dat.controllers.Controller
   *
   * @param {Object} object The object to be manipulated
   * @param {string} property The name of the property to be manipulated
   * @param {Object|string[]} options A map of labels to acceptable values, or
   * a list of acceptable string values.
   *
   * @member dat.controllers
   */
  var OptionController = function(object, property, options) {

    OptionController.superclass.call(this, object, property);

    var _this = this;

    /**
     * The drop down menu
     * @ignore
     */
    this.__select = document.createElement('select');

    if (common.isArray(options)) {
      var map = {};
      common.each(options, function(element) {
        map[element] = element;
      });
      options = map;
    }

    common.each(options, function(value, key) {

      var opt = document.createElement('option');
      opt.innerHTML = key;
      opt.setAttribute('value', value);
      _this.__select.appendChild(opt);

    });

    // Acknowledge original value
    this.updateDisplay();

    dom.bind(this.__select, 'change', function() {
      var desiredValue = this.options[this.selectedIndex].value;
      _this.setValue(desiredValue);
    });

    this.domElement.appendChild(this.__select);

  };

  OptionController.superclass = Controller;

  common.extend(

      OptionController.prototype,
      Controller.prototype,

      {

        setValue: function(v) {
          var toReturn = OptionController.superclass.prototype.setValue.call(this, v);
          if (this.__onFinishChange) {
            this.__onFinishChange.call(this, this.getValue());
          }
          return toReturn;
        },

        updateDisplay: function() {
          this.__select.value = this.getValue();
          return OptionController.superclass.prototype.updateDisplay.call(this);
        }

      }

  );

  return OptionController;

})(dat.controllers.Controller,
dat.dom.dom,
dat.utils.common);


dat.controllers.NumberController = (function (Controller, common) {

  /**
   * @class Represents a given property of an object that is a number.
   *
   * @extends dat.controllers.Controller
   *
   * @param {Object} object The object to be manipulated
   * @param {string} property The name of the property to be manipulated
   * @param {Object} [params] Optional parameters
   * @param {Number} [params.min] Minimum allowed value
   * @param {Number} [params.max] Maximum allowed value
   * @param {Number} [params.step] Increment by which to change value
   *
   * @member dat.controllers
   */
  var NumberController = function(object, property, params) {

    NumberController.superclass.call(this, object, property);

    params = params || {};

    this.__min = params.min;
    this.__max = params.max;
    this.__step = params.step;

    if (common.isUndefined(this.__step)) {

      if (this.initialValue == 0) {
        this.__impliedStep = 1; // What are we, psychics?
      } else {
        // Hey Doug, check this out.
        this.__impliedStep = Math.pow(10, Math.floor(Math.log(this.initialValue)/Math.LN10))/10;
      }

    } else {

    	this.__impliedStep = this.__step;

    }

    this.__precision = numDecimals(this.__impliedStep);


  };

  NumberController.superclass = Controller;

  common.extend(

      NumberController.prototype,
      Controller.prototype,

      /** @lends dat.controllers.NumberController.prototype */
      {

        setValue: function(v) {

          if (this.__min !== undefined && v < this.__min) {
            v = this.__min;
          } else if (this.__max !== undefined && v > this.__max) {
            v = this.__max;
          }

          if (this.__step !== undefined && v % this.__step != 0) {
            v = Math.round(v / this.__step) * this.__step;
          }

          return NumberController.superclass.prototype.setValue.call(this, v);

        },

        /**
         * Specify a minimum value for <code>object[property]</code>.
         *
         * @param {Number} minValue The minimum value for
         * <code>object[property]</code>
         * @returns {dat.controllers.NumberController} this
         */
        min: function(v) {
          this.__min = v;
          return this;
        },

        /**
         * Specify a maximum value for <code>object[property]</code>.
         *
         * @param {Number} maxValue The maximum value for
         * <code>object[property]</code>
         * @returns {dat.controllers.NumberController} this
         */
        max: function(v) {
          this.__max = v;
          return this;
        },

        /**
         * Specify a step value that dat.controllers.NumberController
         * increments by.
         *
         * @param {Number} stepValue The step value for
         * dat.controllers.NumberController
         * @default if minimum and maximum specified increment is 1% of the
         * difference otherwise stepValue is 1
         * @returns {dat.controllers.NumberController} this
         */
        step: function(v) {
          this.__step = v;
          return this;
        }

      }

  );

  function numDecimals(x) {
    x = x.toString();
    if (x.indexOf('.') > -1) {
      return x.length - x.indexOf('.') - 1;
    } else {
      return 0;
    }
  }

  return NumberController;

})(dat.controllers.Controller,
dat.utils.common);


dat.controllers.NumberControllerBox = (function (NumberController, dom, common) {

  /**
   * @class Represents a given property of an object that is a number and
   * provides an input element with which to manipulate it.
   *
   * @extends dat.controllers.Controller
   * @extends dat.controllers.NumberController
   *
   * @param {Object} object The object to be manipulated
   * @param {string} property The name of the property to be manipulated
   * @param {Object} [params] Optional parameters
   * @param {Number} [params.min] Minimum allowed value
   * @param {Number} [params.max] Maximum allowed value
   * @param {Number} [params.step] Increment by which to change value
   *
   * @member dat.controllers
   */
  var NumberControllerBox = function(object, property, params) {

    this.__truncationSuspended = false;

    NumberControllerBox.superclass.call(this, object, property, params);

    var _this = this;

    /**
     * {Number} Previous mouse y position
     * @ignore
     */
    var prev_y;

    this.__input = document.createElement('input');
    this.__input.setAttribute('type', 'text');

    // Makes it so manually specified values are not truncated.

    dom.bind(this.__input, 'change', onChange);
    dom.bind(this.__input, 'blur', onBlur);
    dom.bind(this.__input, 'mousedown', onMouseDown);
    dom.bind(this.__input, 'keydown', function(e) {

      // When pressing entire, you can be as precise as you want.
      if (e.keyCode === 13) {
        _this.__truncationSuspended = true;
        this.blur();
        _this.__truncationSuspended = false;
      }

    });

    function onChange() {
      var attempted = parseFloat(_this.__input.value);
      if (!common.isNaN(attempted)) _this.setValue(attempted);
    }

    function onBlur() {
      onChange();
      if (_this.__onFinishChange) {
        _this.__onFinishChange.call(_this, _this.getValue());
      }
    }

    function onMouseDown(e) {
      dom.bind(window, 'mousemove', onMouseDrag);
      dom.bind(window, 'mouseup', onMouseUp);
      prev_y = e.clientY;
    }

    function onMouseDrag(e) {

      var diff = prev_y - e.clientY;
      _this.setValue(_this.getValue() + diff * _this.__impliedStep);

      prev_y = e.clientY;

    }

    function onMouseUp() {
      dom.unbind(window, 'mousemove', onMouseDrag);
      dom.unbind(window, 'mouseup', onMouseUp);
    }

    this.updateDisplay();

    this.domElement.appendChild(this.__input);

  };

  NumberControllerBox.superclass = NumberController;

  common.extend(

      NumberControllerBox.prototype,
      NumberController.prototype,

      {

        updateDisplay: function() {

          this.__input.value = this.__truncationSuspended ? this.getValue() : roundToDecimal(this.getValue(), this.__precision);
          return NumberControllerBox.superclass.prototype.updateDisplay.call(this);
        }

      }

  );

  function roundToDecimal(value, decimals) {
    var tenTo = Math.pow(10, decimals);
    return Math.round(value * tenTo) / tenTo;
  }

  return NumberControllerBox;

})(dat.controllers.NumberController,
dat.dom.dom,
dat.utils.common);


dat.controllers.NumberControllerSlider = (function (NumberController, dom, css, common, styleSheet) {

  /**
   * @class Represents a given property of an object that is a number, contains
   * a minimum and maximum, and provides a slider element with which to
   * manipulate it. It should be noted that the slider element is made up of
   * <code>&lt;div&gt;</code> tags, <strong>not</strong> the html5
   * <code>&lt;slider&gt;</code> element.
   *
   * @extends dat.controllers.Controller
   * @extends dat.controllers.NumberController
   *
   * @param {Object} object The object to be manipulated
   * @param {string} property The name of the property to be manipulated
   * @param {Number} minValue Minimum allowed value
   * @param {Number} maxValue Maximum allowed value
   * @param {Number} stepValue Increment by which to change value
   *
   * @member dat.controllers
   */
  var NumberControllerSlider = function(object, property, min, max, step) {

    NumberControllerSlider.superclass.call(this, object, property, { min: min, max: max, step: step });

    var _this = this;

    this.__background = document.createElement('div');
    this.__foreground = document.createElement('div');



    dom.bind(this.__background, 'mousedown', onMouseDown);

    dom.addClass(this.__background, 'slider');
    dom.addClass(this.__foreground, 'slider-fg');

    function onMouseDown(e) {

      dom.bind(window, 'mousemove', onMouseDrag);
      dom.bind(window, 'mouseup', onMouseUp);

      onMouseDrag(e);
    }

    function onMouseDrag(e) {

      e.preventDefault();

      var offset = dom.getOffset(_this.__background);
      var width = dom.getWidth(_this.__background);

      _this.setValue(
      	map(e.clientX, offset.left, offset.left + width, _this.__min, _this.__max)
      );

      return false;

    }

    function onMouseUp() {
      dom.unbind(window, 'mousemove', onMouseDrag);
      dom.unbind(window, 'mouseup', onMouseUp);
      if (_this.__onFinishChange) {
        _this.__onFinishChange.call(_this, _this.getValue());
      }
    }

    this.updateDisplay();

    this.__background.appendChild(this.__foreground);
    this.domElement.appendChild(this.__background);

  };

  NumberControllerSlider.superclass = NumberController;

  /**
   * Injects default stylesheet for slider elements.
   */
  NumberControllerSlider.useDefaultStyles = function() {
    css.inject(styleSheet);
  };

  common.extend(

      NumberControllerSlider.prototype,
      NumberController.prototype,

      {

        updateDisplay: function() {
          var pct = (this.getValue() - this.__min)/(this.__max - this.__min);
          this.__foreground.style.width = pct*100+'%';
          return NumberControllerSlider.superclass.prototype.updateDisplay.call(this);
        }

      }



  );

	function map(v, i1, i2, o1, o2) {
		return o1 + (o2 - o1) * ((v - i1) / (i2 - i1));
	}

  return NumberControllerSlider;

})(dat.controllers.NumberController,
dat.dom.dom,
dat.utils.css,
dat.utils.common,
".slider {\n  box-shadow: inset 0 2px 4px rgba(0,0,0,0.15);\n  height: 1em;\n  border-radius: 1em;\n  background-color: #eee;\n  padding: 0 0.5em;\n  overflow: hidden;\n}\n\n.slider-fg {\n  padding: 1px 0 2px 0;\n  background-color: #aaa;\n  height: 1em;\n  margin-left: -0.5em;\n  padding-right: 0.5em;\n  border-radius: 1em 0 0 1em;\n}\n\n.slider-fg:after {\n  display: inline-block;\n  border-radius: 1em;\n  background-color: #fff;\n  border:  1px solid #aaa;\n  content: '';\n  float: right;\n  margin-right: -1em;\n  margin-top: -1px;\n  height: 0.9em;\n  width: 0.9em;\n}");


dat.controllers.FunctionController = (function (Controller, dom, common) {

  /**
   * @class Provides a GUI interface to fire a specified method, a property of an object.
   *
   * @extends dat.controllers.Controller
   *
   * @param {Object} object The object to be manipulated
   * @param {string} property The name of the property to be manipulated
   *
   * @member dat.controllers
   */
  var FunctionController = function(object, property, text) {

    FunctionController.superclass.call(this, object, property);

    var _this = this;

    this.__button = document.createElement('div');
    this.__button.innerHTML = text === undefined ? 'Fire' : text;
    dom.bind(this.__button, 'click', function(e) {
      e.preventDefault();
      _this.fire();
      return false;
    });

    dom.addClass(this.__button, 'button');

    this.domElement.appendChild(this.__button);


  };

  FunctionController.superclass = Controller;

  common.extend(

      FunctionController.prototype,
      Controller.prototype,
      {

        fire: function() {
          if (this.__onChange) {
            this.__onChange.call(this);
          }
          if (this.__onFinishChange) {
            this.__onFinishChange.call(this, this.getValue());
          }
          this.getValue().call(this.object);
        }
      }

  );

  return FunctionController;

})(dat.controllers.Controller,
dat.dom.dom,
dat.utils.common);


dat.controllers.BooleanController = (function (Controller, dom, common) {

  /**
   * @class Provides a checkbox input to alter the boolean property of an object.
   * @extends dat.controllers.Controller
   *
   * @param {Object} object The object to be manipulated
   * @param {string} property The name of the property to be manipulated
   *
   * @member dat.controllers
   */
  var BooleanController = function(object, property) {

    BooleanController.superclass.call(this, object, property);

    var _this = this;
    this.__prev = this.getValue();

    this.__checkbox = document.createElement('input');
    this.__checkbox.setAttribute('type', 'checkbox');


    dom.bind(this.__checkbox, 'change', onChange, false);

    this.domElement.appendChild(this.__checkbox);

    // Match original value
    this.updateDisplay();

    function onChange() {
      _this.setValue(!_this.__prev);
    }

  };

  BooleanController.superclass = Controller;

  common.extend(

      BooleanController.prototype,
      Controller.prototype,

      {

        setValue: function(v) {
          var toReturn = BooleanController.superclass.prototype.setValue.call(this, v);
          if (this.__onFinishChange) {
            this.__onFinishChange.call(this, this.getValue());
          }
          this.__prev = this.getValue();
          return toReturn;
        },

        updateDisplay: function() {

          if (this.getValue() === true) {
            this.__checkbox.setAttribute('checked', 'checked');
            this.__checkbox.checked = true;
          } else {
              this.__checkbox.checked = false;
          }

          return BooleanController.superclass.prototype.updateDisplay.call(this);

        }


      }

  );

  return BooleanController;

})(dat.controllers.Controller,
dat.dom.dom,
dat.utils.common);


dat.color.toString = (function (common) {

  return function(color) {

    if (color.a == 1 || common.isUndefined(color.a)) {

      var s = color.hex.toString(16);
      while (s.length < 6) {
        s = '0' + s;
      }

      return '#' + s;

    } else {

      return 'rgba(' + Math.round(color.r) + ',' + Math.round(color.g) + ',' + Math.round(color.b) + ',' + color.a + ')';

    }

  }

})(dat.utils.common);


dat.color.interpret = (function (toString, common) {

  var result, toReturn;

  var interpret = function() {

    toReturn = false;

    var original = arguments.length > 1 ? common.toArray(arguments) : arguments[0];

    common.each(INTERPRETATIONS, function(family) {

      if (family.litmus(original)) {

        common.each(family.conversions, function(conversion, conversionName) {

          result = conversion.read(original);

          if (toReturn === false && result !== false) {
            toReturn = result;
            result.conversionName = conversionName;
            result.conversion = conversion;
            return common.BREAK;

          }

        });

        return common.BREAK;

      }

    });

    return toReturn;

  };

  var INTERPRETATIONS = [

    // Strings
    {

      litmus: common.isString,

      conversions: {

        THREE_CHAR_HEX: {

          read: function(original) {

            var test = original.match(/^#([A-F0-9])([A-F0-9])([A-F0-9])$/i);
            if (test === null) return false;

            return {
              space: 'HEX',
              hex: parseInt(
                  '0x' +
                      test[1].toString() + test[1].toString() +
                      test[2].toString() + test[2].toString() +
                      test[3].toString() + test[3].toString())
            };

          },

          write: toString

        },

        SIX_CHAR_HEX: {

          read: function(original) {

            var test = original.match(/^#([A-F0-9]{6})$/i);
            if (test === null) return false;

            return {
              space: 'HEX',
              hex: parseInt('0x' + test[1].toString())
            };

          },

          write: toString

        },

        CSS_RGB: {

          read: function(original) {

            var test = original.match(/^rgb\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\)/);
            if (test === null) return false;

            return {
              space: 'RGB',
              r: parseFloat(test[1]),
              g: parseFloat(test[2]),
              b: parseFloat(test[3])
            };

          },

          write: toString

        },

        CSS_RGBA: {

          read: function(original) {

            var test = original.match(/^rgba\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\,\s*(.+)\s*\)/);
            if (test === null) return false;

            return {
              space: 'RGB',
              r: parseFloat(test[1]),
              g: parseFloat(test[2]),
              b: parseFloat(test[3]),
              a: parseFloat(test[4])
            };

          },

          write: toString

        }

      }

    },

    // Numbers
    {

      litmus: common.isNumber,

      conversions: {

        HEX: {
          read: function(original) {
            return {
              space: 'HEX',
              hex: original,
              conversionName: 'HEX'
            }
          },

          write: function(color) {
            return color.hex;
          }
        }

      }

    },

    // Arrays
    {

      litmus: common.isArray,

      conversions: {

        RGB_ARRAY: {
          read: function(original) {
            if (original.length != 3) return false;
            return {
              space: 'RGB',
              r: original[0],
              g: original[1],
              b: original[2]
            };
          },

          write: function(color) {
            return [color.r, color.g, color.b];
          }

        },

        RGBA_ARRAY: {
          read: function(original) {
            if (original.length != 4) return false;
            return {
              space: 'RGB',
              r: original[0],
              g: original[1],
              b: original[2],
              a: original[3]
            };
          },

          write: function(color) {
            return [color.r, color.g, color.b, color.a];
          }

        }

      }

    },

    // Objects
    {

      litmus: common.isObject,

      conversions: {

        RGBA_OBJ: {
          read: function(original) {
            if (common.isNumber(original.r) &&
                common.isNumber(original.g) &&
                common.isNumber(original.b) &&
                common.isNumber(original.a)) {
              return {
                space: 'RGB',
                r: original.r,
                g: original.g,
                b: original.b,
                a: original.a
              }
            }
            return false;
          },

          write: function(color) {
            return {
              r: color.r,
              g: color.g,
              b: color.b,
              a: color.a
            }
          }
        },

        RGB_OBJ: {
          read: function(original) {
            if (common.isNumber(original.r) &&
                common.isNumber(original.g) &&
                common.isNumber(original.b)) {
              return {
                space: 'RGB',
                r: original.r,
                g: original.g,
                b: original.b
              }
            }
            return false;
          },

          write: function(color) {
            return {
              r: color.r,
              g: color.g,
              b: color.b
            }
          }
        },

        HSVA_OBJ: {
          read: function(original) {
            if (common.isNumber(original.h) &&
                common.isNumber(original.s) &&
                common.isNumber(original.v) &&
                common.isNumber(original.a)) {
              return {
                space: 'HSV',
                h: original.h,
                s: original.s,
                v: original.v,
                a: original.a
              }
            }
            return false;
          },

          write: function(color) {
            return {
              h: color.h,
              s: color.s,
              v: color.v,
              a: color.a
            }
          }
        },

        HSV_OBJ: {
          read: function(original) {
            if (common.isNumber(original.h) &&
                common.isNumber(original.s) &&
                common.isNumber(original.v)) {
              return {
                space: 'HSV',
                h: original.h,
                s: original.s,
                v: original.v
              }
            }
            return false;
          },

          write: function(color) {
            return {
              h: color.h,
              s: color.s,
              v: color.v
            }
          }

        }

      }

    }


  ];

  return interpret;


})(dat.color.toString,
dat.utils.common);


dat.GUI = dat.gui.GUI = (function (css, saveDialogueContents, styleSheet, controllerFactory, Controller, BooleanController, FunctionController, NumberControllerBox, NumberControllerSlider, OptionController, ColorController, requestAnimationFrame, CenteredDiv, dom, common) {

  css.inject(styleSheet);

  /** Outer-most className for GUI's */
  var CSS_NAMESPACE = 'dg';

  var HIDE_KEY_CODE = 72;

  /** The only value shared between the JS and SCSS. Use caution. */
  var CLOSE_BUTTON_HEIGHT = 20;

  var DEFAULT_DEFAULT_PRESET_NAME = 'Default';

  var SUPPORTS_LOCAL_STORAGE = (function() {
    try {
      return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
      return false;
    }
  })();

  var SAVE_DIALOGUE;

  /** Have we yet to create an autoPlace GUI? */
  var auto_place_virgin = true;

  /** Fixed position div that auto place GUI's go inside */
  var auto_place_container;

  /** Are we hiding the GUI's ? */
  var hide = false;

  /** GUI's which should be hidden */
  var hideable_guis = [];

  /**
   * A lightweight controller library for JavaScript. It allows you to easily
   * manipulate variables and fire functions on the fly.
   * @class
   *
   * @member dat.gui
   *
   * @param {Object} [params]
   * @param {String} [params.name] The name of this GUI.
   * @param {Object} [params.load] JSON object representing the saved state of
   * this GUI.
   * @param {Boolean} [params.auto=true]
   * @param {dat.gui.GUI} [params.parent] The GUI I'm nested in.
   * @param {Boolean} [params.closed] If true, starts closed
   */
  var GUI = function(params) {

    var _this = this;

    /**
     * Outermost DOM Element
     * @type DOMElement
     */
    this.domElement = document.createElement('div');
    this.__ul = document.createElement('ul');
    this.domElement.appendChild(this.__ul);

    dom.addClass(this.domElement, CSS_NAMESPACE);

    /**
     * Nested GUI's by name
     * @ignore
     */
    this.__folders = {};

    this.__controllers = [];

    /**
     * List of objects I'm remembering for save, only used in top level GUI
     * @ignore
     */
    this.__rememberedObjects = [];

    /**
     * Maps the index of remembered objects to a map of controllers, only used
     * in top level GUI.
     *
     * @private
     * @ignore
     *
     * @example
     * [
     *  {
     *    propertyName: Controller,
     *    anotherPropertyName: Controller
     *  },
     *  {
     *    propertyName: Controller
     *  }
     * ]
     */
    this.__rememberedObjectIndecesToControllers = [];

    this.__listening = [];

    params = params || {};

    // Default parameters
    params = common.defaults(params, {
      autoPlace: true,
      width: GUI.DEFAULT_WIDTH
    });

    params = common.defaults(params, {
      resizable: params.autoPlace,
      hideable: params.autoPlace
    });


    if (!common.isUndefined(params.load)) {

      // Explicit preset
      if (params.preset) params.load.preset = params.preset;

    } else {

      params.load = { preset: DEFAULT_DEFAULT_PRESET_NAME };

    }

    if (common.isUndefined(params.parent) && params.hideable) {
      hideable_guis.push(this);
    }

    // Only root level GUI's are resizable.
    params.resizable = common.isUndefined(params.parent) && params.resizable;


    if (params.autoPlace && common.isUndefined(params.scrollable)) {
      params.scrollable = true;
    }
//    params.scrollable = common.isUndefined(params.parent) && params.scrollable === true;

    // Not part of params because I don't want people passing this in via
    // constructor. Should be a 'remembered' value.
    var use_local_storage =
        SUPPORTS_LOCAL_STORAGE &&
            localStorage.getItem(getLocalStorageHash(this, 'isLocal')) === 'true';

    Object.defineProperties(this,

        /** @lends dat.gui.GUI.prototype */
        {

          /**
           * The parent <code>GUI</code>
           * @type dat.gui.GUI
           */
          parent: {
            get: function() {
              return params.parent;
            }
          },

          scrollable: {
            get: function() {
              return params.scrollable;
            }
          },

          /**
           * Handles <code>GUI</code>'s element placement for you
           * @type Boolean
           */
          autoPlace: {
            get: function() {
              return params.autoPlace;
            }
          },

          /**
           * The identifier for a set of saved values
           * @type String
           */
          preset: {

            get: function() {
              if (_this.parent) {
                return _this.getRoot().preset;
              } else {
                return params.load.preset;
              }
            },

            set: function(v) {
              if (_this.parent) {
                _this.getRoot().preset = v;
              } else {
                params.load.preset = v;
              }
              setPresetSelectIndex(this);
              _this.revert();
            }

          },

          /**
           * The width of <code>GUI</code> element
           * @type Number
           */
          width: {
            get: function() {
              return params.width;
            },
            set: function(v) {
              params.width = v;
              setWidth(_this, v);
            }
          },

          /**
           * The name of <code>GUI</code>. Used for folders. i.e
           * a folder's name
           * @type String
           */
          name: {
            get: function() {
              return params.name;
            },
            set: function(v) {
              // TODO Check for collisions among sibling folders
              params.name = v;
              if (title_row_name) {
                title_row_name.innerHTML = params.name;
              }
            }
          },

          /**
           * Whether the <code>GUI</code> is collapsed or not
           * @type Boolean
           */
          closed: {
            get: function() {
              return params.closed;
            },
            set: function(v) {
              params.closed = v;
              if (params.closed) {
                dom.addClass(_this.__ul, GUI.CLASS_CLOSED);
              } else {
                dom.removeClass(_this.__ul, GUI.CLASS_CLOSED);
              }
              // For browsers that aren't going to respect the CSS transition,
              // Lets just check our height against the window height right off
              // the bat.
              this.onResize();

              if (_this.__closeButton) {
                _this.__closeButton.innerHTML = v ? GUI.TEXT_OPEN : GUI.TEXT_CLOSED;
              }
            }
          },

          /**
           * Contains all presets
           * @type Object
           */
          load: {
            get: function() {
              return params.load;
            }
          },

          /**
           * Determines whether or not to use <a href="https://developer.mozilla.org/en/DOM/Storage#localStorage">localStorage</a> as the means for
           * <code>remember</code>ing
           * @type Boolean
           */
          useLocalStorage: {

            get: function() {
              return use_local_storage;
            },
            set: function(bool) {
              if (SUPPORTS_LOCAL_STORAGE) {
                use_local_storage = bool;
                if (bool) {
                  dom.bind(window, 'unload', saveToLocalStorage);
                } else {
                  dom.unbind(window, 'unload', saveToLocalStorage);
                }
                localStorage.setItem(getLocalStorageHash(_this, 'isLocal'), bool);
              }
            }

          }

        });

    // Are we a root level GUI?
    if (common.isUndefined(params.parent)) {

      params.closed = false;

      dom.addClass(this.domElement, GUI.CLASS_MAIN);
      dom.makeSelectable(this.domElement, false);

      // Are we supposed to be loading locally?
      if (SUPPORTS_LOCAL_STORAGE) {

        if (use_local_storage) {

          _this.useLocalStorage = true;

          var saved_gui = localStorage.getItem(getLocalStorageHash(this, 'gui'));

          if (saved_gui) {
            params.load = JSON.parse(saved_gui);
          }

        }

      }

      this.__closeButton = document.createElement('div');
      this.__closeButton.innerHTML = GUI.TEXT_CLOSED;
      dom.addClass(this.__closeButton, GUI.CLASS_CLOSE_BUTTON);
      this.domElement.appendChild(this.__closeButton);

      dom.bind(this.__closeButton, 'click', function() {

        _this.closed = !_this.closed;


      });


      // Oh, you're a nested GUI!
    } else {

      if (params.closed === undefined) {
        params.closed = true;
      }

      var title_row_name = document.createTextNode(params.name);
      dom.addClass(title_row_name, 'controller-name');

      var title_row = addRow(_this, title_row_name);

      var on_click_title = function(e) {
        e.preventDefault();
        _this.closed = !_this.closed;
        return false;
      };

      dom.addClass(this.__ul, GUI.CLASS_CLOSED);

      dom.addClass(title_row, 'title');
      dom.bind(title_row, 'click', on_click_title);

      if (!params.closed) {
        this.closed = false;
      }

    }

    if (params.autoPlace) {

      if (common.isUndefined(params.parent)) {

        if (auto_place_virgin) {
          auto_place_container = document.createElement('div');
          dom.addClass(auto_place_container, CSS_NAMESPACE);
          dom.addClass(auto_place_container, GUI.CLASS_AUTO_PLACE_CONTAINER);
          document.body.appendChild(auto_place_container);
          auto_place_virgin = false;
        }

        // Put it in the dom for you.
        auto_place_container.appendChild(this.domElement);

        // Apply the auto styles
        dom.addClass(this.domElement, GUI.CLASS_AUTO_PLACE);

      }


      // Make it not elastic.
      if (!this.parent) setWidth(_this, params.width);

    }

    dom.bind(window, 'resize', function() { _this.onResize() });
    dom.bind(this.__ul, 'webkitTransitionEnd', function() { _this.onResize(); });
    dom.bind(this.__ul, 'transitionend', function() { _this.onResize() });
    dom.bind(this.__ul, 'oTransitionEnd', function() { _this.onResize() });
    this.onResize();


    if (params.resizable) {
      addResizeHandle(this);
    }

    function saveToLocalStorage() {
      localStorage.setItem(getLocalStorageHash(_this, 'gui'), JSON.stringify(_this.getSaveObject()));
    }

    var root = _this.getRoot();
    function resetWidth() {
	      var root = _this.getRoot();
	      root.width += 1;
	      common.defer(function() {
	        root.width -= 1;
	      });
	    }

	    if (!params.parent) {
	      resetWidth();
	    }

  };

  GUI.toggleHide = function() {

    hide = !hide;
    common.each(hideable_guis, function(gui) {
      gui.domElement.style.zIndex = hide ? -999 : 999;
      gui.domElement.style.opacity = hide ? 0 : 1;
    });
  };

  GUI.CLASS_AUTO_PLACE = 'a';
  GUI.CLASS_AUTO_PLACE_CONTAINER = 'ac';
  GUI.CLASS_MAIN = 'main';
  GUI.CLASS_CONTROLLER_ROW = 'cr';
  GUI.CLASS_TOO_TALL = 'taller-than-window';
  GUI.CLASS_CLOSED = 'closed';
  GUI.CLASS_CLOSE_BUTTON = 'close-button';
  GUI.CLASS_DRAG = 'drag';

  GUI.DEFAULT_WIDTH = 245;
  GUI.TEXT_CLOSED = 'Close Controls';
  GUI.TEXT_OPEN = 'Open Controls';

  dom.bind(window, 'keydown', function(e) {

    if (document.activeElement.type !== 'text' &&
        (e.which === HIDE_KEY_CODE || e.keyCode == HIDE_KEY_CODE)) {
      GUI.toggleHide();
    }

  }, false);

  common.extend(

      GUI.prototype,

      /** @lends dat.gui.GUI */
      {

        /**
         * @param object
         * @param property
         * @returns {dat.controllers.Controller} The new controller that was added.
         * @instance
         */
        add: function(object, property) {

          return add(
              this,
              object,
              property,
              {
                factoryArgs: Array.prototype.slice.call(arguments, 2)
              }
          );

        },

        /**
         * @param object
         * @param property
         * @returns {dat.controllers.ColorController} The new controller that was added.
         * @instance
         */
        addColor: function(object, property) {

          return add(
              this,
              object,
              property,
              {
                color: true
              }
          );

        },

        /**
         * @param controller
         * @instance
         */
        remove: function(controller) {

          // TODO listening?
          this.__ul.removeChild(controller.__li);
          this.__controllers.slice(this.__controllers.indexOf(controller), 1);
          var _this = this;
          common.defer(function() {
            _this.onResize();
          });

        },

        destroy: function() {

          if (this.autoPlace) {
            auto_place_container.removeChild(this.domElement);
          }

        },

        /**
         * @param name
         * @returns {dat.gui.GUI} The new folder.
         * @throws {Error} if this GUI already has a folder by the specified
         * name
         * @instance
         */
        addFolder: function(name) {

          // We have to prevent collisions on names in order to have a key
          // by which to remember saved values
          if (this.__folders[name] !== undefined) {
            throw new Error('You already have a folder in this GUI by the' +
                ' name "' + name + '"');
          }

          var new_gui_params = { name: name, parent: this };

          // We need to pass down the autoPlace trait so that we can
          // attach event listeners to open/close folder actions to
          // ensure that a scrollbar appears if the window is too short.
          new_gui_params.autoPlace = this.autoPlace;

          // Do we have saved appearance data for this folder?

          if (this.load && // Anything loaded?
              this.load.folders && // Was my parent a dead-end?
              this.load.folders[name]) { // Did daddy remember me?

            // Start me closed if I was closed
            new_gui_params.closed = this.load.folders[name].closed;

            // Pass down the loaded data
            new_gui_params.load = this.load.folders[name];

          }

          var gui = new GUI(new_gui_params);
          this.__folders[name] = gui;

          var li = addRow(this, gui.domElement);
          dom.addClass(li, 'folder');
          return gui;

        },

        open: function() {
          this.closed = false;
        },

        close: function() {
          this.closed = true;
        },

        onResize: function() {

          var root = this.getRoot();

          if (root.scrollable) {

            var top = dom.getOffset(root.__ul).top;
            var h = 0;

            common.each(root.__ul.childNodes, function(node) {
              if (! (root.autoPlace && node === root.__save_row))
                h += dom.getHeight(node);
            });

            if (window.innerHeight - top - CLOSE_BUTTON_HEIGHT < h) {
              dom.addClass(root.domElement, GUI.CLASS_TOO_TALL);
              root.__ul.style.height = window.innerHeight - top - CLOSE_BUTTON_HEIGHT + 'px';
            } else {
              dom.removeClass(root.domElement, GUI.CLASS_TOO_TALL);
              root.__ul.style.height = 'auto';
            }

          }

          if (root.__resize_handle) {
            common.defer(function() {
              root.__resize_handle.style.height = root.__ul.offsetHeight + 'px';
            });
          }

          if (root.__closeButton) {
            root.__closeButton.style.width = root.width + 'px';
          }

        },

        /**
         * Mark objects for saving. The order of these objects cannot change as
         * the GUI grows. When remembering new objects, append them to the end
         * of the list.
         *
         * @param {Object...} objects
         * @throws {Error} if not called on a top level GUI.
         * @instance
         */
        remember: function() {

          if (common.isUndefined(SAVE_DIALOGUE)) {
            SAVE_DIALOGUE = new CenteredDiv();
            SAVE_DIALOGUE.domElement.innerHTML = saveDialogueContents;
          }

          if (this.parent) {
            throw new Error("You can only call remember on a top level GUI.");
          }

          var _this = this;

          common.each(Array.prototype.slice.call(arguments), function(object) {
            if (_this.__rememberedObjects.length == 0) {
              addSaveMenu(_this);
            }
            if (_this.__rememberedObjects.indexOf(object) == -1) {
              _this.__rememberedObjects.push(object);
            }
          });

          if (this.autoPlace) {
            // Set save row width
            setWidth(this, this.width);
          }

        },

        /**
         * @returns {dat.gui.GUI} the topmost parent GUI of a nested GUI.
         * @instance
         */
        getRoot: function() {
          var gui = this;
          while (gui.parent) {
            gui = gui.parent;
          }
          return gui;
        },

        /**
         * @returns {Object} a JSON object representing the current state of
         * this GUI as well as its remembered properties.
         * @instance
         */
        getSaveObject: function() {

          var toReturn = this.load;

          toReturn.closed = this.closed;

          // Am I remembering any values?
          if (this.__rememberedObjects.length > 0) {

            toReturn.preset = this.preset;

            if (!toReturn.remembered) {
              toReturn.remembered = {};
            }

            toReturn.remembered[this.preset] = getCurrentPreset(this);

          }

          toReturn.folders = {};
          common.each(this.__folders, function(element, key) {
            toReturn.folders[key] = element.getSaveObject();
          });

          return toReturn;

        },

        save: function() {

          if (!this.load.remembered) {
            this.load.remembered = {};
          }

          this.load.remembered[this.preset] = getCurrentPreset(this);
          markPresetModified(this, false);

        },

        saveAs: function(presetName) {

          if (!this.load.remembered) {

            // Retain default values upon first save
            this.load.remembered = {};
            this.load.remembered[DEFAULT_DEFAULT_PRESET_NAME] = getCurrentPreset(this, true);

          }

          this.load.remembered[presetName] = getCurrentPreset(this);
          this.preset = presetName;
          addPresetOption(this, presetName, true);

        },

        revert: function(gui) {

          common.each(this.__controllers, function(controller) {
            // Make revert work on Default.
            if (!this.getRoot().load.remembered) {
              controller.setValue(controller.initialValue);
            } else {
              recallSavedValue(gui || this.getRoot(), controller);
            }
          }, this);

          common.each(this.__folders, function(folder) {
            folder.revert(folder);
          });

          if (!gui) {
            markPresetModified(this.getRoot(), false);
          }


        },

        listen: function(controller) {

          var init = this.__listening.length == 0;
          this.__listening.push(controller);
          if (init) updateDisplays(this.__listening);

        }

      }

  );

  function add(gui, object, property, params) {

    if (object[property] === undefined) {
      throw new Error("Object " + object + " has no property \"" + property + "\"");
    }

    var controller;

    if (params.color) {

      controller = new ColorController(object, property);

    } else {

      var factoryArgs = [object,property].concat(params.factoryArgs);
      controller = controllerFactory.apply(gui, factoryArgs);

    }

    if (params.before instanceof Controller) {
      params.before = params.before.__li;
    }

    recallSavedValue(gui, controller);

    dom.addClass(controller.domElement, 'c');

    var name = document.createElement('span');
    dom.addClass(name, 'property-name');
    name.innerHTML = controller.property;

    var container = document.createElement('div');
    container.appendChild(name);
    container.appendChild(controller.domElement);

    var li = addRow(gui, container, params.before);

    dom.addClass(li, GUI.CLASS_CONTROLLER_ROW);
    dom.addClass(li, typeof controller.getValue());

    augmentController(gui, li, controller);

    gui.__controllers.push(controller);

    return controller;

  }

  /**
   * Add a row to the end of the GUI or before another row.
   *
   * @param gui
   * @param [dom] If specified, inserts the dom content in the new row
   * @param [liBefore] If specified, places the new row before another row
   */
  function addRow(gui, dom, liBefore) {
    var li = document.createElement('li');
    if (dom) li.appendChild(dom);
    if (liBefore) {
      gui.__ul.insertBefore(li, params.before);
    } else {
      gui.__ul.appendChild(li);
    }
    gui.onResize();
    return li;
  }

  function augmentController(gui, li, controller) {

    controller.__li = li;
    controller.__gui = gui;

    common.extend(controller, {

      options: function(options) {

        if (arguments.length > 1) {
          controller.remove();

          return add(
              gui,
              controller.object,
              controller.property,
              {
                before: controller.__li.nextElementSibling,
                factoryArgs: [common.toArray(arguments)]
              }
          );

        }

        if (common.isArray(options) || common.isObject(options)) {
          controller.remove();

          return add(
              gui,
              controller.object,
              controller.property,
              {
                before: controller.__li.nextElementSibling,
                factoryArgs: [options]
              }
          );

        }

      },

      name: function(v) {
        controller.__li.firstElementChild.firstElementChild.innerHTML = v;
        return controller;
      },

      listen: function() {
        controller.__gui.listen(controller);
        return controller;
      },

      remove: function() {
        controller.__gui.remove(controller);
        return controller;
      }

    });

    // All sliders should be accompanied by a box.
    if (controller instanceof NumberControllerSlider) {

      var box = new NumberControllerBox(controller.object, controller.property,
          { min: controller.__min, max: controller.__max, step: controller.__step });

      common.each(['updateDisplay', 'onChange', 'onFinishChange'], function(method) {
        var pc = controller[method];
        var pb = box[method];
        controller[method] = box[method] = function() {
          var args = Array.prototype.slice.call(arguments);
          pc.apply(controller, args);
          return pb.apply(box, args);
        }
      });

      dom.addClass(li, 'has-slider');
      controller.domElement.insertBefore(box.domElement, controller.domElement.firstElementChild);

    }
    else if (controller instanceof NumberControllerBox) {

      var r = function(returned) {

        // Have we defined both boundaries?
        if (common.isNumber(controller.__min) && common.isNumber(controller.__max)) {

          // Well, then lets just replace this with a slider.
          controller.remove();
          return add(
              gui,
              controller.object,
              controller.property,
              {
                before: controller.__li.nextElementSibling,
                factoryArgs: [controller.__min, controller.__max, controller.__step]
              });

        }

        return returned;

      };

      controller.min = common.compose(r, controller.min);
      controller.max = common.compose(r, controller.max);

    }
    else if (controller instanceof BooleanController) {

      dom.bind(li, 'click', function() {
        dom.fakeEvent(controller.__checkbox, 'click');
      });

      dom.bind(controller.__checkbox, 'click', function(e) {
        e.stopPropagation(); // Prevents double-toggle
      })

    }
    else if (controller instanceof FunctionController) {

      dom.bind(li, 'click', function() {
        dom.fakeEvent(controller.__button, 'click');
      });

      dom.bind(li, 'mouseover', function() {
        dom.addClass(controller.__button, 'hover');
      });

      dom.bind(li, 'mouseout', function() {
        dom.removeClass(controller.__button, 'hover');
      });

    }
    else if (controller instanceof ColorController) {

      dom.addClass(li, 'color');
      controller.updateDisplay = common.compose(function(r) {
        li.style.borderLeftColor = controller.__color.toString();
        return r;
      }, controller.updateDisplay);

      controller.updateDisplay();

    }

    controller.setValue = common.compose(function(r) {
      if (gui.getRoot().__preset_select && controller.isModified()) {
        markPresetModified(gui.getRoot(), true);
      }
      return r;
    }, controller.setValue);

  }

  function recallSavedValue(gui, controller) {

    // Find the topmost GUI, that's where remembered objects live.
    var root = gui.getRoot();

    // Does the object we're controlling match anything we've been told to
    // remember?
    var matched_index = root.__rememberedObjects.indexOf(controller.object);

    // Why yes, it does!
    if (matched_index != -1) {

      // Let me fetch a map of controllers for thcommon.isObject.
      var controller_map =
          root.__rememberedObjectIndecesToControllers[matched_index];

      // Ohp, I believe this is the first controller we've created for this
      // object. Lets make the map fresh.
      if (controller_map === undefined) {
        controller_map = {};
        root.__rememberedObjectIndecesToControllers[matched_index] =
            controller_map;
      }

      // Keep track of this controller
      controller_map[controller.property] = controller;

      // Okay, now have we saved any values for this controller?
      if (root.load && root.load.remembered) {

        var preset_map = root.load.remembered;

        // Which preset are we trying to load?
        var preset;

        if (preset_map[gui.preset]) {

          preset = preset_map[gui.preset];

        } else if (preset_map[DEFAULT_DEFAULT_PRESET_NAME]) {

          // Uhh, you can have the default instead?
          preset = preset_map[DEFAULT_DEFAULT_PRESET_NAME];

        } else {

          // Nada.

          return;

        }


        // Did the loaded object remember thcommon.isObject?
        if (preset[matched_index] &&

          // Did we remember this particular property?
            preset[matched_index][controller.property] !== undefined) {

          // We did remember something for this guy ...
          var value = preset[matched_index][controller.property];

          // And that's what it is.
          controller.initialValue = value;
          controller.setValue(value);

        }

      }

    }

  }

  function getLocalStorageHash(gui, key) {
    // TODO how does this deal with multiple GUI's?
    return document.location.href + '.' + key;

  }

  function addSaveMenu(gui) {

    var div = gui.__save_row = document.createElement('li');

    dom.addClass(gui.domElement, 'has-save');

    gui.__ul.insertBefore(div, gui.__ul.firstChild);

    dom.addClass(div, 'save-row');

    var gears = document.createElement('span');
    gears.innerHTML = '&nbsp;';
    dom.addClass(gears, 'button gears');

    // TODO replace with FunctionController
    var button = document.createElement('span');
    button.innerHTML = 'Save';
    dom.addClass(button, 'button');
    dom.addClass(button, 'save');

    var button2 = document.createElement('span');
    button2.innerHTML = 'New';
    dom.addClass(button2, 'button');
    dom.addClass(button2, 'save-as');

    var button3 = document.createElement('span');
    button3.innerHTML = 'Revert';
    dom.addClass(button3, 'button');
    dom.addClass(button3, 'revert');

    var select = gui.__preset_select = document.createElement('select');

    if (gui.load && gui.load.remembered) {

      common.each(gui.load.remembered, function(value, key) {
        addPresetOption(gui, key, key == gui.preset);
      });

    } else {
      addPresetOption(gui, DEFAULT_DEFAULT_PRESET_NAME, false);
    }

    dom.bind(select, 'change', function() {


      for (var index = 0; index < gui.__preset_select.length; index++) {
        gui.__preset_select[index].innerHTML = gui.__preset_select[index].value;
      }

      gui.preset = this.value;

    });

    div.appendChild(select);
    div.appendChild(gears);
    div.appendChild(button);
    div.appendChild(button2);
    div.appendChild(button3);

    if (SUPPORTS_LOCAL_STORAGE) {

      var saveLocally = document.getElementById('dg-save-locally');
      var explain = document.getElementById('dg-local-explain');

      saveLocally.style.display = 'block';

      var localStorageCheckBox = document.getElementById('dg-local-storage');

      if (localStorage.getItem(getLocalStorageHash(gui, 'isLocal')) === 'true') {
        localStorageCheckBox.setAttribute('checked', 'checked');
      }

      function showHideExplain() {
        explain.style.display = gui.useLocalStorage ? 'block' : 'none';
      }

      showHideExplain();

      // TODO: Use a boolean controller, fool!
      dom.bind(localStorageCheckBox, 'change', function() {
        gui.useLocalStorage = !gui.useLocalStorage;
        showHideExplain();
      });

    }

    var newConstructorTextArea = document.getElementById('dg-new-constructor');

    dom.bind(newConstructorTextArea, 'keydown', function(e) {
      if (e.metaKey && (e.which === 67 || e.keyCode == 67)) {
        SAVE_DIALOGUE.hide();
      }
    });

    dom.bind(gears, 'click', function() {
      newConstructorTextArea.innerHTML = JSON.stringify(gui.getSaveObject(), undefined, 2);
      SAVE_DIALOGUE.show();
      newConstructorTextArea.focus();
      newConstructorTextArea.select();
    });

    dom.bind(button, 'click', function() {
      gui.save();
    });

    dom.bind(button2, 'click', function() {
      var presetName = prompt('Enter a new preset name.');
      if (presetName) gui.saveAs(presetName);
    });

    dom.bind(button3, 'click', function() {
      gui.revert();
    });

//    div.appendChild(button2);

  }

  function addResizeHandle(gui) {

    gui.__resize_handle = document.createElement('div');

    common.extend(gui.__resize_handle.style, {

      width: '6px',
      marginLeft: '-3px',
      height: '200px',
      cursor: 'ew-resize',
      position: 'absolute'
//      border: '1px solid blue'

    });

    var pmouseX;

    dom.bind(gui.__resize_handle, 'mousedown', dragStart);
    dom.bind(gui.__closeButton, 'mousedown', dragStart);

    gui.domElement.insertBefore(gui.__resize_handle, gui.domElement.firstElementChild);

    function dragStart(e) {

      e.preventDefault();

      pmouseX = e.clientX;

      dom.addClass(gui.__closeButton, GUI.CLASS_DRAG);
      dom.bind(window, 'mousemove', drag);
      dom.bind(window, 'mouseup', dragStop);

      return false;

    }

    function drag(e) {

      e.preventDefault();

      gui.width += pmouseX - e.clientX;
      gui.onResize();
      pmouseX = e.clientX;

      return false;

    }

    function dragStop() {

      dom.removeClass(gui.__closeButton, GUI.CLASS_DRAG);
      dom.unbind(window, 'mousemove', drag);
      dom.unbind(window, 'mouseup', dragStop);

    }

  }

  function setWidth(gui, w) {
    gui.domElement.style.width = w + 'px';
    // Auto placed save-rows are position fixed, so we have to
    // set the width manually if we want it to bleed to the edge
    if (gui.__save_row && gui.autoPlace) {
      gui.__save_row.style.width = w + 'px';
    }if (gui.__closeButton) {
      gui.__closeButton.style.width = w + 'px';
    }
  }

  function getCurrentPreset(gui, useInitialValues) {

    var toReturn = {};

    // For each object I'm remembering
    common.each(gui.__rememberedObjects, function(val, index) {

      var saved_values = {};

      // The controllers I've made for thcommon.isObject by property
      var controller_map =
          gui.__rememberedObjectIndecesToControllers[index];

      // Remember each value for each property
      common.each(controller_map, function(controller, property) {
        saved_values[property] = useInitialValues ? controller.initialValue : controller.getValue();
      });

      // Save the values for thcommon.isObject
      toReturn[index] = saved_values;

    });

    return toReturn;

  }

  function addPresetOption(gui, name, setSelected) {
    var opt = document.createElement('option');
    opt.innerHTML = name;
    opt.value = name;
    gui.__preset_select.appendChild(opt);
    if (setSelected) {
      gui.__preset_select.selectedIndex = gui.__preset_select.length - 1;
    }
  }

  function setPresetSelectIndex(gui) {
    for (var index = 0; index < gui.__preset_select.length; index++) {
      if (gui.__preset_select[index].value == gui.preset) {
        gui.__preset_select.selectedIndex = index;
      }
    }
  }

  function markPresetModified(gui, modified) {
    var opt = gui.__preset_select[gui.__preset_select.selectedIndex];
//    console.log('mark', modified, opt);
    if (modified) {
      opt.innerHTML = opt.value + "*";
    } else {
      opt.innerHTML = opt.value;
    }
  }

  function updateDisplays(controllerArray) {


    if (controllerArray.length != 0) {

      requestAnimationFrame(function() {
        updateDisplays(controllerArray);
      });

    }

    common.each(controllerArray, function(c) {
      c.updateDisplay();
    });

  }

  return GUI;

})(dat.utils.css,
"<div id=\"dg-save\" class=\"dg dialogue\">\n\n  Here's the new load parameter for your <code>GUI</code>'s constructor:\n\n  <textarea id=\"dg-new-constructor\"></textarea>\n\n  <div id=\"dg-save-locally\">\n\n    <input id=\"dg-local-storage\" type=\"checkbox\"/> Automatically save\n    values to <code>localStorage</code> on exit.\n\n    <div id=\"dg-local-explain\">The values saved to <code>localStorage</code> will\n      override those passed to <code>dat.GUI</code>'s constructor. This makes it\n      easier to work incrementally, but <code>localStorage</code> is fragile,\n      and your friends may not see the same values you do.\n      \n    </div>\n    \n  </div>\n\n</div>",
".dg ul{list-style:none;margin:0;padding:0;width:100%;clear:both}.dg.ac{position:fixed;top:0;left:0;right:0;height:0;z-index:0}.dg:not(.ac) .main{overflow:hidden}.dg.main{-webkit-transition:opacity 0.1s linear;-o-transition:opacity 0.1s linear;-moz-transition:opacity 0.1s linear;transition:opacity 0.1s linear}.dg.main.taller-than-window{overflow-y:auto}.dg.main.taller-than-window .close-button{opacity:1;margin-top:-1px;border-top:1px solid #2c2c2c}.dg.main ul.closed .close-button{opacity:1 !important}.dg.main:hover .close-button,.dg.main .close-button.drag{opacity:1}.dg.main .close-button{-webkit-transition:opacity 0.1s linear;-o-transition:opacity 0.1s linear;-moz-transition:opacity 0.1s linear;transition:opacity 0.1s linear;border:0;position:absolute;line-height:19px;height:20px;cursor:pointer;text-align:center;background-color:#000}.dg.main .close-button:hover{background-color:#111}.dg.a{float:right;margin-right:15px;overflow-x:hidden}.dg.a.has-save ul{margin-top:27px}.dg.a.has-save ul.closed{margin-top:0}.dg.a .save-row{position:fixed;top:0;z-index:1002}.dg li{-webkit-transition:height 0.1s ease-out;-o-transition:height 0.1s ease-out;-moz-transition:height 0.1s ease-out;transition:height 0.1s ease-out}.dg li:not(.folder){cursor:auto;height:27px;line-height:27px;overflow:hidden;padding:0 4px 0 5px}.dg li.folder{padding:0;border-left:4px solid rgba(0,0,0,0)}.dg li.title{cursor:pointer;margin-left:-4px}.dg .closed li:not(.title),.dg .closed ul li,.dg .closed ul li > *{height:0;overflow:hidden;border:0}.dg .cr{clear:both;padding-left:3px;height:27px}.dg .property-name{cursor:default;float:left;clear:left;width:40%;overflow:hidden;text-overflow:ellipsis}.dg .c{float:left;width:60%}.dg .c input[type=text]{border:0;margin-top:4px;padding:3px;width:100%;float:right}.dg .has-slider input[type=text]{width:30%;margin-left:0}.dg .slider{float:left;width:66%;margin-left:-5px;margin-right:0;height:19px;margin-top:4px}.dg .slider-fg{height:100%}.dg .c input[type=checkbox]{margin-top:9px}.dg .c select{margin-top:5px}.dg .cr.function,.dg .cr.function .property-name,.dg .cr.function *,.dg .cr.boolean,.dg .cr.boolean *{cursor:pointer}.dg .selector{display:none;position:absolute;margin-left:-9px;margin-top:23px;z-index:10}.dg .c:hover .selector,.dg .selector.drag{display:block}.dg li.save-row{padding:0}.dg li.save-row .button{display:inline-block;padding:0px 6px}.dg.dialogue{background-color:#222;width:460px;padding:15px;font-size:13px;line-height:15px}#dg-new-constructor{padding:10px;color:#222;font-family:Monaco, monospace;font-size:10px;border:0;resize:none;box-shadow:inset 1px 1px 1px #888;word-wrap:break-word;margin:12px 0;display:block;width:440px;overflow-y:scroll;height:100px;position:relative}#dg-local-explain{display:none;font-size:11px;line-height:17px;border-radius:3px;background-color:#333;padding:8px;margin-top:10px}#dg-local-explain code{font-size:10px}#dat-gui-save-locally{display:none}.dg{color:#eee;font:11px 'Lucida Grande', sans-serif;text-shadow:0 -1px 0 #111}.dg.main::-webkit-scrollbar{width:5px;background:#1a1a1a}.dg.main::-webkit-scrollbar-corner{height:0;display:none}.dg.main::-webkit-scrollbar-thumb{border-radius:5px;background:#676767}.dg li:not(.folder){background:#1a1a1a;border-bottom:1px solid #2c2c2c}.dg li.save-row{line-height:25px;background:#dad5cb;border:0}.dg li.save-row select{margin-left:5px;width:108px}.dg li.save-row .button{margin-left:5px;margin-top:1px;border-radius:2px;font-size:9px;line-height:7px;padding:4px 4px 5px 4px;background:#c5bdad;color:#fff;text-shadow:0 1px 0 #b0a58f;box-shadow:0 -1px 0 #b0a58f;cursor:pointer}.dg li.save-row .button.gears{background:#c5bdad url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAANCAYAAAB/9ZQ7AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQJJREFUeNpiYKAU/P//PwGIC/ApCABiBSAW+I8AClAcgKxQ4T9hoMAEUrxx2QSGN6+egDX+/vWT4e7N82AMYoPAx/evwWoYoSYbACX2s7KxCxzcsezDh3evFoDEBYTEEqycggWAzA9AuUSQQgeYPa9fPv6/YWm/Acx5IPb7ty/fw+QZblw67vDs8R0YHyQhgObx+yAJkBqmG5dPPDh1aPOGR/eugW0G4vlIoTIfyFcA+QekhhHJhPdQxbiAIguMBTQZrPD7108M6roWYDFQiIAAv6Aow/1bFwXgis+f2LUAynwoIaNcz8XNx3Dl7MEJUDGQpx9gtQ8YCueB+D26OECAAQDadt7e46D42QAAAABJRU5ErkJggg==) 2px 1px no-repeat;height:7px;width:8px}.dg li.save-row .button:hover{background-color:#bab19e;box-shadow:0 -1px 0 #b0a58f}.dg li.folder{border-bottom:0}.dg li.title{padding-left:16px;background:#000 url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlI+hKgFxoCgAOw==) 6px 10px no-repeat;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.2)}.dg .closed li.title{background-image:url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlGIWqMCbWAEAOw==)}.dg .cr.boolean{border-left:3px solid #806787}.dg .cr.function{border-left:3px solid #e61d5f}.dg .cr.number{border-left:3px solid #2fa1d6}.dg .cr.number input[type=text]{color:#2fa1d6}.dg .cr.string{border-left:3px solid #1ed36f}.dg .cr.string input[type=text]{color:#1ed36f}.dg .cr.function:hover,.dg .cr.boolean:hover{background:#111}.dg .c input[type=text]{background:#303030;outline:none}.dg .c input[type=text]:hover{background:#3c3c3c}.dg .c input[type=text]:focus{background:#494949;color:#fff}.dg .c .slider{background:#303030;cursor:ew-resize}.dg .c .slider-fg{background:#2fa1d6}.dg .c .slider:hover{background:#3c3c3c}.dg .c .slider:hover .slider-fg{background:#44abda}\n",
dat.controllers.factory = (function (OptionController, NumberControllerBox, NumberControllerSlider, StringController, FunctionController, BooleanController, common) {

      return function(object, property) {

        var initialValue = object[property];

        // Providing options?
        if (common.isArray(arguments[2]) || common.isObject(arguments[2])) {
          return new OptionController(object, property, arguments[2]);
        }

        // Providing a map?

        if (common.isNumber(initialValue)) {

          if (common.isNumber(arguments[2]) && common.isNumber(arguments[3])) {

            // Has min and max.
            return new NumberControllerSlider(object, property, arguments[2], arguments[3]);

          } else {

            return new NumberControllerBox(object, property, { min: arguments[2], max: arguments[3] });

          }

        }

        if (common.isString(initialValue)) {
          return new StringController(object, property);
        }

        if (common.isFunction(initialValue)) {
          return new FunctionController(object, property, '');
        }

        if (common.isBoolean(initialValue)) {
          return new BooleanController(object, property);
        }

      }

    })(dat.controllers.OptionController,
dat.controllers.NumberControllerBox,
dat.controllers.NumberControllerSlider,
dat.controllers.StringController = (function (Controller, dom, common) {

  /**
   * @class Provides a text input to alter the string property of an object.
   *
   * @extends dat.controllers.Controller
   *
   * @param {Object} object The object to be manipulated
   * @param {string} property The name of the property to be manipulated
   *
   * @member dat.controllers
   */
  var StringController = function(object, property) {

    StringController.superclass.call(this, object, property);

    var _this = this;

    this.__input = document.createElement('input');
    this.__input.setAttribute('type', 'text');

    dom.bind(this.__input, 'keyup', onChange);
    dom.bind(this.__input, 'change', onChange);
    dom.bind(this.__input, 'blur', onBlur);
    dom.bind(this.__input, 'keydown', function(e) {
      if (e.keyCode === 13) {
        this.blur();
      }
    });


    function onChange() {
      _this.setValue(_this.__input.value);
    }

    function onBlur() {
      if (_this.__onFinishChange) {
        _this.__onFinishChange.call(_this, _this.getValue());
      }
    }

    this.updateDisplay();

    this.domElement.appendChild(this.__input);

  };

  StringController.superclass = Controller;

  common.extend(

      StringController.prototype,
      Controller.prototype,

      {

        updateDisplay: function() {
          // Stops the caret from moving on account of:
          // keyup -> setValue -> updateDisplay
          if (!dom.isActive(this.__input)) {
            this.__input.value = this.getValue();
          }
          return StringController.superclass.prototype.updateDisplay.call(this);
        }

      }

  );

  return StringController;

})(dat.controllers.Controller,
dat.dom.dom,
dat.utils.common),
dat.controllers.FunctionController,
dat.controllers.BooleanController,
dat.utils.common),
dat.controllers.Controller,
dat.controllers.BooleanController,
dat.controllers.FunctionController,
dat.controllers.NumberControllerBox,
dat.controllers.NumberControllerSlider,
dat.controllers.OptionController,
dat.controllers.ColorController = (function (Controller, dom, Color, interpret, common) {

  var ColorController = function(object, property) {

    ColorController.superclass.call(this, object, property);

    this.__color = new Color(this.getValue());
    this.__temp = new Color(0);

    var _this = this;

    this.domElement = document.createElement('div');

    dom.makeSelectable(this.domElement, false);

    this.__selector = document.createElement('div');
    this.__selector.className = 'selector';

    this.__saturation_field = document.createElement('div');
    this.__saturation_field.className = 'saturation-field';

    this.__field_knob = document.createElement('div');
    this.__field_knob.className = 'field-knob';
    this.__field_knob_border = '2px solid ';

    this.__hue_knob = document.createElement('div');
    this.__hue_knob.className = 'hue-knob';

    this.__hue_field = document.createElement('div');
    this.__hue_field.className = 'hue-field';

    this.__input = document.createElement('input');
    this.__input.type = 'text';
    this.__input_textShadow = '0 1px 1px ';

    dom.bind(this.__input, 'keydown', function(e) {
      if (e.keyCode === 13) { // on enter
        onBlur.call(this);
      }
    });

    dom.bind(this.__input, 'blur', onBlur);

    dom.bind(this.__selector, 'mousedown', function(e) {

      dom
        .addClass(this, 'drag')
        .bind(window, 'mouseup', function(e) {
          dom.removeClass(_this.__selector, 'drag');
        });

    });

    var value_field = document.createElement('div');

    common.extend(this.__selector.style, {
      width: '122px',
      height: '102px',
      padding: '3px',
      backgroundColor: '#222',
      boxShadow: '0px 1px 3px rgba(0,0,0,0.3)'
    });

    common.extend(this.__field_knob.style, {
      position: 'absolute',
      width: '12px',
      height: '12px',
      border: this.__field_knob_border + (this.__color.v < .5 ? '#fff' : '#000'),
      boxShadow: '0px 1px 3px rgba(0,0,0,0.5)',
      borderRadius: '12px',
      zIndex: 1
    });

    common.extend(this.__hue_knob.style, {
      position: 'absolute',
      width: '15px',
      height: '2px',
      borderRight: '4px solid #fff',
      zIndex: 1
    });

    common.extend(this.__saturation_field.style, {
      width: '100px',
      height: '100px',
      border: '1px solid #555',
      marginRight: '3px',
      display: 'inline-block',
      cursor: 'pointer'
    });

    common.extend(value_field.style, {
      width: '100%',
      height: '100%',
      background: 'none'
    });

    linearGradient(value_field, 'top', 'rgba(0,0,0,0)', '#000');

    common.extend(this.__hue_field.style, {
      width: '15px',
      height: '100px',
      display: 'inline-block',
      border: '1px solid #555',
      cursor: 'ns-resize'
    });

    hueGradient(this.__hue_field);

    common.extend(this.__input.style, {
      outline: 'none',
//      width: '120px',
      textAlign: 'center',
//      padding: '4px',
//      marginBottom: '6px',
      color: '#fff',
      border: 0,
      fontWeight: 'bold',
      textShadow: this.__input_textShadow + 'rgba(0,0,0,0.7)'
    });

    dom.bind(this.__saturation_field, 'mousedown', fieldDown);
    dom.bind(this.__field_knob, 'mousedown', fieldDown);

    dom.bind(this.__hue_field, 'mousedown', function(e) {
      setH(e);
      dom.bind(window, 'mousemove', setH);
      dom.bind(window, 'mouseup', unbindH);
    });

    function fieldDown(e) {
      setSV(e);
      // document.body.style.cursor = 'none';
      dom.bind(window, 'mousemove', setSV);
      dom.bind(window, 'mouseup', unbindSV);
    }

    function unbindSV() {
      dom.unbind(window, 'mousemove', setSV);
      dom.unbind(window, 'mouseup', unbindSV);
      // document.body.style.cursor = 'default';
    }

    function onBlur() {
      var i = interpret(this.value);
      if (i !== false) {
        _this.__color.__state = i;
        _this.setValue(_this.__color.toOriginal());
      } else {
        this.value = _this.__color.toString();
      }
    }

    function unbindH() {
      dom.unbind(window, 'mousemove', setH);
      dom.unbind(window, 'mouseup', unbindH);
    }

    this.__saturation_field.appendChild(value_field);
    this.__selector.appendChild(this.__field_knob);
    this.__selector.appendChild(this.__saturation_field);
    this.__selector.appendChild(this.__hue_field);
    this.__hue_field.appendChild(this.__hue_knob);

    this.domElement.appendChild(this.__input);
    this.domElement.appendChild(this.__selector);

    this.updateDisplay();

    function setSV(e) {

      e.preventDefault();

      var w = dom.getWidth(_this.__saturation_field);
      var o = dom.getOffset(_this.__saturation_field);
      var s = (e.clientX - o.left + document.body.scrollLeft) / w;
      var v = 1 - (e.clientY - o.top + document.body.scrollTop) / w;

      if (v > 1) v = 1;
      else if (v < 0) v = 0;

      if (s > 1) s = 1;
      else if (s < 0) s = 0;

      _this.__color.v = v;
      _this.__color.s = s;

      _this.setValue(_this.__color.toOriginal());


      return false;

    }

    function setH(e) {

      e.preventDefault();

      var s = dom.getHeight(_this.__hue_field);
      var o = dom.getOffset(_this.__hue_field);
      var h = 1 - (e.clientY - o.top + document.body.scrollTop) / s;

      if (h > 1) h = 1;
      else if (h < 0) h = 0;

      _this.__color.h = h * 360;

      _this.setValue(_this.__color.toOriginal());

      return false;

    }

  };

  ColorController.superclass = Controller;

  common.extend(

      ColorController.prototype,
      Controller.prototype,

      {

        updateDisplay: function() {

          var i = interpret(this.getValue());

          if (i !== false) {

            var mismatch = false;

            // Check for mismatch on the interpreted value.

            common.each(Color.COMPONENTS, function(component) {
              if (!common.isUndefined(i[component]) &&
                  !common.isUndefined(this.__color.__state[component]) &&
                  i[component] !== this.__color.__state[component]) {
                mismatch = true;
                return {}; // break
              }
            }, this);

            // If nothing diverges, we keep our previous values
            // for statefulness, otherwise we recalculate fresh
            if (mismatch) {
              common.extend(this.__color.__state, i);
            }

          }

          common.extend(this.__temp.__state, this.__color.__state);

          this.__temp.a = 1;

          var flip = (this.__color.v < .5 || this.__color.s > .5) ? 255 : 0;
          var _flip = 255 - flip;

          common.extend(this.__field_knob.style, {
            marginLeft: 100 * this.__color.s - 7 + 'px',
            marginTop: 100 * (1 - this.__color.v) - 7 + 'px',
            backgroundColor: this.__temp.toString(),
            border: this.__field_knob_border + 'rgb(' + flip + ',' + flip + ',' + flip +')'
          });

          this.__hue_knob.style.marginTop = (1 - this.__color.h / 360) * 100 + 'px'

          this.__temp.s = 1;
          this.__temp.v = 1;

          linearGradient(this.__saturation_field, 'left', '#fff', this.__temp.toString());

          common.extend(this.__input.style, {
            backgroundColor: this.__input.value = this.__color.toString(),
            color: 'rgb(' + flip + ',' + flip + ',' + flip +')',
            textShadow: this.__input_textShadow + 'rgba(' + _flip + ',' + _flip + ',' + _flip +',.7)'
          });

        }

      }

  );

  var vendors = ['-moz-','-o-','-webkit-','-ms-',''];

  function linearGradient(elem, x, a, b) {
    elem.style.background = '';
    common.each(vendors, function(vendor) {
      elem.style.cssText += 'background: ' + vendor + 'linear-gradient('+x+', '+a+' 0%, ' + b + ' 100%); ';
    });
  }

  function hueGradient(elem) {
    elem.style.background = '';
    elem.style.cssText += 'background: -moz-linear-gradient(top,  #ff0000 0%, #ff00ff 17%, #0000ff 34%, #00ffff 50%, #00ff00 67%, #ffff00 84%, #ff0000 100%);'
    elem.style.cssText += 'background: -webkit-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);'
    elem.style.cssText += 'background: -o-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);'
    elem.style.cssText += 'background: -ms-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);'
    elem.style.cssText += 'background: linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);'
  }


  return ColorController;

})(dat.controllers.Controller,
dat.dom.dom,
dat.color.Color = (function (interpret, math, toString, common) {

  var Color = function() {

    this.__state = interpret.apply(this, arguments);

    if (this.__state === false) {
      throw 'Failed to interpret color arguments';
    }

    this.__state.a = this.__state.a || 1;


  };

  Color.COMPONENTS = ['r','g','b','h','s','v','hex','a'];

  common.extend(Color.prototype, {

    toString: function() {
      return toString(this);
    },

    toOriginal: function() {
      return this.__state.conversion.write(this);
    }

  });

  defineRGBComponent(Color.prototype, 'r', 2);
  defineRGBComponent(Color.prototype, 'g', 1);
  defineRGBComponent(Color.prototype, 'b', 0);

  defineHSVComponent(Color.prototype, 'h');
  defineHSVComponent(Color.prototype, 's');
  defineHSVComponent(Color.prototype, 'v');

  Object.defineProperty(Color.prototype, 'a', {

    get: function() {
      return this.__state.a;
    },

    set: function(v) {
      this.__state.a = v;
    }

  });

  Object.defineProperty(Color.prototype, 'hex', {

    get: function() {

      if (!this.__state.space !== 'HEX') {
        this.__state.hex = math.rgb_to_hex(this.r, this.g, this.b);
      }

      return this.__state.hex;

    },

    set: function(v) {

      this.__state.space = 'HEX';
      this.__state.hex = v;

    }

  });

  function defineRGBComponent(target, component, componentHexIndex) {

    Object.defineProperty(target, component, {

      get: function() {

        if (this.__state.space === 'RGB') {
          return this.__state[component];
        }

        recalculateRGB(this, component, componentHexIndex);

        return this.__state[component];

      },

      set: function(v) {

        if (this.__state.space !== 'RGB') {
          recalculateRGB(this, component, componentHexIndex);
          this.__state.space = 'RGB';
        }

        this.__state[component] = v;

      }

    });

  }

  function defineHSVComponent(target, component) {

    Object.defineProperty(target, component, {

      get: function() {

        if (this.__state.space === 'HSV')
          return this.__state[component];

        recalculateHSV(this);

        return this.__state[component];

      },

      set: function(v) {

        if (this.__state.space !== 'HSV') {
          recalculateHSV(this);
          this.__state.space = 'HSV';
        }

        this.__state[component] = v;

      }

    });

  }

  function recalculateRGB(color, component, componentHexIndex) {

    if (color.__state.space === 'HEX') {

      color.__state[component] = math.component_from_hex(color.__state.hex, componentHexIndex);

    } else if (color.__state.space === 'HSV') {

      common.extend(color.__state, math.hsv_to_rgb(color.__state.h, color.__state.s, color.__state.v));

    } else {

      throw 'Corrupted color state';

    }

  }

  function recalculateHSV(color) {

    var result = math.rgb_to_hsv(color.r, color.g, color.b);

    common.extend(color.__state,
        {
          s: result.s,
          v: result.v
        }
    );

    if (!common.isNaN(result.h)) {
      color.__state.h = result.h;
    } else if (common.isUndefined(color.__state.h)) {
      color.__state.h = 0;
    }

  }

  return Color;

})(dat.color.interpret,
dat.color.math = (function () {

  var tmpComponent;

  return {

    hsv_to_rgb: function(h, s, v) {

      var hi = Math.floor(h / 60) % 6;

      var f = h / 60 - Math.floor(h / 60);
      var p = v * (1.0 - s);
      var q = v * (1.0 - (f * s));
      var t = v * (1.0 - ((1.0 - f) * s));
      var c = [
        [v, t, p],
        [q, v, p],
        [p, v, t],
        [p, q, v],
        [t, p, v],
        [v, p, q]
      ][hi];

      return {
        r: c[0] * 255,
        g: c[1] * 255,
        b: c[2] * 255
      };

    },

    rgb_to_hsv: function(r, g, b) {

      var min = Math.min(r, g, b),
          max = Math.max(r, g, b),
          delta = max - min,
          h, s;

      if (max != 0) {
        s = delta / max;
      } else {
        return {
          h: NaN,
          s: 0,
          v: 0
        };
      }

      if (r == max) {
        h = (g - b) / delta;
      } else if (g == max) {
        h = 2 + (b - r) / delta;
      } else {
        h = 4 + (r - g) / delta;
      }
      h /= 6;
      if (h < 0) {
        h += 1;
      }

      return {
        h: h * 360,
        s: s,
        v: max / 255
      };
    },

    rgb_to_hex: function(r, g, b) {
      var hex = this.hex_with_component(0, 2, r);
      hex = this.hex_with_component(hex, 1, g);
      hex = this.hex_with_component(hex, 0, b);
      return hex;
    },

    component_from_hex: function(hex, componentIndex) {
      return (hex >> (componentIndex * 8)) & 0xFF;
    },

    hex_with_component: function(hex, componentIndex, value) {
      return value << (tmpComponent = componentIndex * 8) | (hex & ~ (0xFF << tmpComponent));
    }

  }

})(),
dat.color.toString,
dat.utils.common),
dat.color.interpret,
dat.utils.common),
dat.utils.requestAnimationFrame = (function () {

  /**
   * requirejs version of Paul Irish's RequestAnimationFrame
   * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
   */

  return window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function(callback, element) {

        window.setTimeout(callback, 1000 / 60);

      };
})(),
dat.dom.CenteredDiv = (function (dom, common) {


  var CenteredDiv = function() {

    this.backgroundElement = document.createElement('div');
    common.extend(this.backgroundElement.style, {
      backgroundColor: 'rgba(0,0,0,0.8)',
      top: 0,
      left: 0,
      display: 'none',
      zIndex: '1000',
      opacity: 0,
      WebkitTransition: 'opacity 0.2s linear'
    });

    dom.makeFullscreen(this.backgroundElement);
    this.backgroundElement.style.position = 'fixed';

    this.domElement = document.createElement('div');
    common.extend(this.domElement.style, {
      position: 'fixed',
      display: 'none',
      zIndex: '1001',
      opacity: 0,
      WebkitTransition: '-webkit-transform 0.2s ease-out, opacity 0.2s linear'
    });


    document.body.appendChild(this.backgroundElement);
    document.body.appendChild(this.domElement);

    var _this = this;
    dom.bind(this.backgroundElement, 'click', function() {
      _this.hide();
    });


  };

  CenteredDiv.prototype.show = function() {

    var _this = this;



    this.backgroundElement.style.display = 'block';

    this.domElement.style.display = 'block';
    this.domElement.style.opacity = 0;
//    this.domElement.style.top = '52%';
    this.domElement.style.webkitTransform = 'scale(1.1)';

    this.layout();

    common.defer(function() {
      _this.backgroundElement.style.opacity = 1;
      _this.domElement.style.opacity = 1;
      _this.domElement.style.webkitTransform = 'scale(1)';
    });

  };

  CenteredDiv.prototype.hide = function() {

    var _this = this;

    var hide = function() {

      _this.domElement.style.display = 'none';
      _this.backgroundElement.style.display = 'none';

      dom.unbind(_this.domElement, 'webkitTransitionEnd', hide);
      dom.unbind(_this.domElement, 'transitionend', hide);
      dom.unbind(_this.domElement, 'oTransitionEnd', hide);

    };

    dom.bind(this.domElement, 'webkitTransitionEnd', hide);
    dom.bind(this.domElement, 'transitionend', hide);
    dom.bind(this.domElement, 'oTransitionEnd', hide);

    this.backgroundElement.style.opacity = 0;
//    this.domElement.style.top = '48%';
    this.domElement.style.opacity = 0;
    this.domElement.style.webkitTransform = 'scale(1.1)';

  };

  CenteredDiv.prototype.layout = function() {
    this.domElement.style.left = window.innerWidth/2 - dom.getWidth(this.domElement) / 2 + 'px';
    this.domElement.style.top = window.innerHeight/2 - dom.getHeight(this.domElement) / 2 + 'px';
  };

  function lockScroll(e) {
    console.log(e);
  }

  return CenteredDiv;

})(dat.dom.dom,
dat.utils.common),
dat.dom.dom,
dat.utils.common);
},{}],2:[function(require,module,exports){
/* Firebase v1.0.24 - License: https://www.firebase.com/terms/terms-of-service.html */ (function() {var scope={};(function(){"use strict";function m(c,b){if(0===c.length||0===b.length)return c.concat(b);var a=c[c.length-1],d=Math.round(a/1099511627776)||32,e;if(32===d)e=c.concat(b);else{e=b;var a=a|0,f=c.slice(0,c.length-1),g;for(void 0===f&&(f=[]);32<=d;d-=32)f.push(a),a=0;if(0===d)e=f.concat(e);else{for(g=0;g<e.length;g++)f.push(a|e[g]>>>d),a=e[g]<<32-d;g=e.length?e[e.length-1]:0;e=Math.round(g/1099511627776)||32;f.push(n(d+e&31,32<d+e?a:f.pop(),1));e=f}}return e}
function p(c){var b=c.length;return 0===b?0:32*(b-1)+(Math.round(c[b-1]/1099511627776)||32)}function n(c,b,a){return 32===c?b:(a?b|0:b<<32-c)+1099511627776*c}function r(c){c?(this.c=c.c.slice(0),this.b=c.b.slice(0),this.a=c.a):this.reset()}
r.prototype={d:512,reset:function(){this.c=this.e.slice(0);this.b=[];this.a=0;return this},update:function(c){if("string"===typeof c){c=unescape(encodeURIComponent(c));var b=[],a,d=0;for(a=0;a<c.length;a++)d=d<<8|c.charCodeAt(a),3===(a&3)&&(b.push(d),d=0);a&3&&b.push(n(8*(a&3),d));c=b}a=this.b=m(this.b,c);b=this.a;c=this.a=b+p(c);for(b=this.d+b&-this.d;b<=c;b+=this.d)s(this,a.splice(0,16));return this},e:[1732584193,4023233417,2562383102,271733878,3285377520],f:[1518500249,1859775393,2400959708,3395469782]};
function s(c,b){var a,d,e,f,g,l,q,k=b.slice(0),h=c.c;e=h[0];f=h[1];g=h[2];l=h[3];q=h[4];for(a=0;79>=a;a++)16<=a&&(k[a]=(k[a-3]^k[a-8]^k[a-14]^k[a-16])<<1|(k[a-3]^k[a-8]^k[a-14]^k[a-16])>>>31),d=19>=a?f&g|~f&l:39>=a?f^g^l:59>=a?f&g|f&l|g&l:79>=a?f^g^l:void 0,d=(e<<5|e>>>27)+d+q+k[a]+c.f[Math.floor(a/20)]|0,q=l,l=g,g=f<<30|f>>>2,f=e,e=d;h[0]=h[0]+e|0;h[1]=h[1]+f|0;h[2]=h[2]+g|0;h[3]=h[3]+l|0;h[4]=h[4]+q|0}
function t(c){var b=(new r).update(c),a,d=b.b;c=b.c;d=m(d,[n(1,1)]);for(a=d.length+2;a&15;a++)d.push(0);d.push(Math.floor(b.a/4294967296));for(d.push(b.a|0);d.length;)s(b,d.splice(0,16));b.reset();var e,b="";a=0;var d="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",f=0,g=p(c);e&&(d=d.substr(0,62)+"-_");for(e=0;6*b.length<g;)b+=d.charAt((f^c[e]>>>a)>>>26),6>a?(f=c[e]<<6-a,a+=26,e++):(f<<=6,a-=6);for(;b.length&3;)b+="=";return b}var u=["sjclHashToBase64"],v=this;
u[0]in v||!v.execScript||v.execScript("var "+u[0]);for(var w;u.length&&(w=u.shift());)u.length||void 0===t?v=v[w]?v[w]:v[w]={}:v[w]=t;}).apply(scope);var sjclHashToBase64=scope['sjclHashToBase64']; var h,aa=this;function m(a){return void 0!==a}function ba(){}function ca(a){a.qb=function(){return a.hd?a.hd:a.hd=new a}}
function da(a){var b=typeof a;if("object"==b)if(a){if(a instanceof Array)return"array";if(a instanceof Object)return b;var c=Object.prototype.toString.call(a);if("[object Window]"==c)return"object";if("[object Array]"==c||"number"==typeof a.length&&"undefined"!=typeof a.splice&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("splice"))return"array";if("[object Function]"==c||"undefined"!=typeof a.call&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("call"))return"function"}else return"null";
else if("function"==b&&"undefined"==typeof a.call)return"object";return b}function ea(a){return"array"==da(a)}function fa(a){var b=da(a);return"array"==b||"object"==b&&"number"==typeof a.length}function p(a){return"string"==typeof a}function ga(a){return"number"==typeof a}function ha(a){var b=typeof a;return"object"==b&&null!=a||"function"==b}function ia(a,b,c){return a.call.apply(a.bind,arguments)}
function ja(a,b,c){if(!a)throw Error();if(2<arguments.length){var d=Array.prototype.slice.call(arguments,2);return function(){var c=Array.prototype.slice.call(arguments);Array.prototype.unshift.apply(c,d);return a.apply(b,c)}}return function(){return a.apply(b,arguments)}}function q(a,b,c){q=Function.prototype.bind&&-1!=Function.prototype.bind.toString().indexOf("native code")?ia:ja;return q.apply(null,arguments)}
function ka(a,b){function c(){}c.prototype=b.prototype;a.ge=b.prototype;a.prototype=new c;a.ee=function(a,c,f){return b.prototype[c].apply(a,Array.prototype.slice.call(arguments,2))}};function la(a){a=String(a);if(/^\s*$/.test(a)?0:/^[\],:{}\s\u2028\u2029]*$/.test(a.replace(/\\["\\\/bfnrtu]/g,"@").replace(/"[^"\\\n\r\u2028\u2029\x00-\x08\x0a-\x1f]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:[\s\u2028\u2029]*\[)+/g,"")))try{return eval("("+a+")")}catch(b){}throw Error("Invalid JSON string: "+a);}function ma(){this.mc=void 0}
function na(a,b,c){switch(typeof b){case "string":oa(b,c);break;case "number":c.push(isFinite(b)&&!isNaN(b)?b:"null");break;case "boolean":c.push(b);break;case "undefined":c.push("null");break;case "object":if(null==b){c.push("null");break}if(ea(b)){var d=b.length;c.push("[");for(var e="",f=0;f<d;f++)c.push(e),e=b[f],na(a,a.mc?a.mc.call(b,String(f),e):e,c),e=",";c.push("]");break}c.push("{");d="";for(f in b)Object.prototype.hasOwnProperty.call(b,f)&&(e=b[f],"function"!=typeof e&&(c.push(d),oa(f,c),
c.push(":"),na(a,a.mc?a.mc.call(b,f,e):e,c),d=","));c.push("}");break;case "function":break;default:throw Error("Unknown type: "+typeof b);}}var pa={'"':'\\"',"\\":"\\\\","/":"\\/","\b":"\\b","\f":"\\f","\n":"\\n","\r":"\\r","\t":"\\t","\x0B":"\\u000b"},qa=/\uffff/.test("\uffff")?/[\\\"\x00-\x1f\x7f-\uffff]/g:/[\\\"\x00-\x1f\x7f-\xff]/g;
function oa(a,b){b.push('"',a.replace(qa,function(a){if(a in pa)return pa[a];var b=a.charCodeAt(0),e="\\u";16>b?e+="000":256>b?e+="00":4096>b&&(e+="0");return pa[a]=e+b.toString(16)}),'"')};function ra(a){return"undefined"!==typeof JSON&&m(JSON.parse)?JSON.parse(a):la(a)}function u(a){if("undefined"!==typeof JSON&&m(JSON.stringify))a=JSON.stringify(a);else{var b=[];na(new ma,a,b);a=b.join("")}return a};function sa(a){for(var b=[],c=0,d=0;d<a.length;d++){var e=a.charCodeAt(d);55296<=e&&56319>=e&&(e-=55296,d++,v(d<a.length,"Surrogate pair missing trail surrogate."),e=65536+(e<<10)+(a.charCodeAt(d)-56320));128>e?b[c++]=e:(2048>e?b[c++]=e>>6|192:(65536>e?b[c++]=e>>12|224:(b[c++]=e>>18|240,b[c++]=e>>12&63|128),b[c++]=e>>6&63|128),b[c++]=e&63|128)}return b};var ta={};function x(a,b,c,d){var e;d<b?e="at least "+b:d>c&&(e=0===c?"none":"no more than "+c);if(e)throw Error(a+" failed: Was called with "+d+(1===d?" argument.":" arguments.")+" Expects "+e+".");}
function y(a,b,c){var d="";switch(b){case 1:d=c?"first":"First";break;case 2:d=c?"second":"Second";break;case 3:d=c?"third":"Third";break;case 4:d=c?"fourth":"Fourth";break;default:ua.assert(!1,"errorPrefix_ called with argumentNumber > 4.  Need to update it?")}return a=a+" failed: "+(d+" argument ")}function z(a,b,c,d){if((!d||m(c))&&"function"!=da(c))throw Error(y(a,b,d)+"must be a valid function.");}
function va(a,b,c){if(m(c)&&(!ha(c)||null===c))throw Error(y(a,b,!0)+"must be a valid context object.");};function A(a,b){return Object.prototype.hasOwnProperty.call(a,b)}function wa(a,b){if(Object.prototype.hasOwnProperty.call(a,b))return a[b]};var ua={},xa=/[\[\].#$\/\u0000-\u001F\u007F]/,ya=/[\[\].#$\u0000-\u001F\u007F]/;function za(a){return p(a)&&0!==a.length&&!xa.test(a)}function Aa(a,b,c){c&&!m(b)||Ba(y(a,1,c),b)}
function Ba(a,b,c,d){c||(c=0);d=d||[];if(!m(b))throw Error(a+"contains undefined"+Ca(d));if("function"==da(b))throw Error(a+"contains a function"+Ca(d)+" with contents: "+b.toString());if(Da(b))throw Error(a+"contains "+b.toString()+Ca(d));if(1E3<c)throw new TypeError(a+"contains a cyclic object value ("+d.slice(0,100).join(".")+"...)");if(p(b)&&b.length>10485760/3&&10485760<sa(b).length)throw Error(a+"contains a string greater than 10485760 utf8 bytes"+Ca(d)+" ('"+b.substring(0,50)+"...')");if(ha(b))for(var e in b)if(A(b,
e)){var f=b[e];if(".priority"!==e&&".value"!==e&&".sv"!==e&&!za(e))throw Error(a+" contains an invalid key ("+e+")"+Ca(d)+'.  Keys must be non-empty strings and can\'t contain ".", "#", "$", "/", "[", or "]"');d.push(e);Ba(a,f,c+1,d);d.pop()}}function Ca(a){return 0==a.length?"":" in property '"+a.join(".")+"'"}function Ea(a,b){if(!ha(b)||ea(b))throw Error(y(a,1,!1)+" must be an Object containing the children to replace.");Aa(a,b,!1)}
function Fa(a,b,c,d){if(!d||m(c)){if(Da(c))throw Error(y(a,b,d)+"is "+c.toString()+", but must be a valid Firebase priority (a string, finite number, or null).");if(!(null===c||ga(c)||p(c)||ha(c)&&A(c,".sv")))throw Error(y(a,b,d)+"must be a valid Firebase priority (a string, finite number, or null).");}}
function Ga(a,b,c){if(!c||m(b))switch(b){case "value":case "child_added":case "child_removed":case "child_changed":case "child_moved":break;default:throw Error(y(a,1,c)+'must be a valid event type: "value", "child_added", "child_removed", "child_changed", or "child_moved".');}}function Ha(a,b){if(m(b)&&!za(b))throw Error(y(a,2,!0)+'was an invalid key: "'+b+'".  Firebase keys must be non-empty strings and can\'t contain ".", "#", "$", "/", "[", or "]").');}
function Ia(a,b){if(!p(b)||0===b.length||ya.test(b))throw Error(y(a,1,!1)+'was an invalid path: "'+b+'". Paths must be non-empty strings and can\'t contain ".", "#", "$", "[", or "]"');}function B(a,b){if(".info"===C(b))throw Error(a+" failed: Can't modify data under /.info/");};function D(a,b,c,d,e,f,g){this.m=a;this.path=b;this.Da=c;this.da=d;this.wa=e;this.Ba=f;this.Xa=g;if(m(this.da)&&m(this.Ba)&&m(this.Da))throw"Query: Can't combine startAt(), endAt(), and limit().";}D.prototype.Qc=function(){x("Query.ref",0,0,arguments.length);return new E(this.m,this.path)};D.prototype.ref=D.prototype.Qc;
D.prototype.eb=function(a,b){x("Query.on",2,4,arguments.length);Ga("Query.on",a,!1);z("Query.on",2,b,!1);var c=Ja("Query.on",arguments[2],arguments[3]);this.m.Qb(this,a,b,c.cancel,c.Y);return b};D.prototype.on=D.prototype.eb;D.prototype.xb=function(a,b,c){x("Query.off",0,3,arguments.length);Ga("Query.off",a,!0);z("Query.off",2,b,!0);va("Query.off",3,c);this.m.lc(this,a,b,c)};D.prototype.off=D.prototype.xb;
D.prototype.Td=function(a,b){function c(g){f&&(f=!1,e.xb(a,c),b.call(d.Y,g))}x("Query.once",2,4,arguments.length);Ga("Query.once",a,!1);z("Query.once",2,b,!1);var d=Ja("Query.once",arguments[2],arguments[3]),e=this,f=!0;this.eb(a,c,function(b){e.xb(a,c);d.cancel&&d.cancel.call(d.Y,b)})};D.prototype.once=D.prototype.Td;
D.prototype.Md=function(a){x("Query.limit",1,1,arguments.length);if(!ga(a)||Math.floor(a)!==a||0>=a)throw"Query.limit: First argument must be a positive integer.";return new D(this.m,this.path,a,this.da,this.wa,this.Ba,this.Xa)};D.prototype.limit=D.prototype.Md;D.prototype.wd=function(a,b){x("Query.startAt",0,2,arguments.length);Fa("Query.startAt",1,a,!0);Ha("Query.startAt",b);m(a)||(b=a=null);return new D(this.m,this.path,this.Da,a,b,this.Ba,this.Xa)};D.prototype.startAt=D.prototype.wd;
D.prototype.cd=function(a,b){x("Query.endAt",0,2,arguments.length);Fa("Query.endAt",1,a,!0);Ha("Query.endAt",b);return new D(this.m,this.path,this.Da,this.da,this.wa,a,b)};D.prototype.endAt=D.prototype.cd;D.prototype.Gd=function(a,b){x("Query.equalTo",1,2,arguments.length);Fa("Query.equalTo",1,a,!1);Ha("Query.equalTo",b);return this.wd(a,b).cd(a,b)};D.prototype.equalTo=D.prototype.Gd;
function Ka(a){var b={};m(a.da)&&(b.sp=a.da);m(a.wa)&&(b.sn=a.wa);m(a.Ba)&&(b.ep=a.Ba);m(a.Xa)&&(b.en=a.Xa);m(a.Da)&&(b.l=a.Da);m(a.da)&&m(a.wa)&&null===a.da&&null===a.wa&&(b.vf="l");return b}D.prototype.Ra=function(){var a=La(Ka(this));return"{}"===a?"default":a};
function Ja(a,b,c){var d={};if(b&&c)d.cancel=b,z(a,3,d.cancel,!0),d.Y=c,va(a,4,d.Y);else if(b)if("object"===typeof b&&null!==b)d.Y=b;else if("function"===typeof b)d.cancel=b;else throw Error(ta.fe(a,3,!0)+"must either be a cancel callback or a context object.");return d};function F(a,b){if(1==arguments.length){this.o=a.split("/");for(var c=0,d=0;d<this.o.length;d++)0<this.o[d].length&&(this.o[c]=this.o[d],c++);this.o.length=c;this.U=0}else this.o=a,this.U=b}function C(a){return a.U>=a.o.length?null:a.o[a.U]}function Ma(a){var b=a.U;b<a.o.length&&b++;return new F(a.o,b)}function Na(a){return a.U<a.o.length?a.o[a.o.length-1]:null}h=F.prototype;h.toString=function(){for(var a="",b=this.U;b<this.o.length;b++)""!==this.o[b]&&(a+="/"+this.o[b]);return a||"/"};
h.parent=function(){if(this.U>=this.o.length)return null;for(var a=[],b=this.U;b<this.o.length-1;b++)a.push(this.o[b]);return new F(a,0)};h.G=function(a){for(var b=[],c=this.U;c<this.o.length;c++)b.push(this.o[c]);if(a instanceof F)for(c=a.U;c<a.o.length;c++)b.push(a.o[c]);else for(a=a.split("/"),c=0;c<a.length;c++)0<a[c].length&&b.push(a[c]);return new F(b,0)};h.f=function(){return this.U>=this.o.length};h.length=function(){return this.o.length-this.U};
function Oa(a,b){var c=C(a);if(null===c)return b;if(c===C(b))return Oa(Ma(a),Ma(b));throw"INTERNAL ERROR: innerPath ("+b+") is not within outerPath ("+a+")";}h.contains=function(a){var b=this.U,c=a.U;if(this.length()>a.length())return!1;for(;b<this.o.length;){if(this.o[b]!==a.o[c])return!1;++b;++c}return!0};function Pa(){this.children={};this.wc=0;this.value=null}function Qa(a,b,c){this.Ea=a?a:"";this.Db=b?b:null;this.C=c?c:new Pa}function I(a,b){for(var c=b instanceof F?b:new F(b),d=a,e;null!==(e=C(c));)d=new Qa(e,d,wa(d.C.children,e)||new Pa),c=Ma(c);return d}h=Qa.prototype;h.j=function(){return this.C.value};function J(a,b){v("undefined"!==typeof b,"Cannot set value to undefined");a.C.value=b;Ra(a)}h.rb=function(){return 0<this.C.wc};h.f=function(){return null===this.j()&&!this.rb()};
h.A=function(a){for(var b in this.C.children)a(new Qa(b,this,this.C.children[b]))};function Sa(a,b,c,d){c&&!d&&b(a);a.A(function(a){Sa(a,b,!0,d)});c&&d&&b(a)}function Ta(a,b,c){for(a=c?a:a.parent();null!==a;){if(b(a))return!0;a=a.parent()}return!1}h.path=function(){return new F(null===this.Db?this.Ea:this.Db.path()+"/"+this.Ea)};h.name=function(){return this.Ea};h.parent=function(){return this.Db};
function Ra(a){if(null!==a.Db){var b=a.Db,c=a.Ea,d=a.f(),e=A(b.C.children,c);d&&e?(delete b.C.children[c],b.C.wc--,Ra(b)):d||e||(b.C.children[c]=a.C,b.C.wc++,Ra(b))}};function Ua(a,b){this.Va=a?a:Va;this.ca=b?b:Wa}function Va(a,b){return a<b?-1:a>b?1:0}h=Ua.prototype;h.qa=function(a,b){return new Ua(this.Va,this.ca.qa(a,b,this.Va).J(null,null,!1,null,null))};h.remove=function(a){return new Ua(this.Va,this.ca.remove(a,this.Va).J(null,null,!1,null,null))};h.get=function(a){for(var b,c=this.ca;!c.f();){b=this.Va(a,c.key);if(0===b)return c.value;0>b?c=c.left:0<b&&(c=c.right)}return null};
function Xa(a,b){for(var c,d=a.ca,e=null;!d.f();){c=a.Va(b,d.key);if(0===c){if(d.left.f())return e?e.key:null;for(d=d.left;!d.right.f();)d=d.right;return d.key}0>c?d=d.left:0<c&&(e=d,d=d.right)}throw Error("Attempted to find predecessor key for a nonexistent key.  What gives?");}h.f=function(){return this.ca.f()};h.count=function(){return this.ca.count()};h.wb=function(){return this.ca.wb()};h.ab=function(){return this.ca.ab()};h.Ca=function(a){return this.ca.Ca(a)};h.Sa=function(a){return this.ca.Sa(a)};
h.$a=function(a){return new Ya(this.ca,a)};function Ya(a,b){this.rd=b;for(this.$b=[];!a.f();)this.$b.push(a),a=a.left}function Za(a){if(0===a.$b.length)return null;var b=a.$b.pop(),c;c=a.rd?a.rd(b.key,b.value):{key:b.key,value:b.value};for(b=b.right;!b.f();)a.$b.push(b),b=b.left;return c}function $a(a,b,c,d,e){this.key=a;this.value=b;this.color=null!=c?c:!0;this.left=null!=d?d:Wa;this.right=null!=e?e:Wa}h=$a.prototype;
h.J=function(a,b,c,d,e){return new $a(null!=a?a:this.key,null!=b?b:this.value,null!=c?c:this.color,null!=d?d:this.left,null!=e?e:this.right)};h.count=function(){return this.left.count()+1+this.right.count()};h.f=function(){return!1};h.Ca=function(a){return this.left.Ca(a)||a(this.key,this.value)||this.right.Ca(a)};h.Sa=function(a){return this.right.Sa(a)||a(this.key,this.value)||this.left.Sa(a)};function cb(a){return a.left.f()?a:cb(a.left)}h.wb=function(){return cb(this).key};
h.ab=function(){return this.right.f()?this.key:this.right.ab()};h.qa=function(a,b,c){var d,e;e=this;d=c(a,e.key);e=0>d?e.J(null,null,null,e.left.qa(a,b,c),null):0===d?e.J(null,b,null,null,null):e.J(null,null,null,null,e.right.qa(a,b,c));return db(e)};function eb(a){if(a.left.f())return Wa;a.left.P()||a.left.left.P()||(a=fb(a));a=a.J(null,null,null,eb(a.left),null);return db(a)}
h.remove=function(a,b){var c,d;c=this;if(0>b(a,c.key))c.left.f()||c.left.P()||c.left.left.P()||(c=fb(c)),c=c.J(null,null,null,c.left.remove(a,b),null);else{c.left.P()&&(c=gb(c));c.right.f()||c.right.P()||c.right.left.P()||(c=hb(c),c.left.left.P()&&(c=gb(c),c=hb(c)));if(0===b(a,c.key)){if(c.right.f())return Wa;d=cb(c.right);c=c.J(d.key,d.value,null,null,eb(c.right))}c=c.J(null,null,null,null,c.right.remove(a,b))}return db(c)};h.P=function(){return this.color};
function db(a){a.right.P()&&!a.left.P()&&(a=ib(a));a.left.P()&&a.left.left.P()&&(a=gb(a));a.left.P()&&a.right.P()&&(a=hb(a));return a}function fb(a){a=hb(a);a.right.left.P()&&(a=a.J(null,null,null,null,gb(a.right)),a=ib(a),a=hb(a));return a}function ib(a){return a.right.J(null,null,a.color,a.J(null,null,!0,null,a.right.left),null)}function gb(a){return a.left.J(null,null,a.color,null,a.J(null,null,!0,a.left.right,null))}
function hb(a){return a.J(null,null,!a.color,a.left.J(null,null,!a.left.color,null,null),a.right.J(null,null,!a.right.color,null,null))}function jb(){}h=jb.prototype;h.J=function(){return this};h.qa=function(a,b){return new $a(a,b,null)};h.remove=function(){return this};h.count=function(){return 0};h.f=function(){return!0};h.Ca=function(){return!1};h.Sa=function(){return!1};h.wb=function(){return null};h.ab=function(){return null};h.P=function(){return!1};var Wa=new jb;function kb(a){this.Ub=a;this.hc="firebase:"}kb.prototype.set=function(a,b){null==b?this.Ub.removeItem(this.hc+a):this.Ub.setItem(this.hc+a,u(b))};kb.prototype.get=function(a){a=this.Ub.getItem(this.hc+a);return null==a?null:ra(a)};kb.prototype.remove=function(a){this.Ub.removeItem(this.hc+a)};kb.prototype.kd=!1;function lb(){this.mb={}}lb.prototype.set=function(a,b){null==b?delete this.mb[a]:this.mb[a]=b};lb.prototype.get=function(a){return A(this.mb,a)?this.mb[a]:null};lb.prototype.remove=function(a){delete this.mb[a]};lb.prototype.kd=!0;function mb(a){try{if("undefined"!==typeof window&&"undefined"!==typeof window[a]){var b=window[a];b.setItem("firebase:sentinel","cache");b.removeItem("firebase:sentinel");return new kb(b)}}catch(c){}return new lb}var nb=mb("localStorage"),ob=mb("sessionStorage");function pb(a,b,c,d){this.host=a.toLowerCase();this.domain=this.host.substr(this.host.indexOf(".")+1);this.nc=b;this.Zb=c;this.ce=d;this.ga=nb.get("host:"+a)||this.host}function qb(a,b){b!==a.ga&&(a.ga=b,"s-"===a.ga.substr(0,2)&&nb.set("host:"+a.host,a.ga))}pb.prototype.toString=function(){return(this.nc?"https://":"http://")+this.host};var rb=Array.prototype,sb=rb.forEach?function(a,b,c){rb.forEach.call(a,b,c)}:function(a,b,c){for(var d=a.length,e=p(a)?a.split(""):a,f=0;f<d;f++)f in e&&b.call(c,e[f],f,a)},tb=rb.map?function(a,b,c){return rb.map.call(a,b,c)}:function(a,b,c){for(var d=a.length,e=Array(d),f=p(a)?a.split(""):a,g=0;g<d;g++)g in f&&(e[g]=b.call(c,f[g],g,a));return e},ub=rb.reduce?function(a,b,c,d){d&&(b=q(b,d));return rb.reduce.call(a,b,c)}:function(a,b,c,d){var e=c;sb(a,function(c,g){e=b.call(d,e,c,g,a)});return e},
vb=rb.every?function(a,b,c){return rb.every.call(a,b,c)}:function(a,b,c){for(var d=a.length,e=p(a)?a.split(""):a,f=0;f<d;f++)if(f in e&&!b.call(c,e[f],f,a))return!1;return!0};function wb(a,b){var c;a:{c=a.length;for(var d=p(a)?a.split(""):a,e=0;e<c;e++)if(e in d&&b.call(void 0,d[e],e,a)){c=e;break a}c=-1}return 0>c?null:p(a)?a.charAt(c):a[c]};var xb;a:{var yb=aa.navigator;if(yb){var zb=yb.userAgent;if(zb){xb=zb;break a}}xb=""}function Ab(a){return-1!=xb.indexOf(a)};var Bb=Ab("Opera")||Ab("OPR"),Cb=Ab("Trident")||Ab("MSIE"),Db=Ab("Gecko")&&-1==xb.toLowerCase().indexOf("webkit")&&!(Ab("Trident")||Ab("MSIE")),Eb=-1!=xb.toLowerCase().indexOf("webkit");(function(){var a="",b;if(Bb&&aa.opera)return a=aa.opera.version,"function"==da(a)?a():a;Db?b=/rv\:([^\);]+)(\)|;)/:Cb?b=/\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/:Eb&&(b=/WebKit\/(\S+)/);b&&(a=(a=b.exec(xb))?a[1]:"");return Cb&&(b=(b=aa.document)?b.documentMode:void 0,b>parseFloat(a))?String(b):a})();var Fb=null,Gb=null;var Hb=function(){var a=1;return function(){return a++}}();function v(a,b){if(!a)throw Error("Firebase INTERNAL ASSERT FAILED:"+b);}function Ib(a){for(var b="",c=0;c<arguments.length;c++)b=fa(arguments[c])?b+Ib.apply(null,arguments[c]):"object"===typeof arguments[c]?b+u(arguments[c]):b+arguments[c],b+=" ";return b}var Jb=null,Kb=!0;function K(a){!0===Kb&&(Kb=!1,null===Jb&&!0===ob.get("logging_enabled")&&Lb(!0));if(Jb){var b=Ib.apply(null,arguments);Jb(b)}}
function Mb(a){return function(){K(a,arguments)}}function Nb(a){if("undefined"!==typeof console){var b="FIREBASE INTERNAL ERROR: "+Ib.apply(null,arguments);"undefined"!==typeof console.error?console.error(b):console.log(b)}}function Ob(a){var b=Ib.apply(null,arguments);throw Error("FIREBASE FATAL ERROR: "+b);}function L(a){if("undefined"!==typeof console){var b="FIREBASE WARNING: "+Ib.apply(null,arguments);"undefined"!==typeof console.warn?console.warn(b):console.log(b)}}
function Da(a){return ga(a)&&(a!=a||a==Number.POSITIVE_INFINITY||a==Number.NEGATIVE_INFINITY)}function Pb(a){if("complete"===document.readyState)a();else{var b=!1,c=function(){document.body?b||(b=!0,a()):setTimeout(c,Math.floor(10))};document.addEventListener?(document.addEventListener("DOMContentLoaded",c,!1),window.addEventListener("load",c,!1)):document.attachEvent&&(document.attachEvent("onreadystatechange",function(){"complete"===document.readyState&&c()}),window.attachEvent("onload",c))}}
function Qb(a,b){return a!==b?null===a?-1:null===b?1:typeof a!==typeof b?"number"===typeof a?-1:1:a>b?1:-1:0}function Rb(a,b){if(a===b)return 0;var c=Sb(a),d=Sb(b);return null!==c?null!==d?0==c-d?a.length-b.length:c-d:-1:null!==d?1:a<b?-1:1}function Tb(a,b){if(b&&a in b)return b[a];throw Error("Missing required key ("+a+") in object: "+u(b));}
function La(a){if("object"!==typeof a||null===a)return u(a);var b=[],c;for(c in a)b.push(c);b.sort();c="{";for(var d=0;d<b.length;d++)0!==d&&(c+=","),c+=u(b[d]),c+=":",c+=La(a[b[d]]);return c+"}"}function Ub(a,b){if(a.length<=b)return[a];for(var c=[],d=0;d<a.length;d+=b)d+b>a?c.push(a.substring(d,a.length)):c.push(a.substring(d,d+b));return c}function Vb(a,b){if(ea(a))for(var c=0;c<a.length;++c)b(c,a[c]);else Wb(a,b)}function Xb(a,b){return b?q(a,b):a}
function Yb(a){v(!Da(a),"Invalid JSON number");var b,c,d,e;0===a?(d=c=0,b=-Infinity===1/a?1:0):(b=0>a,a=Math.abs(a),a>=Math.pow(2,-1022)?(d=Math.min(Math.floor(Math.log(a)/Math.LN2),1023),c=d+1023,d=Math.round(a*Math.pow(2,52-d)-Math.pow(2,52))):(c=0,d=Math.round(a/Math.pow(2,-1074))));e=[];for(a=52;a;a-=1)e.push(d%2?1:0),d=Math.floor(d/2);for(a=11;a;a-=1)e.push(c%2?1:0),c=Math.floor(c/2);e.push(b?1:0);e.reverse();b=e.join("");c="";for(a=0;64>a;a+=8)d=parseInt(b.substr(a,8),2).toString(16),1===d.length&&
(d="0"+d),c+=d;return c.toLowerCase()}function Zb(a){var b="Unknown Error";"too_big"===a?b="The data requested exceeds the maximum size that can be accessed with a single request.":"permission_denied"==a?b="Client doesn't have permission to access the desired data.":"unavailable"==a&&(b="The service is unavailable");b=Error(a+": "+b);b.code=a.toUpperCase();return b}var $b=/^-?\d{1,10}$/;function Sb(a){return $b.test(a)&&(a=Number(a),-2147483648<=a&&2147483647>=a)?a:null}
function ac(a){try{a()}catch(b){setTimeout(function(){throw b;},Math.floor(0))}};function bc(a,b){this.F=a;v(null!==this.F,"LeafNode shouldn't be created with null value.");this.fb="undefined"!==typeof b?b:null}h=bc.prototype;h.O=function(){return!0};h.k=function(){return this.fb};h.Ha=function(a){return new bc(this.F,a)};h.N=function(){return M};h.K=function(a){return null===C(a)?this:M};h.fa=function(){return null};h.H=function(a,b){return(new N).H(a,b).Ha(this.fb)};h.ya=function(a,b){var c=C(a);return null===c?b:this.H(c,M.ya(Ma(a),b))};h.f=function(){return!1};h.ac=function(){return 0};
h.V=function(a){return a&&null!==this.k()?{".value":this.j(),".priority":this.k()}:this.j()};h.hash=function(){var a="";null!==this.k()&&(a+="priority:"+cc(this.k())+":");var b=typeof this.F,a=a+(b+":"),a="number"===b?a+Yb(this.F):a+this.F;return sjclHashToBase64(a)};h.j=function(){return this.F};h.toString=function(){return"string"===typeof this.F?this.F:'"'+this.F+'"'};function dc(a,b){return Qb(a.ja,b.ja)||Rb(a.name,b.name)}function ec(a,b){return Rb(a.name,b.name)}function fc(a,b){return Rb(a,b)};function N(a,b){this.n=a||new Ua(fc);this.fb="undefined"!==typeof b?b:null}h=N.prototype;h.O=function(){return!1};h.k=function(){return this.fb};h.Ha=function(a){return new N(this.n,a)};h.H=function(a,b){var c=this.n.remove(a);b&&b.f()&&(b=null);null!==b&&(c=c.qa(a,b));return b&&null!==b.k()?new gc(c,null,this.fb):new N(c,this.fb)};h.ya=function(a,b){var c=C(a);if(null===c)return b;var d=this.N(c).ya(Ma(a),b);return this.H(c,d)};h.f=function(){return this.n.f()};h.ac=function(){return this.n.count()};
var ic=/^(0|[1-9]\d*)$/;h=N.prototype;h.V=function(a){if(this.f())return null;var b={},c=0,d=0,e=!0;this.A(function(f,g){b[f]=g.V(a);c++;e&&ic.test(f)?d=Math.max(d,Number(f)):e=!1});if(!a&&e&&d<2*c){var f=[],g;for(g in b)f[g]=b[g];return f}a&&null!==this.k()&&(b[".priority"]=this.k());return b};h.hash=function(){var a="";null!==this.k()&&(a+="priority:"+cc(this.k())+":");this.A(function(b,c){var d=c.hash();""!==d&&(a+=":"+b+":"+d)});return""===a?"":sjclHashToBase64(a)};
h.N=function(a){a=this.n.get(a);return null===a?M:a};h.K=function(a){var b=C(a);return null===b?this:this.N(b).K(Ma(a))};h.fa=function(a){return Xa(this.n,a)};h.ed=function(){return this.n.wb()};h.gd=function(){return this.n.ab()};h.A=function(a){return this.n.Ca(a)};h.Bc=function(a){return this.n.Sa(a)};h.$a=function(){return this.n.$a()};h.toString=function(){var a="{",b=!0;this.A(function(c,d){b?b=!1:a+=", ";a+='"'+c+'" : '+d.toString()});return a+="}"};var M=new N;function gc(a,b,c){N.call(this,a,c);null===b&&(b=new Ua(dc),a.Ca(function(a,c){b=b.qa({name:a,ja:c.k()},c)}));this.va=b}ka(gc,N);h=gc.prototype;h.H=function(a,b){var c=this.N(a),d=this.n,e=this.va;null!==c&&(d=d.remove(a),e=e.remove({name:a,ja:c.k()}));b&&b.f()&&(b=null);null!==b&&(d=d.qa(a,b),e=e.qa({name:a,ja:b.k()},b));return new gc(d,e,this.k())};h.fa=function(a,b){var c=Xa(this.va,{name:a,ja:b.k()});return c?c.name:null};h.A=function(a){return this.va.Ca(function(b,c){return a(b.name,c)})};
h.Bc=function(a){return this.va.Sa(function(b,c){return a(b.name,c)})};h.$a=function(){return this.va.$a(function(a,b){return{key:a.name,value:b}})};h.ed=function(){return this.va.f()?null:this.va.wb().name};h.gd=function(){return this.va.f()?null:this.va.ab().name};function O(a,b){if(null===a)return M;var c=null;"object"===typeof a&&".priority"in a?c=a[".priority"]:"undefined"!==typeof b&&(c=b);v(null===c||"string"===typeof c||"number"===typeof c||"object"===typeof c&&".sv"in c,"Invalid priority type found: "+typeof c);"object"===typeof a&&".value"in a&&null!==a[".value"]&&(a=a[".value"]);if("object"!==typeof a||".sv"in a)return new bc(a,c);if(a instanceof Array){var d=M,e=a;Wb(e,function(a,b){if(A(e,b)&&"."!==b.substring(0,1)){var c=O(a);if(c.O()||!c.f())d=
d.H(b,c)}});return d.Ha(c)}var f=[],g={},k=!1,l=a;Vb(l,function(a,b){if("string"!==typeof b||"."!==b.substring(0,1)){var c=O(l[b]);c.f()||(k=k||null!==c.k(),f.push({name:b,ja:c.k()}),g[b]=c)}});var n=jc(f,g,!1);if(k){var r=jc(f,g,!0);return new gc(n,r,c)}return new N(n,c)}var kc=Math.log(2);function lc(a){this.count=parseInt(Math.log(a+1)/kc,10);this.ad=this.count-1;this.Dd=a+1&parseInt(Array(this.count+1).join("1"),2)}function mc(a){var b=!(a.Dd&1<<a.ad);a.ad--;return b}
function jc(a,b,c){function d(e,f){var l=f-e;if(0==l)return null;if(1==l){var l=a[e].name,n=c?a[e]:l;return new $a(n,b[l],!1,null,null)}var n=parseInt(l/2,10)+e,r=d(e,n),t=d(n+1,f),l=a[n].name,n=c?a[n]:l;return new $a(n,b[l],!1,r,t)}var e=c?dc:ec;a.sort(e);var f=function(e){function f(e,g){var k=r-e,t=r;r-=e;var s=a[k].name,k=new $a(c?a[k]:s,b[s],g,null,d(k+1,t));l?l.left=k:n=k;l=k}for(var l=null,n=null,r=a.length,t=0;t<e.count;++t){var s=mc(e),w=Math.pow(2,e.count-(t+1));s?f(w,!1):(f(w,!1),f(w,!0))}return n}(new lc(a.length)),
e=c?dc:fc;return null!==f?new Ua(e,f):new Ua(e)}function cc(a){return"number"===typeof a?"number:"+Yb(a):"string:"+a};function P(a,b){this.C=a;this.kc=b}P.prototype.V=function(){x("Firebase.DataSnapshot.val",0,0,arguments.length);return this.C.V()};P.prototype.val=P.prototype.V;P.prototype.Hd=function(){x("Firebase.DataSnapshot.exportVal",0,0,arguments.length);return this.C.V(!0)};P.prototype.exportVal=P.prototype.Hd;P.prototype.G=function(a){x("Firebase.DataSnapshot.child",0,1,arguments.length);ga(a)&&(a=String(a));Ia("Firebase.DataSnapshot.child",a);var b=new F(a),c=this.kc.G(b);return new P(this.C.K(b),c)};
P.prototype.child=P.prototype.G;P.prototype.Ec=function(a){x("Firebase.DataSnapshot.hasChild",1,1,arguments.length);Ia("Firebase.DataSnapshot.hasChild",a);var b=new F(a);return!this.C.K(b).f()};P.prototype.hasChild=P.prototype.Ec;P.prototype.k=function(){x("Firebase.DataSnapshot.getPriority",0,0,arguments.length);return this.C.k()};P.prototype.getPriority=P.prototype.k;
P.prototype.forEach=function(a){x("Firebase.DataSnapshot.forEach",1,1,arguments.length);z("Firebase.DataSnapshot.forEach",1,a,!1);if(this.C.O())return!1;var b=this;return this.C.A(function(c,d){return a(new P(d,b.kc.G(c)))})};P.prototype.forEach=P.prototype.forEach;P.prototype.rb=function(){x("Firebase.DataSnapshot.hasChildren",0,0,arguments.length);return this.C.O()?!1:!this.C.f()};P.prototype.hasChildren=P.prototype.rb;
P.prototype.name=function(){x("Firebase.DataSnapshot.name",0,0,arguments.length);return this.kc.name()};P.prototype.name=P.prototype.name;P.prototype.ac=function(){x("Firebase.DataSnapshot.numChildren",0,0,arguments.length);return this.C.ac()};P.prototype.numChildren=P.prototype.ac;P.prototype.Qc=function(){x("Firebase.DataSnapshot.ref",0,0,arguments.length);return this.kc};P.prototype.ref=P.prototype.Qc;function nc(a){v(ea(a)&&0<a.length,"Requires a non-empty array");this.Cd=a;this.vb={}}nc.prototype.Yc=function(a,b){for(var c=this.vb[a]||[],d=0;d<c.length;d++)c[d].aa.apply(c[d].Y,Array.prototype.slice.call(arguments,1))};nc.prototype.eb=function(a,b,c){oc(this,a);this.vb[a]=this.vb[a]||[];this.vb[a].push({aa:b,Y:c});(a=this.fd(a))&&b.apply(c,a)};nc.prototype.xb=function(a,b,c){oc(this,a);a=this.vb[a]||[];for(var d=0;d<a.length;d++)if(a[d].aa===b&&(!c||c===a[d].Y)){a.splice(d,1);break}};
function oc(a,b){v(wb(a.Cd,function(a){return a===b}),"Unknown event: "+b)};function pc(){nc.call(this,["visible"]);var a,b;"undefined"!==typeof document&&"undefined"!==typeof document.addEventListener&&("undefined"!==typeof document.hidden?(b="visibilitychange",a="hidden"):"undefined"!==typeof document.mozHidden?(b="mozvisibilitychange",a="mozHidden"):"undefined"!==typeof document.msHidden?(b="msvisibilitychange",a="msHidden"):"undefined"!==typeof document.webkitHidden&&(b="webkitvisibilitychange",a="webkitHidden"));this.kb=!0;if(b){var c=this;document.addEventListener(b,
function(){var b=!document[a];b!==c.kb&&(c.kb=b,c.Yc("visible",b))},!1)}}ka(pc,nc);ca(pc);pc.prototype.fd=function(a){v("visible"===a,"Unknown event type: "+a);return[this.kb]};function qc(){nc.call(this,["online"]);this.Bb=!0;if("undefined"!==typeof window&&"undefined"!==typeof window.addEventListener){var a=this;window.addEventListener("online",function(){a.Bb||a.Yc("online",!0);a.Bb=!0},!1);window.addEventListener("offline",function(){a.Bb&&a.Yc("online",!1);a.Bb=!1},!1)}}ka(qc,nc);ca(qc);qc.prototype.fd=function(a){v("online"===a,"Unknown event type: "+a);return[this.Bb]};function Wb(a,b){for(var c in a)b.call(void 0,a[c],c,a)}function rc(a){var b=[],c=0,d;for(d in a)b[c++]=d;return b}function sc(a){var b={},c;for(c in a)b[c]=a[c];return b};function tc(){this.nb={}}function uc(a,b,c){m(c)||(c=1);A(a.nb,b)||(a.nb[b]=0);a.nb[b]+=c}tc.prototype.get=function(){return sc(this.nb)};function vc(a){this.Ed=a;this.Wb=null}vc.prototype.get=function(){var a=this.Ed.get(),b=sc(a);if(this.Wb)for(var c in this.Wb)b[c]-=this.Wb[c];this.Wb=a;return b};function wc(a,b){this.Vc={};this.qc=new vc(a);this.u=b;var c=1E4+2E4*Math.random();setTimeout(q(this.pd,this),Math.floor(c))}wc.prototype.pd=function(){var a=this.qc.get(),b={},c=!1,d;for(d in a)0<a[d]&&A(this.Vc,d)&&(b[d]=a[d],c=!0);c&&(a=this.u,a.R&&(b={c:b},a.e("reportStats",b),a.Fa("s",b)));setTimeout(q(this.pd,this),Math.floor(6E5*Math.random()))};var xc={},yc={};function zc(a){a=a.toString();xc[a]||(xc[a]=new tc);return xc[a]}function Ac(a,b){var c=a.toString();yc[c]||(yc[c]=b());return yc[c]};var Bc=null;"undefined"!==typeof MozWebSocket?Bc=MozWebSocket:"undefined"!==typeof WebSocket&&(Bc=WebSocket);function Q(a,b,c){this.yc=a;this.e=Mb(this.yc);this.frames=this.tb=null;this.Ia=this.Ja=this.Xc=0;this.ea=zc(b);this.za=(b.nc?"wss://":"ws://")+b.ga+"/.ws?v=5";"undefined"!==typeof location&&location.href&&-1!==location.href.indexOf("firebaseio.com")&&(this.za+="&r=f");b.host!==b.ga&&(this.za=this.za+"&ns="+b.Zb);c&&(this.za=this.za+"&s="+c)}var Cc;
Q.prototype.open=function(a,b){this.ia=b;this.Qd=a;this.e("Websocket connecting to "+this.za);this.W=new Bc(this.za);this.ob=!1;nb.set("previous_websocket_failure",!0);var c=this;this.W.onopen=function(){c.e("Websocket connected.");c.ob=!0};this.W.onclose=function(){c.e("Websocket connection was disconnected.");c.W=null;c.Qa()};this.W.onmessage=function(a){if(null!==c.W)if(a=a.data,c.Ia+=a.length,uc(c.ea,"bytes_received",a.length),Dc(c),null!==c.frames)Ec(c,a);else{a:{v(null===c.frames,"We already have a frame buffer");
if(6>=a.length){var b=Number(a);if(!isNaN(b)){c.Xc=b;c.frames=[];a=null;break a}}c.Xc=1;c.frames=[]}null!==a&&Ec(c,a)}};this.W.onerror=function(a){c.e("WebSocket error.  Closing connection.");(a=a.message||a.data)&&c.e(a);c.Qa()}};Q.prototype.start=function(){};Q.isAvailable=function(){var a=!1;if("undefined"!==typeof navigator&&navigator.userAgent){var b=navigator.userAgent.match(/Android ([0-9]{0,}\.[0-9]{0,})/);b&&1<b.length&&4.4>parseFloat(b[1])&&(a=!0)}return!a&&null!==Bc&&!Cc};
Q.responsesRequiredToBeHealthy=2;Q.healthyTimeout=3E4;h=Q.prototype;h.Xb=function(){nb.remove("previous_websocket_failure")};function Ec(a,b){a.frames.push(b);if(a.frames.length==a.Xc){var c=a.frames.join("");a.frames=null;c=ra(c);a.Qd(c)}}h.send=function(a){Dc(this);a=u(a);this.Ja+=a.length;uc(this.ea,"bytes_sent",a.length);a=Ub(a,16384);1<a.length&&this.W.send(String(a.length));for(var b=0;b<a.length;b++)this.W.send(a[b])};
h.Lb=function(){this.Na=!0;this.tb&&(clearInterval(this.tb),this.tb=null);this.W&&(this.W.close(),this.W=null)};h.Qa=function(){this.Na||(this.e("WebSocket is closing itself"),this.Lb(),this.ia&&(this.ia(this.ob),this.ia=null))};h.close=function(){this.Na||(this.e("WebSocket is being closed"),this.Lb())};function Dc(a){clearInterval(a.tb);a.tb=setInterval(function(){a.W&&a.W.send("0");Dc(a)},Math.floor(45E3))};function Fc(a){this.Lc=a;this.gc=[];this.Wa=0;this.xc=-1;this.Pa=null}function Gc(a,b,c){a.xc=b;a.Pa=c;a.xc<a.Wa&&(a.Pa(),a.Pa=null)}function Hc(a,b,c){for(a.gc[b]=c;a.gc[a.Wa];){var d=a.gc[a.Wa];delete a.gc[a.Wa];for(var e=0;e<d.length;++e)if(d[e]){var f=a;ac(function(){f.Lc(d[e])})}if(a.Wa===a.xc){a.Pa&&(clearTimeout(a.Pa),a.Pa(),a.Pa=null);break}a.Wa++}};function Ic(){this.set={}}h=Ic.prototype;h.add=function(a,b){this.set[a]=null!==b?b:!0};h.contains=function(a){return A(this.set,a)};h.get=function(a){return this.contains(a)?this.set[a]:void 0};h.remove=function(a){delete this.set[a]};h.f=function(){var a;a:{a=this.set;for(var b in a){a=!1;break a}a=!0}return a};h.count=function(){var a=this.set,b=0,c;for(c in a)b++;return b};function R(a,b){Wb(a.set,function(a,d){b(d,a)})}h.keys=function(){var a=[];Wb(this.set,function(b,c){a.push(c)});return a};function Jc(a,b,c){this.yc=a;this.e=Mb(a);this.Ia=this.Ja=0;this.ea=zc(b);this.pc=c;this.ob=!1;this.Pb=function(a){b.host!==b.ga&&(a.ns=b.Zb);var c=[],f;for(f in a)a.hasOwnProperty(f)&&c.push(f+"="+a[f]);return(b.nc?"https://":"http://")+b.ga+"/.lp?"+c.join("&")}}var Kc,Lc;
Jc.prototype.open=function(a,b){this.$c=0;this.S=b;this.ld=new Fc(a);this.Na=!1;var c=this;this.Ka=setTimeout(function(){c.e("Timed out trying to connect.");c.Qa();c.Ka=null},Math.floor(3E4));Pb(function(){if(!c.Na){c.la=new Mc(function(a,b,d,k,l){Nc(c,arguments);if(c.la)if(c.Ka&&(clearTimeout(c.Ka),c.Ka=null),c.ob=!0,"start"==a)c.id=b,c.od=d;else if("close"===a)b?(c.la.oc=!1,Gc(c.ld,b,function(){c.Qa()})):c.Qa();else throw Error("Unrecognized command received: "+a);},function(a,b){Nc(c,arguments);
Hc(c.ld,a,b)},function(){c.Qa()},c.Pb);var a={start:"t"};a.ser=Math.floor(1E8*Math.random());c.la.rc&&(a.cb=c.la.rc);a.v="5";c.pc&&(a.s=c.pc);"undefined"!==typeof location&&location.href&&-1!==location.href.indexOf("firebaseio.com")&&(a.r="f");a=c.Pb(a);c.e("Connecting via long-poll to "+a);Oc(c.la,a,function(){})}})};
Jc.prototype.start=function(){var a=this.la,b=this.od;a.Od=this.id;a.Pd=b;for(a.uc=!0;Pc(a););a=this.id;b=this.od;this.bb=document.createElement("iframe");var c={dframe:"t"};c.id=a;c.pw=b;this.bb.src=this.Pb(c);this.bb.style.display="none";document.body.appendChild(this.bb)};Jc.isAvailable=function(){return!Lc&&!("object"===typeof window&&window.chrome&&window.chrome.extension&&!/^chrome/.test(window.location.href))&&!("object"===typeof Windows&&"object"===typeof Windows.de)&&(Kc||!0)};h=Jc.prototype;
h.Xb=function(){};h.Lb=function(){this.Na=!0;this.la&&(this.la.close(),this.la=null);this.bb&&(document.body.removeChild(this.bb),this.bb=null);this.Ka&&(clearTimeout(this.Ka),this.Ka=null)};h.Qa=function(){this.Na||(this.e("Longpoll is closing itself"),this.Lb(),this.S&&(this.S(this.ob),this.S=null))};h.close=function(){this.Na||(this.e("Longpoll is being closed."),this.Lb())};
h.send=function(a){a=u(a);this.Ja+=a.length;uc(this.ea,"bytes_sent",a.length);a=sa(a);if(!fa(a))throw Error("encodeByteArray takes an array as a parameter");if(!Fb){Fb={};Gb={};for(var b=0;65>b;b++)Fb[b]="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(b),Gb[b]="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.".charAt(b)}for(var b=Gb,c=[],d=0;d<a.length;d+=3){var e=a[d],f=d+1<a.length,g=f?a[d+1]:0,k=d+2<a.length,l=k?a[d+2]:0,n=e>>2,e=(e&3)<<4|g>>4,g=(g&15)<<
2|l>>6,l=l&63;k||(l=64,f||(g=64));c.push(b[n],b[e],b[g],b[l])}a=Ub(c.join(""),1840);for(b=0;b<a.length;b++)c=this.la,c.Fb.push({Yd:this.$c,be:a.length,bd:a[b]}),c.uc&&Pc(c),this.$c++};function Nc(a,b){var c=u(b).length;a.Ia+=c;uc(a.ea,"bytes_received",c)}
function Mc(a,b,c,d){this.Pb=d;this.ia=c;this.Nc=new Ic;this.Fb=[];this.zc=Math.floor(1E8*Math.random());this.oc=!0;this.rc=Hb();window["pLPCommand"+this.rc]=a;window["pRTLPCB"+this.rc]=b;a=document.createElement("iframe");a.style.display="none";if(document.body){document.body.appendChild(a);try{a.contentWindow.document||K("No IE domain setting required")}catch(e){a.src="javascript:void((function(){document.open();document.domain='"+document.domain+"';document.close();})())"}}else throw"Document body has not initialized. Wait to initialize Firebase until after the document is ready.";
a.contentDocument?a.Aa=a.contentDocument:a.contentWindow?a.Aa=a.contentWindow.document:a.document&&(a.Aa=a.document);this.Z=a;a="";this.Z.src&&"javascript:"===this.Z.src.substr(0,11)&&(a='<script>document.domain="'+document.domain+'";\x3c/script>');a="<html><body>"+a+"</body></html>";try{this.Z.Aa.open(),this.Z.Aa.write(a),this.Z.Aa.close()}catch(f){K("frame writing exception"),f.stack&&K(f.stack),K(f)}}
Mc.prototype.close=function(){this.uc=!1;if(this.Z){this.Z.Aa.body.innerHTML="";var a=this;setTimeout(function(){null!==a.Z&&(document.body.removeChild(a.Z),a.Z=null)},Math.floor(0))}var b=this.ia;b&&(this.ia=null,b())};
function Pc(a){if(a.uc&&a.oc&&a.Nc.count()<(0<a.Fb.length?2:1)){a.zc++;var b={};b.id=a.Od;b.pw=a.Pd;b.ser=a.zc;for(var b=a.Pb(b),c="",d=0;0<a.Fb.length;)if(1870>=a.Fb[0].bd.length+30+c.length){var e=a.Fb.shift(),c=c+"&seg"+d+"="+e.Yd+"&ts"+d+"="+e.be+"&d"+d+"="+e.bd;d++}else break;Sc(a,b+c,a.zc);return!0}return!1}function Sc(a,b,c){function d(){a.Nc.remove(c);Pc(a)}a.Nc.add(c);var e=setTimeout(d,Math.floor(25E3));Oc(a,b,function(){clearTimeout(e);d()})}
function Oc(a,b,c){setTimeout(function(){try{if(a.oc){var d=a.Z.Aa.createElement("script");d.type="text/javascript";d.async=!0;d.src=b;d.onload=d.onreadystatechange=function(){var a=d.readyState;a&&"loaded"!==a&&"complete"!==a||(d.onload=d.onreadystatechange=null,d.parentNode&&d.parentNode.removeChild(d),c())};d.onerror=function(){K("Long-poll script failed to load: "+b);a.oc=!1;a.close()};a.Z.Aa.body.appendChild(d)}}catch(e){}},Math.floor(1))};function Tc(a){Uc(this,a)}var Vc=[Jc,Q];function Uc(a,b){var c=Q&&Q.isAvailable(),d=c&&!(nb.kd||!0===nb.get("previous_websocket_failure"));b.ce&&(c||L("wss:// URL used, but browser isn't known to support websockets.  Trying anyway."),d=!0);if(d)a.Mb=[Q];else{var e=a.Mb=[];Vb(Vc,function(a,b){b&&b.isAvailable()&&e.push(b)})}}function Wc(a){if(0<a.Mb.length)return a.Mb[0];throw Error("No transports available");};function Xc(a,b,c,d,e,f){this.id=a;this.e=Mb("c:"+this.id+":");this.Lc=c;this.Ab=d;this.S=e;this.Kc=f;this.M=b;this.fc=[];this.Zc=0;this.yd=new Tc(b);this.ma=0;this.e("Connection created");Yc(this)}
function Yc(a){var b=Wc(a.yd);a.B=new b("c:"+a.id+":"+a.Zc++,a.M);a.Pc=b.responsesRequiredToBeHealthy||0;var c=Zc(a,a.B),d=$c(a,a.B);a.Nb=a.B;a.Kb=a.B;a.w=null;a.Oa=!1;setTimeout(function(){a.B&&a.B.open(c,d)},Math.floor(0));b=b.healthyTimeout||0;0<b&&(a.Vb=setTimeout(function(){a.Vb=null;a.Oa||(a.B&&102400<a.B.Ia?(a.e("Connection exceeded healthy timeout but has received "+a.B.Ia+" bytes.  Marking connection healthy."),a.Oa=!0,a.B.Xb()):a.B&&10240<a.B.Ja?a.e("Connection exceeded healthy timeout but has sent "+
a.B.Ja+" bytes.  Leaving connection alive."):(a.e("Closing unhealthy connection after timeout."),a.close()))},Math.floor(b)))}function $c(a,b){return function(c){b===a.B?(a.B=null,c||0!==a.ma?1===a.ma&&a.e("Realtime connection lost."):(a.e("Realtime connection failed."),"s-"===a.M.ga.substr(0,2)&&(nb.remove("host:"+a.M.host),a.M.ga=a.M.host)),a.close()):b===a.w?(a.e("Secondary connection lost."),c=a.w,a.w=null,a.Nb!==c&&a.Kb!==c||a.close()):a.e("closing an old connection")}}
function Zc(a,b){return function(c){if(2!=a.ma)if(b===a.Kb){var d=Tb("t",c);c=Tb("d",c);if("c"==d){if(d=Tb("t",c),"d"in c)if(c=c.d,"h"===d){var d=c.ts,e=c.v,f=c.h;a.pc=c.s;qb(a.M,f);0==a.ma&&(a.B.start(),ad(a,a.B,d),"5"!==e&&L("Protocol version mismatch detected"),c=a.yd,(c=1<c.Mb.length?c.Mb[1]:null)&&bd(a,c))}else if("n"===d){a.e("recvd end transmission on primary");a.Kb=a.w;for(c=0;c<a.fc.length;++c)a.dc(a.fc[c]);a.fc=[];cd(a)}else"s"===d?(a.e("Connection shutdown command received. Shutting down..."),
a.Kc&&(a.Kc(c),a.Kc=null),a.S=null,a.close()):"r"===d?(a.e("Reset packet received.  New host: "+c),qb(a.M,c),1===a.ma?a.close():(dd(a),Yc(a))):"e"===d?Nb("Server Error: "+c):"o"===d?(a.e("got pong on primary."),ed(a),fd(a)):Nb("Unknown control packet command: "+d)}else"d"==d&&a.dc(c)}else if(b===a.w)if(d=Tb("t",c),c=Tb("d",c),"c"==d)"t"in c&&(c=c.t,"a"===c?gd(a):"r"===c?(a.e("Got a reset on secondary, closing it"),a.w.close(),a.Nb!==a.w&&a.Kb!==a.w||a.close()):"o"===c&&(a.e("got pong on secondary."),
a.td--,gd(a)));else if("d"==d)a.fc.push(c);else throw Error("Unknown protocol layer: "+d);else a.e("message on old connection")}}Xc.prototype.ud=function(a){hd(this,{t:"d",d:a})};function cd(a){a.Nb===a.w&&a.Kb===a.w&&(a.e("cleaning up and promoting a connection: "+a.w.yc),a.B=a.w,a.w=null)}
function gd(a){0>=a.td?(a.e("Secondary connection is healthy."),a.Oa=!0,a.w.Xb(),a.w.start(),a.e("sending client ack on secondary"),a.w.send({t:"c",d:{t:"a",d:{}}}),a.e("Ending transmission on primary"),a.B.send({t:"c",d:{t:"n",d:{}}}),a.Nb=a.w,cd(a)):(a.e("sending ping on secondary."),a.w.send({t:"c",d:{t:"p",d:{}}}))}Xc.prototype.dc=function(a){ed(this);this.Lc(a)};function ed(a){a.Oa||(a.Pc--,0>=a.Pc&&(a.e("Primary connection is healthy."),a.Oa=!0,a.B.Xb()))}
function bd(a,b){a.w=new b("c:"+a.id+":"+a.Zc++,a.M,a.pc);a.td=b.responsesRequiredToBeHealthy||0;a.w.open(Zc(a,a.w),$c(a,a.w));setTimeout(function(){a.w&&(a.e("Timed out trying to upgrade."),a.w.close())},Math.floor(6E4))}function ad(a,b,c){a.e("Realtime connection established.");a.B=b;a.ma=1;a.Ab&&(a.Ab(c),a.Ab=null);0===a.Pc?(a.e("Primary connection is healthy."),a.Oa=!0):setTimeout(function(){fd(a)},Math.floor(5E3))}
function fd(a){a.Oa||1!==a.ma||(a.e("sending ping on primary."),hd(a,{t:"c",d:{t:"p",d:{}}}))}function hd(a,b){if(1!==a.ma)throw"Connection is not connected";a.Nb.send(b)}Xc.prototype.close=function(){2!==this.ma&&(this.e("Closing realtime connection."),this.ma=2,dd(this),this.S&&(this.S(),this.S=null))};function dd(a){a.e("Shutting down all connections");a.B&&(a.B.close(),a.B=null);a.w&&(a.w.close(),a.w=null);a.Vb&&(clearTimeout(a.Vb),a.Vb=null)};function id(a,b,c,d,e,f){this.id=jd++;this.e=Mb("p:"+this.id+":");this.Ta=!0;this.ha={};this.T=[];this.Cb=0;this.zb=[];this.R=!1;this.sa=1E3;this.Yb=3E5;this.ec=b||ba;this.cc=c||ba;this.yb=d||ba;this.Mc=e||ba;this.Dc=f||ba;this.M=a;this.Rc=null;this.Jb={};this.Xd=0;this.ub=this.Hc=null;kd(this,0);pc.qb().eb("visible",this.Sd,this);-1===a.host.indexOf("fblocal")&&qc.qb().eb("online",this.Rd,this)}var jd=0,ld=0;h=id.prototype;
h.Fa=function(a,b,c){var d=++this.Xd;a={r:d,a:a,b:b};this.e(u(a));v(this.R,"sendRequest_ call when we're not connected not allowed.");this.ka.ud(a);c&&(this.Jb[d]=c)};function md(a,b,c){var d=b.toString(),e=b.path().toString();a.ha[e]=a.ha[e]||{};v(!a.ha[e][d],"listen() called twice for same path/queryId.");a.ha[e][d]={gb:b.gb(),D:c};a.R&&nd(a,e,d,b.gb(),c)}
function nd(a,b,c,d,e){a.e("Listen on "+b+" for "+c);var f={p:b};d=tb(d,function(a){return Ka(a)});"{}"!==c&&(f.q=d);f.h=a.Dc(b);a.Fa("l",f,function(d){a.e("listen response",d);d=d.s;"ok"!==d&&od(a,b,c);e&&e(d)})}
h.lb=function(a,b,c){this.La={Fd:a,dd:!1,aa:b,Rb:c};this.e("Authenticating using credential: "+this.La);pd(this);if(!(b=40==a.length))a:{var d;try{var e=a.split(".");if(3!==e.length){b=!1;break a}var f;b:{try{if("undefined"!==typeof atob){f=atob(e[1]);break b}}catch(g){K("base64DecodeIfNativeSupport failed: ",g)}f=null}null!==f&&(d=ra(f))}catch(k){K("isAdminAuthToken_ failed",k)}b="object"===typeof d&&!0===wa(d,"admin")}b&&(this.e("Admin auth credential detected.  Reducing max reconnect time."),this.Yb=
3E4)};h.Ob=function(a){delete this.La;this.yb(!1);this.R&&this.Fa("unauth",{},function(b){a(b.s,b.d)})};function pd(a){var b=a.La;a.R&&b&&a.Fa("auth",{cred:b.Fd},function(c){var d=c.s;c=c.d||"error";"ok"!==d&&a.La===b&&delete a.La;a.yb("ok"===d);b.dd?"ok"!==d&&b.Rb&&b.Rb(d,c):(b.dd=!0,b.aa&&b.aa(d,c))})}function qd(a,b,c,d){b=b.toString();od(a,b,c)&&a.R&&rd(a,b,c,d)}function rd(a,b,c,d){a.e("Unlisten on "+b+" for "+c);b={p:b};d=tb(d,function(a){return Ka(a)});"{}"!==c&&(b.q=d);a.Fa("u",b)}
function sd(a,b,c,d){a.R?td(a,"o",b,c,d):a.zb.push({Oc:b,action:"o",data:c,D:d})}function ud(a,b,c,d){a.R?td(a,"om",b,c,d):a.zb.push({Oc:b,action:"om",data:c,D:d})}h.Jc=function(a,b){this.R?td(this,"oc",a,null,b):this.zb.push({Oc:a,action:"oc",data:null,D:b})};function td(a,b,c,d,e){c={p:c,d:d};a.e("onDisconnect "+b,c);a.Fa(b,c,function(a){e&&setTimeout(function(){e(a.s,a.d)},Math.floor(0))})}h.put=function(a,b,c,d){vd(this,"p",a,b,c,d)};function wd(a,b,c,d){vd(a,"m",b,c,d,void 0)}
function vd(a,b,c,d,e,f){c={p:c,d:d};m(f)&&(c.h=f);a.T.push({action:b,qd:c,D:e});a.Cb++;b=a.T.length-1;a.R&&xd(a,b)}function xd(a,b){var c=a.T[b].action,d=a.T[b].qd,e=a.T[b].D;a.T[b].Ud=a.R;a.Fa(c,d,function(d){a.e(c+" response",d);delete a.T[b];a.Cb--;0===a.Cb&&(a.T=[]);e&&e(d.s,d.d)})}
h.dc=function(a){if("r"in a){this.e("from server: "+u(a));var b=a.r,c=this.Jb[b];c&&(delete this.Jb[b],c(a.b))}else{if("error"in a)throw"A server-side error has occurred: "+a.error;"a"in a&&(b=a.a,c=a.b,this.e("handleServerMessage",b,c),"d"===b?this.ec(c.p,c.d,!1):"m"===b?this.ec(c.p,c.d,!0):"c"===b?yd(this,c.p,c.q):"ac"===b?(a=c.s,b=c.d,c=this.La,delete this.La,c&&c.Rb&&c.Rb(a,b),this.yb(!1)):"sd"===b?this.Rc?this.Rc(c):"msg"in c&&"undefined"!==typeof console&&console.log("FIREBASE: "+c.msg.replace("\n",
"\nFIREBASE: ")):Nb("Unrecognized action received from server: "+u(b)+"\nAre you using the latest client?"))}};h.Ab=function(a){this.e("connection ready");this.R=!0;this.ub=(new Date).getTime();this.Mc({serverTimeOffset:a-(new Date).getTime()});pd(this);for(var b in this.ha)for(var c in this.ha[b])a=this.ha[b][c],nd(this,b,c,a.gb,a.D);for(b=0;b<this.T.length;b++)this.T[b]&&xd(this,b);for(;this.zb.length;)b=this.zb.shift(),td(this,b.action,b.Oc,b.data,b.D);this.cc(!0)};
function kd(a,b){v(!a.ka,"Scheduling a connect when we're already connected/ing?");a.Ya&&clearTimeout(a.Ya);a.Ya=setTimeout(function(){a.Ya=null;zd(a)},Math.floor(b))}h.Sd=function(a){a&&!this.kb&&this.sa===this.Yb&&(this.e("Window became visible.  Reducing delay."),this.sa=1E3,this.ka||kd(this,0));this.kb=a};
h.Rd=function(a){a?(this.e("Browser went online.  Reconnecting."),this.sa=1E3,this.Ta=!0,this.ka||kd(this,0)):(this.e("Browser went offline.  Killing connection; don't reconnect."),this.Ta=!1,this.ka&&this.ka.close())};
h.md=function(){this.e("data client disconnected");this.R=!1;this.ka=null;for(var a=0;a<this.T.length;a++){var b=this.T[a];b&&"h"in b.qd&&b.Ud&&(b.D&&b.D("disconnect"),delete this.T[a],this.Cb--)}0===this.Cb&&(this.T=[]);if(this.Ta)this.kb?this.ub&&(3E4<(new Date).getTime()-this.ub&&(this.sa=1E3),this.ub=null):(this.e("Window isn't visible.  Delaying reconnect."),this.sa=this.Yb,this.Hc=(new Date).getTime()),a=Math.max(0,this.sa-((new Date).getTime()-this.Hc)),a*=Math.random(),this.e("Trying to reconnect in "+
a+"ms"),kd(this,a),this.sa=Math.min(this.Yb,1.3*this.sa);else for(var c in this.Jb)delete this.Jb[c];this.cc(!1)};function zd(a){if(a.Ta){a.e("Making a connection attempt");a.Hc=(new Date).getTime();a.ub=null;var b=q(a.dc,a),c=q(a.Ab,a),d=q(a.md,a),e=a.id+":"+ld++;a.ka=new Xc(e,a.M,b,c,d,function(b){L(b+" ("+a.M.toString()+")");a.Ta=!1})}}h.Ma=function(){this.Ta=!1;this.ka?this.ka.close():(this.Ya&&(clearTimeout(this.Ya),this.Ya=null),this.R&&this.md())};
h.ib=function(){this.Ta=!0;this.sa=1E3;this.R||kd(this,0)};function yd(a,b,c){c=c?tb(c,function(a){return La(a)}).join("$"):"{}";(a=od(a,b,c))&&a.D&&a.D("permission_denied")}function od(a,b,c){b=(new F(b)).toString();c||(c="{}");var d=a.ha[b][c];delete a.ha[b][c];return d};function Ad(){this.n=this.F=null}function Bd(a,b,c){if(b.f())a.F=c,a.n=null;else if(null!==a.F)a.F=a.F.ya(b,c);else{null==a.n&&(a.n=new Ic);var d=C(b);a.n.contains(d)||a.n.add(d,new Ad);a=a.n.get(d);b=Ma(b);Bd(a,b,c)}}function Cd(a,b){if(b.f())return a.F=null,a.n=null,!0;if(null!==a.F){if(a.F.O())return!1;var c=a.F;a.F=null;c.A(function(b,c){Bd(a,new F(b),c)});return Cd(a,b)}return null!==a.n?(c=C(b),b=Ma(b),a.n.contains(c)&&Cd(a.n.get(c),b)&&a.n.remove(c),a.n.f()?(a.n=null,!0):!1):!0}
function Dd(a,b,c){null!==a.F?c(b,a.F):a.A(function(a,e){var f=new F(b.toString()+"/"+a);Dd(e,f,c)})}Ad.prototype.A=function(a){null!==this.n&&R(this.n,function(b,c){a(b,c)})};function Ed(){this.$=M}function S(a,b){return a.$.K(b)}function T(a,b,c){a.$=a.$.ya(b,c)}Ed.prototype.toString=function(){return this.$.toString()};function Fd(){this.ta=new Ed;this.L=new Ed;this.oa=new Ed;this.Eb=new Qa}function Gd(a,b,c){T(a.ta,b,c);return Hd(a,b)}function Hd(a,b){for(var c=S(a.ta,b),d=S(a.L,b),e=I(a.Eb,b),f=!1,g=e;null!==g;){if(null!==g.j()){f=!0;break}g=g.parent()}if(f)return!1;c=Id(c,d,e);return c!==d?(T(a.L,b,c),!0):!1}function Id(a,b,c){if(c.f())return a;if(null!==c.j())return b;a=a||M;c.A(function(d){d=d.name();var e=a.N(d),f=b.N(d),g=I(c,d),e=Id(e,f,g);a=a.H(d,e)});return a}
Fd.prototype.set=function(a,b){var c=this,d=[];sb(b,function(a){var b=a.path;a=a.ra;var g=Hb();J(I(c.Eb,b),g);T(c.L,b,a);d.push({path:b,Zd:g})});return d};function Jd(a,b){sb(b,function(b){var d=b.Zd;b=I(a.Eb,b.path);var e=b.j();v(null!==e,"pendingPut should not be null.");e===d&&J(b,null)})};function Kd(a,b){return a&&"object"===typeof a?(v(".sv"in a,"Unexpected leaf node or priority contents"),b[a[".sv"]]):a}function Ld(a,b){var c=new Ad;Dd(a,new F(""),function(a,e){Bd(c,a,Md(e,b))});return c}function Md(a,b){var c=Kd(a.k(),b),d;if(a.O()){var e=Kd(a.j(),b);return e!==a.j()||c!==a.k()?new bc(e,c):a}d=a;c!==a.k()&&(d=d.Ha(c));a.A(function(a,c){var e=Md(c,b);e!==c&&(d=d.H(a,e))});return d};function Nd(){this.Za=[]}function Od(a,b){if(0!==b.length)for(var c=0;c<b.length;c++)a.Za.push(b[c])}Nd.prototype.Hb=function(){for(var a=0;a<this.Za.length;a++)if(this.Za[a]){var b=this.Za[a];this.Za[a]=null;Pd(b)}this.Za=[]};function Pd(a){var b=a.aa,c=a.vd,d=a.Gb;ac(function(){b(c,d)})};function U(a,b,c,d){this.type=a;this.ua=b;this.ba=c;this.Gb=d};function Qd(a){this.Q=a;this.pa=[];this.Ac=new Nd}function Rd(a,b,c,d,e){a.pa.push({type:b,aa:c,cancel:d,Y:e});d=[];var f=Sd(a.i);a.sb&&f.push(new U("value",a.i));for(var g=0;g<f.length;g++)if(f[g].type===b){var k=new E(a.Q.m,a.Q.path);f[g].ba&&(k=k.G(f[g].ba));d.push({aa:Xb(c,e),vd:new P(f[g].ua,k),Gb:f[g].Gb})}Od(a.Ac,d)}Qd.prototype.ic=function(a,b){b=this.jc(a,b);null!=b&&Td(this,b)};
function Td(a,b){for(var c=[],d=0;d<b.length;d++){var e=b[d],f=e.type,g=new E(a.Q.m,a.Q.path);b[d].ba&&(g=g.G(b[d].ba));g=new P(b[d].ua,g);"value"!==e.type||g.rb()?"value"!==e.type&&(f+=" "+g.name()):f+="("+g.V()+")";K(a.Q.m.u.id+": event:"+a.Q.path+":"+a.Q.Ra()+":"+f);for(f=0;f<a.pa.length;f++){var k=a.pa[f];b[d].type===k.type&&c.push({aa:Xb(k.aa,k.Y),vd:g,Gb:e.Gb})}}Od(a.Ac,c)}Qd.prototype.Hb=function(){this.Ac.Hb()};
function Sd(a){var b=[];if(!a.O()){var c=null;a.A(function(a,e){b.push(new U("child_added",e,a,c));c=a})}return b}function Ud(a){a.sb||(a.sb=!0,Td(a,[new U("value",a.i)]))};function Vd(a,b){Qd.call(this,a);this.i=b}ka(Vd,Qd);Vd.prototype.jc=function(a,b){this.i=a;this.sb&&null!=b&&b.push(new U("value",this.i));return b};Vd.prototype.pb=function(){return{}};function Wd(a,b){this.Tb=a;this.Ic=b}function Xd(a,b,c,d,e){var f=a.K(c),g=b.K(c);d=new Wd(d,e);e=Yd(d,c,f,g);g=!f.f()&&!g.f()&&f.k()!==g.k();if(e||g)for(f=c,c=e;null!==f.parent();){var k=a.K(f);e=b.K(f);var l=f.parent();if(!d.Tb||I(d.Tb,l).j()){var n=b.K(l),r=[],f=Na(f);k.f()?(k=n.fa(f,e),r.push(new U("child_added",e,f,k))):e.f()?r.push(new U("child_removed",k,f)):(k=n.fa(f,e),g&&r.push(new U("child_moved",e,f,k)),c&&r.push(new U("child_changed",e,f,k)));d.Ic(l,n,r)}g&&(g=!1,c=!0);f=l}}
function Yd(a,b,c,d){var e,f=[];c===d?e=!1:c.O()&&d.O()?e=c.j()!==d.j():c.O()?(Zd(a,b,M,d,f),e=!0):d.O()?(Zd(a,b,c,M,f),e=!0):e=Zd(a,b,c,d,f);e?a.Ic(b,d,f):c.k()!==d.k()&&a.Ic(b,d,null);return e}
function Zd(a,b,c,d,e){var f=!1,g=!a.Tb||!I(a.Tb,b).f(),k=[],l=[],n=[],r=[],t={},s={},w,V,G,H;w=c.$a();G=Za(w);V=d.$a();for(H=Za(V);null!==G||null!==H;){c=H;c=null===G?1:null===c?-1:G.key===c.key?0:dc({name:G.key,ja:G.value.k()},{name:c.key,ja:c.value.k()});if(0>c)f=wa(t,G.key),m(f)?(n.push({Cc:G,Wc:k[f]}),k[f]=null):(s[G.key]=l.length,l.push(G)),f=!0,G=Za(w);else{if(0<c)f=wa(s,H.key),m(f)?(n.push({Cc:l[f],Wc:H}),l[f]=null):(t[H.key]=k.length,k.push(H)),f=!0;else{c=b.G(H.key);if(c=Yd(a,c,G.value,
H.value))r.push(H),f=!0;G.value.k()!==H.value.k()&&(n.push({Cc:G,Wc:H}),f=!0);G=Za(w)}H=Za(V)}if(!g&&f)return!0}for(g=0;g<l.length;g++)if(t=l[g])c=b.G(t.key),Yd(a,c,t.value,M),e.push(new U("child_removed",t.value,t.key));for(g=0;g<k.length;g++)if(t=k[g])c=b.G(t.key),l=d.fa(t.key,t.value),Yd(a,c,M,t.value),e.push(new U("child_added",t.value,t.key,l));for(g=0;g<n.length;g++)t=n[g].Cc,k=n[g].Wc,c=b.G(k.key),l=d.fa(k.key,k.value),e.push(new U("child_moved",k.value,k.key,l)),(c=Yd(a,c,t.value,k.value))&&
r.push(k);for(g=0;g<r.length;g++)a=r[g],l=d.fa(a.key,a.value),e.push(new U("child_changed",a.value,a.key,l));return f};function $d(){this.X=this.xa=null;this.set={}}ka($d,Ic);h=$d.prototype;h.setActive=function(a){this.xa=a};function ae(a,b,c){a.add(b,c);a.X||(a.X=c.Q.path)}function be(a){var b=a.xa;a.xa=null;return b}function ce(a){return a.contains("default")}function de(a){return null!=a.xa&&ce(a)}h.defaultView=function(){return ce(this)?this.get("default"):null};h.path=function(){return this.X};h.toString=function(){return tb(this.keys(),function(a){return"default"===a?"{}":a}).join("$")};
h.gb=function(){var a=[];R(this,function(b,c){a.push(c.Q)});return a};function ee(a,b){Qd.call(this,a);this.i=M;this.jc(b,Sd(b))}ka(ee,Qd);
ee.prototype.jc=function(a,b){if(null===b)return b;var c=[],d=this.Q;m(d.da)&&(m(d.wa)&&null!=d.wa?c.push(function(a,b){var c=Qb(b,d.da);return 0<c||0===c&&0<=Rb(a,d.wa)}):c.push(function(a,b){return 0<=Qb(b,d.da)}));m(d.Ba)&&(m(d.Xa)?c.push(function(a,b){var c=Qb(b,d.Ba);return 0>c||0===c&&0>=Rb(a,d.Xa)}):c.push(function(a,b){return 0>=Qb(b,d.Ba)}));var e=null,f=null;if(m(this.Q.Da))if(m(this.Q.da)){if(e=fe(a,c,this.Q.Da,!1)){var g=a.N(e).k();c.push(function(a,b){var c=Qb(b,g);return 0>c||0===c&&
0>=Rb(a,e)})}}else if(f=fe(a,c,this.Q.Da,!0)){var k=a.N(f).k();c.push(function(a,b){var c=Qb(b,k);return 0<c||0===c&&0<=Rb(a,f)})}for(var l=[],n=[],r=[],t=[],s=0;s<b.length;s++){var w=b[s].ba,V=b[s].ua;switch(b[s].type){case "child_added":ge(c,w,V)&&(this.i=this.i.H(w,V),n.push(b[s]));break;case "child_removed":this.i.N(w).f()||(this.i=this.i.H(w,null),l.push(b[s]));break;case "child_changed":!this.i.N(w).f()&&ge(c,w,V)&&(this.i=this.i.H(w,V),t.push(b[s]));break;case "child_moved":var G=!this.i.N(w).f(),
H=ge(c,w,V);G?H?(this.i=this.i.H(w,V),r.push(b[s])):(l.push(new U("child_removed",this.i.N(w),w)),this.i=this.i.H(w,null)):H&&(this.i=this.i.H(w,V),n.push(b[s]))}}var Qc=e||f;if(Qc){var Rc=(s=null!==f)?this.i.ed():this.i.gd(),hc=!1,ab=!1,bb=this;(s?a.Bc:a.A).call(a,function(a,b){ab||null!==Rc||(ab=!0);if(ab&&hc)return!0;hc?(l.push(new U("child_removed",bb.i.N(a),a)),bb.i=bb.i.H(a,null)):ab&&(n.push(new U("child_added",b,a)),bb.i=bb.i.H(a,b));Rc===a&&(ab=!0);a===Qc&&(hc=!0)})}for(s=0;s<n.length;s++)c=
n[s],w=this.i.fa(c.ba,c.ua),l.push(new U("child_added",c.ua,c.ba,w));for(s=0;s<r.length;s++)c=r[s],w=this.i.fa(c.ba,c.ua),l.push(new U("child_moved",c.ua,c.ba,w));for(s=0;s<t.length;s++)c=t[s],w=this.i.fa(c.ba,c.ua),l.push(new U("child_changed",c.ua,c.ba,w));this.sb&&0<l.length&&l.push(new U("value",this.i));return l};function fe(a,b,c,d){if(a.O())return null;var e=null;(d?a.Bc:a.A).call(a,function(a,d){if(ge(b,a,d)&&(e=a,c--,0===c))return!0});return e}
function ge(a,b,c){for(var d=0;d<a.length;d++)if(!a[d](b,c.k()))return!1;return!0}ee.prototype.Ec=function(a){return this.i.N(a)!==M};
ee.prototype.pb=function(a,b,c){var d={};this.i.O()||this.i.A(function(a){d[a]=3});var e=this.i;c=S(c,new F(""));var f=new Qa;J(I(f,this.Q.path),!0);b=M.ya(a,b);var g=this;Xd(c,b,a,f,function(a,b,c){null!==c&&a.toString()===g.Q.path.toString()&&g.jc(b,c)});this.i.O()?Wb(d,function(a,b){d[b]=2}):(this.i.A(function(a){A(d,a)||(d[a]=1)}),Wb(d,function(a,b){g.i.N(b).f()&&(d[b]=2)}));this.i=e;return d};function he(a,b){this.u=a;this.g=b;this.bc=b.$;this.na=new Qa}he.prototype.Qb=function(a,b,c,d,e){var f=a.path,g=I(this.na,f),k=g.j();null===k?(k=new $d,J(g,k)):v(!k.f(),"We shouldn't be storing empty QueryMaps");var l=a.Ra();if(k.contains(l))a=k.get(l),Rd(a,b,c,d,e);else{var n=this.g.$.K(f);a=ie(a,n);je(this,g,k,l,a);Rd(a,b,c,d,e);(b=(b=Ta(I(this.na,f),function(a){var b;if(b=a.j()&&a.j().defaultView())b=a.j().defaultView().sb;if(b)return!0},!0))||null===this.u&&!S(this.g,f).f())&&Ud(a)}a.Hb()};
function ke(a,b,c,d,e){var f=a.get(b),g;if(g=f){g=!1;for(var k=f.pa.length-1;0<=k;k--){var l=f.pa[k];if(!(c&&l.type!==c||d&&l.aa!==d||e&&l.Y!==e)&&(f.pa.splice(k,1),g=!0,c&&d))break}}(c=g&&!(0<f.pa.length))&&a.remove(b);return c}function le(a,b,c,d,e){b=b?b.Ra():null;var f=[];b&&"default"!==b?ke(a,b,c,d,e)&&f.push(b):sb(a.keys(),function(b){ke(a,b,c,d,e)&&f.push(b)});return f}he.prototype.lc=function(a,b,c,d){var e=I(this.na,a.path).j();return null===e?null:me(this,e,a,b,c,d)};
function me(a,b,c,d,e,f){var g=b.path(),g=I(a.na,g);c=le(b,c,d,e,f);b.f()&&J(g,null);d=ne(g);if(0<c.length&&!d){d=g;e=g.parent();for(c=!1;!c&&e;){if(f=e.j()){v(!de(f));var k=d.name(),l=!1;R(f,function(a,b){l=b.Ec(k)||l});l&&(c=!0)}d=e;e=e.parent()}d=null;de(b)||(b=be(b),d=oe(a,g),b&&b());return c?null:d}return null}function pe(a,b,c){Sa(I(a.na,b),function(a){(a=a.j())&&R(a,function(a,b){Ud(b)})},c,!0)}
function W(a,b,c){function d(a){do{if(g[a.toString()])return!0;a=a.parent()}while(null!==a);return!1}var e=a.bc,f=a.g.$;a.bc=f;for(var g={},k=0;k<c.length;k++)g[c[k].toString()]=!0;Xd(e,f,b,a.na,function(c,e,f){if(b.contains(c)){var g=d(c);g&&pe(a,c,!1);a.ic(c,e,f);g&&pe(a,c,!0)}else a.ic(c,e,f)});d(b)&&pe(a,b,!0);qe(a,b)}function qe(a,b){var c=I(a.na,b);Sa(c,function(a){(a=a.j())&&R(a,function(a,b){b.Hb()})},!0,!0);Ta(c,function(a){(a=a.j())&&R(a,function(a,b){b.Hb()})},!1)}
he.prototype.ic=function(a,b,c){a=I(this.na,a).j();null!==a&&R(a,function(a,e){e.ic(b,c)})};function ne(a){return Ta(a,function(a){return a.j()&&de(a.j())})}function je(a,b,c,d,e){if(de(c)||ne(b))ae(c,d,e);else{var f,g;c.f()||(f=c.toString(),g=c.gb());ae(c,d,e);c.setActive(re(a,c));f&&g&&qd(a.u,c.path(),f,g)}de(c)&&Sa(b,function(a){if(a=a.j())a.xa&&a.xa(),a.xa=null})}
function oe(a,b){function c(b){var f=b.j();if(f&&ce(f))d.push(f.path()),null==f.xa&&f.setActive(re(a,f));else{if(f){null!=f.xa||f.setActive(re(a,f));var g={};R(f,function(a,b){b.i.A(function(a){A(g,a)||(g[a]=!0,a=f.path().G(a),d.push(a))})})}b.A(c)}}var d=[];c(b);return d}
function re(a,b){if(a.u){var c=a.u,d=b.path(),e=b.toString(),f=b.gb(),g,k=b.keys(),l=ce(b);md(a.u,b,function(c){"ok"!==c?(c=Zb(c),L("on() or once() for "+b.path().toString()+" failed: "+c.toString()),se(a,b,c)):g||(l?pe(a,b.path(),!0):sb(k,function(a){(a=b.get(a))&&Ud(a)}),qe(a,b.path()))});return function(){g=!0;qd(c,d,e,f)}}return ba}function se(a,b,c){b&&(R(b,function(a,b){for(var f=0;f<b.pa.length;f++){var g=b.pa[f];g.cancel&&Xb(g.cancel,g.Y)(c)}}),me(a,b))}
function ie(a,b){return"default"===a.Ra()?new Vd(a,b):new ee(a,b)}he.prototype.pb=function(a,b,c,d){function e(a){Wb(a,function(a,b){f[b]=3===a?3:(wa(f,b)||a)===a?a:3})}var f={};R(b,function(b,f){e(f.pb(a,c,d))});c.O()||c.A(function(a){A(f,a)||(f[a]=4)});return f};function te(a,b,c,d,e){var f=b.path();b=a.pb(f,b,d,e);var g=M,k=[];Wb(b,function(b,n){var r=new F(n);3===b||1===b?g=g.H(n,d.K(r)):(2===b&&k.push({path:f.G(n),ra:M}),k=k.concat(ue(a,d.K(r),I(c,r),e)))});return[{path:f,ra:g}].concat(k)}
function ve(a,b,c,d){var e;a:{var f=I(a.na,b);e=f.parent();for(var g=[];null!==e;){var k=e.j();if(null!==k){if(ce(k)){e=[{path:b,ra:c}];break a}k=a.pb(b,k,c,d);f=wa(k,f.name());if(3===f||1===f){e=[{path:b,ra:c}];break a}2===f&&g.push({path:b,ra:M})}f=e;e=e.parent()}e=g}if(1==e.length&&(!e[0].ra.f()||c.f()))return e;g=I(a.na,b);f=g.j();null!==f?ce(f)?e.push({path:b,ra:c}):e=e.concat(te(a,f,g,c,d)):e=e.concat(ue(a,c,g,d));return e}
function ue(a,b,c,d){var e=c.j();if(null!==e)return ce(e)?[{path:c.path(),ra:b}]:te(a,e,c,b,d);var f=[];c.A(function(c){var e=b.O()?M:b.N(c.name());c=ue(a,e,c,d);f=f.concat(c)});return f};function we(a){this.M=a;this.ea=zc(a);this.u=new id(this.M,q(this.ec,this),q(this.cc,this),q(this.yb,this),q(this.Mc,this),q(this.Dc,this));this.xd=Ac(a,q(function(){return new wc(this.ea,this.u)},this));this.Ua=new Qa;this.Ga=new Ed;this.g=new Fd;this.I=new he(this.u,this.g.oa);this.Fc=new Ed;this.Gc=new he(null,this.Fc);xe(this,"connected",!1);xe(this,"authenticated",!1);this.S=new Ad;this.Sb=0}h=we.prototype;h.toString=function(){return(this.M.nc?"https://":"http://")+this.M.host};h.name=function(){return this.M.Zb};
function ye(a){a=S(a.Fc,new F(".info/serverTimeOffset")).V()||0;return(new Date).getTime()+a}function ze(a){a=a={timestamp:ye(a)};a.timestamp=a.timestamp||(new Date).getTime();return a}
h.ec=function(a,b,c){this.Sb++;this.jd&&(b=this.jd(a,b));var d,e,f=[];9<=a.length&&a.lastIndexOf(".priority")===a.length-9?(d=new F(a.substring(0,a.length-9)),e=S(this.g.ta,d).Ha(b),f.push(d)):c?(d=new F(a),e=S(this.g.ta,d),Wb(b,function(a,b){var c=new F(b);".priority"===b?e=e.Ha(a):(e=e.ya(c,O(a)),f.push(d.G(b)))})):(d=new F(a),e=O(b),f.push(d));a=ve(this.I,d,e,this.g.L);b=!1;for(c=0;c<a.length;++c){var g=a[c];b=Gd(this.g,g.path,g.ra)||b}b&&(d=Ae(this,d));W(this.I,d,f)};
h.cc=function(a){xe(this,"connected",a);!1===a&&Be(this)};h.Mc=function(a){var b=this;Vb(a,function(a,d){xe(b,d,a)})};h.Dc=function(a){a=new F(a);return S(this.g.ta,a).hash()};h.yb=function(a){xe(this,"authenticated",a)};function xe(a,b,c){b=new F("/.info/"+b);T(a.Fc,b,O(c));W(a.Gc,b,[b])}
h.lb=function(a,b,c){"firebaseio-demo.com"===this.M.domain&&L("FirebaseRef.auth() not supported on demo (*.firebaseio-demo.com) Firebases. Please use on production (*.firebaseio.com) Firebases only.");this.u.lb(a,function(a,c){X(b,a,c)},function(a,b){L("auth() was canceled: "+b);if(c){var f=Error(b);f.code=a.toUpperCase();c(f)}})};h.Ob=function(a){this.u.Ob(function(b,c){X(a,b,c)})};
h.jb=function(a,b,c,d){this.e("set",{path:a.toString(),value:b,ja:c});var e=ze(this);b=O(b,c);var e=Md(b,e),e=ve(this.I,a,e,this.g.L),f=this.g.set(a,e),g=this;this.u.put(a.toString(),b.V(!0),function(b,c){"ok"!==b&&L("set at "+a+" failed: "+b);Jd(g.g,f);Hd(g.g,a);var e=Ae(g,a);W(g.I,e,[]);X(d,b,c)});e=Ce(this,a);Ae(this,e);W(this.I,e,[a])};
h.update=function(a,b,c){this.e("update",{path:a.toString(),value:b});var d=S(this.g.oa,a),e=!0,f=[],g=ze(this),k=[],l;for(l in b){var e=!1,n=O(b[l]),n=Md(n,g),d=d.H(l,n),r=a.G(l);f.push(r);n=ve(this.I,r,n,this.g.L);k=k.concat(this.g.set(a,n))}if(e)K("update() called with empty data.  Don't do anything."),X(c,"ok");else{var t=this;wd(this.u,a.toString(),b,function(b,d){"ok"!==b&&L("update at "+a+" failed: "+b);Jd(t.g,k);Hd(t.g,a);var e=Ae(t,a);W(t.I,e,[]);X(c,b,d)});b=Ce(this,a);Ae(this,b);W(t.I,
b,f)}};h.Sc=function(a,b,c){this.e("setPriority",{path:a.toString(),ja:b});var d=ze(this),d=Kd(b,d),d=S(this.g.L,a).Ha(d),d=ve(this.I,a,d,this.g.L),e=this.g.set(a,d),f=this;this.u.put(a.toString()+"/.priority",b,function(b,d){"permission_denied"===b&&L("setPriority at "+a+" failed: "+b);Jd(f.g,e);Hd(f.g,a);var l=Ae(f,a);W(f.I,l,[]);X(c,b,d)});b=Ae(this,a);W(f.I,b,[])};
function Be(a){a.e("onDisconnectEvents");var b=[],c=ze(a);Dd(Ld(a.S,c),new F(""),function(c,e){var f=ve(a.I,c,e,a.g.L);b.push.apply(b,a.g.set(c,f));f=Ce(a,c);Ae(a,f);W(a.I,f,[c])});Jd(a.g,b);a.S=new Ad}h.Jc=function(a,b){var c=this;this.u.Jc(a.toString(),function(d,e){"ok"===d&&Cd(c.S,a);X(b,d,e)})};function De(a,b,c,d){var e=O(c);sd(a.u,b.toString(),e.V(!0),function(c,g){"ok"===c&&Bd(a.S,b,e);X(d,c,g)})}
function Ee(a,b,c,d,e){var f=O(c,d);sd(a.u,b.toString(),f.V(!0),function(c,d){"ok"===c&&Bd(a.S,b,f);X(e,c,d)})}function Fe(a,b,c,d){var e=!0,f;for(f in c)e=!1;e?(K("onDisconnect().update() called with empty data.  Don't do anything."),X(d,"ok")):ud(a.u,b.toString(),c,function(e,f){if("ok"===e)for(var l in c){var n=O(c[l]);Bd(a.S,b.G(l),n)}X(d,e,f)})}function Ge(a){uc(a.ea,"deprecated_on_disconnect");a.xd.Vc.deprecated_on_disconnect=!0}
h.Qb=function(a,b,c,d,e){".info"===C(a.path)?this.Gc.Qb(a,b,c,d,e):this.I.Qb(a,b,c,d,e)};h.lc=function(a,b,c,d){if(".info"===C(a.path))this.Gc.lc(a,b,c,d);else{b=this.I.lc(a,b,c,d);if(c=null!==b){c=this.g;d=a.path;for(var e=[],f=0;f<b.length;++f)e[f]=S(c.ta,b[f]);T(c.ta,d,M);for(f=0;f<b.length;++f)T(c.ta,b[f],e[f]);c=Hd(c,d)}c&&(v(this.g.oa.$===this.I.bc,"We should have raised any outstanding events by now.  Else, we'll blow them away."),T(this.g.oa,a.path,S(this.g.L,a.path)),this.I.bc=this.g.oa.$)}};
h.Ma=function(){this.u.Ma()};h.ib=function(){this.u.ib()};h.Tc=function(a){if("undefined"!==typeof console){a?(this.qc||(this.qc=new vc(this.ea)),a=this.qc.get()):a=this.ea.get();var b=ub(rc(a),function(a,b){return Math.max(b.length,a)},0),c;for(c in a){for(var d=a[c],e=c.length;e<b+2;e++)c+=" ";console.log(c+d)}}};h.Uc=function(a){uc(this.ea,a);this.xd.Vc[a]=!0};h.e=function(){K("r:"+this.u.id+":",arguments)};
function X(a,b,c){a&&ac(function(){if("ok"==b)a(null,c);else{var d=(b||"error").toUpperCase(),e=d;c&&(e+=": "+c);e=Error(e);e.code=d;a(e)}})};function He(a,b,c,d,e){function f(){}a.e("transaction on "+b);var g=new E(a,b);g.eb("value",f);c={path:b,update:c,D:d,status:null,nd:Hb(),vc:e,sd:0,sc:function(){g.xb("value",f)},tc:null};a.Ga.$=Ie(a,a.Ga.$,a.g.L.$,a.Ua);d=c.update(S(a.Ga,b).V());if(m(d)){Ba("transaction failed: Data returned ",d);c.status=1;e=I(a.Ua,b);var k=e.j()||[];k.push(c);J(e,k);k="object"===typeof d&&null!==d&&A(d,".priority")?d[".priority"]:S(a.g.L,b).k();e=ze(a);d=O(d,k);d=Md(d,e);T(a.Ga,b,d);c.vc&&(T(a.g.oa,b,d),W(a.I,
b,[b]));Je(a)}else c.sc(),c.D&&(a=Ke(a,b),c.D(null,!1,a))}function Je(a,b){var c=b||a.Ua;b||Le(a,c);if(null!==c.j()){var d=Me(a,c);v(0<d.length);vb(d,function(a){return 1===a.status})&&Ne(a,c.path(),d)}else c.rb()&&c.A(function(b){Je(a,b)})}
function Ne(a,b,c){for(var d=0;d<c.length;d++)v(1===c[d].status,"tryToSendTransactionQueue_: items in queue should all be run."),c[d].status=2,c[d].sd++;var e=S(a.g.L,b).hash();T(a.g.L,b,S(a.g.oa,b));for(var f=S(a.Ga,b).V(!0),g=Hb(),k=Oe(c),d=0;d<k.length;d++)J(I(a.g.Eb,k[d]),g);a.u.put(b.toString(),f,function(e){a.e("transaction put response",{path:b.toString(),status:e});for(d=0;d<k.length;d++){var f=I(a.g.Eb,k[d]),r=f.j();v(null!==r,"sendTransactionQueue_: pendingPut should not be null.");r===
g&&(J(f,null),T(a.g.L,k[d],S(a.g.ta,k[d])))}if("ok"===e){e=[];for(d=0;d<c.length;d++)c[d].status=3,c[d].D&&(f=Ke(a,c[d].path),e.push(q(c[d].D,null,null,!0,f))),c[d].sc();Le(a,I(a.Ua,b));Je(a);for(d=0;d<e.length;d++)ac(e[d])}else{if("datastale"===e)for(d=0;d<c.length;d++)c[d].status=4===c[d].status?5:1;else for(L("transaction at "+b+" failed: "+e),d=0;d<c.length;d++)c[d].status=5,c[d].tc=e;e=Ae(a,b);W(a.I,e,[b])}},e)}
function Oe(a){for(var b={},c=0;c<a.length;c++)a[c].vc&&(b[a[c].path.toString()]=a[c].path);a=[];for(var d in b)a.push(b[d]);return a}
function Ae(a,b){var c=Pe(a,b),d=c.path(),c=Me(a,c);T(a.g.oa,d,S(a.g.L,d));T(a.Ga,d,S(a.g.L,d));if(0!==c.length){for(var e=S(a.g.oa,d),f=e,g=[],k=0;k<c.length;k++){var l=Oa(d,c[k].path),n=!1,r;v(null!==l,"rerunTransactionsUnderNode_: relativePath should not be null.");if(5===c[k].status)n=!0,r=c[k].tc;else if(1===c[k].status)if(25<=c[k].sd)n=!0,r="maxretry";else{var t=e.K(l),s=c[k].update(t.V());if(m(s)){Ba("transaction failed: Data returned ",s);var w=O(s);"object"===typeof s&&null!=s&&A(s,".priority")||
(w=w.Ha(t.k()));e=e.ya(l,w);c[k].vc&&(f=f.ya(l,w))}else n=!0,r="nodata"}n&&(c[k].status=3,setTimeout(c[k].sc,Math.floor(0)),c[k].D&&(n=new E(a,c[k].path),l=new P(e.K(l),n),"nodata"===r?g.push(q(c[k].D,null,null,!1,l)):g.push(q(c[k].D,null,Error(r),!1,l))))}T(a.Ga,d,e);T(a.g.oa,d,f);Le(a,a.Ua);for(k=0;k<g.length;k++)ac(g[k]);Je(a)}return d}function Pe(a,b){for(var c,d=a.Ua;null!==(c=C(b))&&null===d.j();)d=I(d,c),b=Ma(b);return d}
function Me(a,b){var c=[];Qe(a,b,c);c.sort(function(a,b){return a.nd-b.nd});return c}function Qe(a,b,c){var d=b.j();if(null!==d)for(var e=0;e<d.length;e++)c.push(d[e]);b.A(function(b){Qe(a,b,c)})}function Le(a,b){var c=b.j();if(c){for(var d=0,e=0;e<c.length;e++)3!==c[e].status&&(c[d]=c[e],d++);c.length=d;J(b,0<c.length?c:null)}b.A(function(b){Le(a,b)})}function Ce(a,b){var c=Pe(a,b).path(),d=I(a.Ua,b);Ta(d,function(a){Re(a)});Re(d);Sa(d,function(a){Re(a)});return c}
function Re(a){var b=a.j();if(null!==b){for(var c=[],d=-1,e=0;e<b.length;e++)4!==b[e].status&&(2===b[e].status?(v(d===e-1,"All SENT items should be at beginning of queue."),d=e,b[e].status=4,b[e].tc="set"):(v(1===b[e].status),b[e].sc(),b[e].D&&c.push(q(b[e].D,null,Error("set"),!1,null))));-1===d?J(a,null):b.length=d+1;for(e=0;e<c.length;e++)ac(c[e])}}function Ke(a,b){var c=new E(a,b);return new P(S(a.Ga,b),c)}
function Ie(a,b,c,d){if(d.f())return c;if(null!=d.j())return b;var e=c;d.A(function(d){var g=d.name(),k=new F(g);d=Ie(a,b.K(k),c.K(k),d);e=e.H(g,d)});return e};function Y(){this.hb={}}ca(Y);Y.prototype.Ma=function(){for(var a in this.hb)this.hb[a].Ma()};Y.prototype.interrupt=Y.prototype.Ma;Y.prototype.ib=function(){for(var a in this.hb)this.hb[a].ib()};Y.prototype.resume=Y.prototype.ib;var Z={Kd:function(a){var b=N.prototype.hash;N.prototype.hash=a;var c=bc.prototype.hash;bc.prototype.hash=a;return function(){N.prototype.hash=b;bc.prototype.hash=c}}};Z.hijackHash=Z.Kd;Z.Ra=function(a){return a.Ra()};Z.queryIdentifier=Z.Ra;Z.Nd=function(a){return a.m.u.ha};Z.listens=Z.Nd;Z.Vd=function(a){return a.m.u.ka};Z.refConnection=Z.Vd;Z.Ad=id;Z.DataConnection=Z.Ad;id.prototype.sendRequest=id.prototype.Fa;id.prototype.interrupt=id.prototype.Ma;Z.Bd=Xc;Z.RealTimeConnection=Z.Bd;
Xc.prototype.sendRequest=Xc.prototype.ud;Xc.prototype.close=Xc.prototype.close;Z.zd=pb;Z.ConnectionTarget=Z.zd;Z.Id=function(){Kc=Cc=!0};Z.forceLongPolling=Z.Id;Z.Jd=function(){Lc=!0};Z.forceWebSockets=Z.Jd;Z.ae=function(a,b){a.m.u.Rc=b};Z.setSecurityDebugCallback=Z.ae;Z.Tc=function(a,b){a.m.Tc(b)};Z.stats=Z.Tc;Z.Uc=function(a,b){a.m.Uc(b)};Z.statsIncrementCounter=Z.Uc;Z.Sb=function(a){return a.m.Sb};Z.dataUpdateCount=Z.Sb;Z.Ld=function(a,b){a.m.jd=b};Z.interceptServerData=Z.Ld;function $(a,b,c){this.Ib=a;this.X=b;this.Ea=c}$.prototype.cancel=function(a){x("Firebase.onDisconnect().cancel",0,1,arguments.length);z("Firebase.onDisconnect().cancel",1,a,!0);this.Ib.Jc(this.X,a)};$.prototype.cancel=$.prototype.cancel;$.prototype.remove=function(a){x("Firebase.onDisconnect().remove",0,1,arguments.length);B("Firebase.onDisconnect().remove",this.X);z("Firebase.onDisconnect().remove",1,a,!0);De(this.Ib,this.X,null,a)};$.prototype.remove=$.prototype.remove;
$.prototype.set=function(a,b){x("Firebase.onDisconnect().set",1,2,arguments.length);B("Firebase.onDisconnect().set",this.X);Aa("Firebase.onDisconnect().set",a,!1);z("Firebase.onDisconnect().set",2,b,!0);De(this.Ib,this.X,a,b)};$.prototype.set=$.prototype.set;
$.prototype.jb=function(a,b,c){x("Firebase.onDisconnect().setWithPriority",2,3,arguments.length);B("Firebase.onDisconnect().setWithPriority",this.X);Aa("Firebase.onDisconnect().setWithPriority",a,!1);Fa("Firebase.onDisconnect().setWithPriority",2,b,!1);z("Firebase.onDisconnect().setWithPriority",3,c,!0);if(".length"===this.Ea||".keys"===this.Ea)throw"Firebase.onDisconnect().setWithPriority failed: "+this.Ea+" is a read-only object.";Ee(this.Ib,this.X,a,b,c)};$.prototype.setWithPriority=$.prototype.jb;
$.prototype.update=function(a,b){x("Firebase.onDisconnect().update",1,2,arguments.length);B("Firebase.onDisconnect().update",this.X);if(ea(a)){for(var c={},d=0;d<a.length;++d)c[""+d]=a[d];a=c;L("Passing an Array to Firebase.onDisconnect().update() is deprecated. Use set() if you want to overwrite the existing data, or an Object with integer keys if you really do want to only update some of the children.")}Ea("Firebase.onDisconnect().update",a);z("Firebase.onDisconnect().update",2,b,!0);Fe(this.Ib,
this.X,a,b)};$.prototype.update=$.prototype.update;var Se=function(){var a=0,b=[];return function(c){var d=c===a;a=c;for(var e=Array(8),f=7;0<=f;f--)e[f]="-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz".charAt(c%64),c=Math.floor(c/64);v(0===c,"Cannot push at time == 0");c=e.join("");if(d){for(f=11;0<=f&&63===b[f];f--)b[f]=0;b[f]++}else for(f=0;12>f;f++)b[f]=Math.floor(64*Math.random());for(f=0;12>f;f++)c+="-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz".charAt(b[f]);v(20===c.length,"NextPushId: Length should be 20.");
return c}}();function E(a,b){var c,d;if(a instanceof we)c=a,d=b;else{x("new Firebase",1,2,arguments.length);var e=arguments[0];d=c="";var f=!0,g="";if(p(e)){var k=e.indexOf("//");if(0<=k)var l=e.substring(0,k-1),e=e.substring(k+2);k=e.indexOf("/");-1===k&&(k=e.length);c=e.substring(0,k);var e=e.substring(k+1),n=c.split(".");if(3==n.length){k=n[2].indexOf(":");f=0<=k?"https"===l||"wss"===l:!0;if("firebase"===n[1])Ob(c+" is no longer supported. Please use <YOUR FIREBASE>.firebaseio.com instead");else for(d=n[0],
g="",e=("/"+e).split("/"),k=0;k<e.length;k++)if(0<e[k].length){n=e[k];try{n=decodeURIComponent(n.replace(/\+/g," "))}catch(r){}g+="/"+n}d=d.toLowerCase()}else Ob("Cannot parse Firebase url. Please use https://<YOUR FIREBASE>.firebaseio.com")}f||"undefined"!==typeof window&&window.location&&window.location.protocol&&-1!==window.location.protocol.indexOf("https:")&&L("Insecure Firebase access from a secure page. Please use https in calls to new Firebase().");c=new pb(c,f,d,"ws"===l||"wss"===l);d=new F(g);
f=d.toString();!(l=!p(c.host)||0===c.host.length||!za(c.Zb))&&(l=0!==f.length)&&(f&&(f=f.replace(/^\/*\.info(\/|$)/,"/")),l=!(p(f)&&0!==f.length&&!ya.test(f)));if(l)throw Error(y("new Firebase",1,!1)+'must be a valid firebase URL and the path can\'t contain ".", "#", "$", "[", or "]".');if(b)if(b instanceof Y)f=b;else throw Error("Expected a valid Firebase.Context for second argument to new Firebase()");else f=Y.qb();l=c.toString();e=wa(f.hb,l);e||(e=new we(c),f.hb[l]=e);c=e}D.call(this,c,d)}
ka(E,D);var Te=E,Ue=["Firebase"],Ve=aa;Ue[0]in Ve||!Ve.execScript||Ve.execScript("var "+Ue[0]);for(var We;Ue.length&&(We=Ue.shift());)!Ue.length&&m(Te)?Ve[We]=Te:Ve=Ve[We]?Ve[We]:Ve[We]={};E.prototype.name=function(){x("Firebase.name",0,0,arguments.length);return this.path.f()?null:Na(this.path)};E.prototype.name=E.prototype.name;
E.prototype.G=function(a){x("Firebase.child",1,1,arguments.length);if(ga(a))a=String(a);else if(!(a instanceof F))if(null===C(this.path)){var b=a;b&&(b=b.replace(/^\/*\.info(\/|$)/,"/"));Ia("Firebase.child",b)}else Ia("Firebase.child",a);return new E(this.m,this.path.G(a))};E.prototype.child=E.prototype.G;E.prototype.parent=function(){x("Firebase.parent",0,0,arguments.length);var a=this.path.parent();return null===a?null:new E(this.m,a)};E.prototype.parent=E.prototype.parent;
E.prototype.root=function(){x("Firebase.ref",0,0,arguments.length);for(var a=this;null!==a.parent();)a=a.parent();return a};E.prototype.root=E.prototype.root;E.prototype.toString=function(){x("Firebase.toString",0,0,arguments.length);var a;if(null===this.parent())a=this.m.toString();else{a=this.parent().toString()+"/";var b=this.name();a+=encodeURIComponent(String(b))}return a};E.prototype.toString=E.prototype.toString;
E.prototype.set=function(a,b){x("Firebase.set",1,2,arguments.length);B("Firebase.set",this.path);Aa("Firebase.set",a,!1);z("Firebase.set",2,b,!0);this.m.jb(this.path,a,null,b)};E.prototype.set=E.prototype.set;
E.prototype.update=function(a,b){x("Firebase.update",1,2,arguments.length);B("Firebase.update",this.path);if(ea(a)){for(var c={},d=0;d<a.length;++d)c[""+d]=a[d];a=c;L("Passing an Array to Firebase.update() is deprecated. Use set() if you want to overwrite the existing data, or an Object with integer keys if you really do want to only update some of the children.")}Ea("Firebase.update",a);z("Firebase.update",2,b,!0);if(A(a,".priority"))throw Error("update() does not currently support updating .priority.");
this.m.update(this.path,a,b)};E.prototype.update=E.prototype.update;E.prototype.jb=function(a,b,c){x("Firebase.setWithPriority",2,3,arguments.length);B("Firebase.setWithPriority",this.path);Aa("Firebase.setWithPriority",a,!1);Fa("Firebase.setWithPriority",2,b,!1);z("Firebase.setWithPriority",3,c,!0);if(".length"===this.name()||".keys"===this.name())throw"Firebase.setWithPriority failed: "+this.name()+" is a read-only object.";this.m.jb(this.path,a,b,c)};E.prototype.setWithPriority=E.prototype.jb;
E.prototype.remove=function(a){x("Firebase.remove",0,1,arguments.length);B("Firebase.remove",this.path);z("Firebase.remove",1,a,!0);this.set(null,a)};E.prototype.remove=E.prototype.remove;
E.prototype.transaction=function(a,b,c){x("Firebase.transaction",1,3,arguments.length);B("Firebase.transaction",this.path);z("Firebase.transaction",1,a,!1);z("Firebase.transaction",2,b,!0);if(m(c)&&"boolean"!=typeof c)throw Error(y("Firebase.transaction",3,!0)+"must be a boolean.");if(".length"===this.name()||".keys"===this.name())throw"Firebase.transaction failed: "+this.name()+" is a read-only object.";"undefined"===typeof c&&(c=!0);He(this.m,this.path,a,b,c)};E.prototype.transaction=E.prototype.transaction;
E.prototype.Sc=function(a,b){x("Firebase.setPriority",1,2,arguments.length);B("Firebase.setPriority",this.path);Fa("Firebase.setPriority",1,a,!1);z("Firebase.setPriority",2,b,!0);this.m.Sc(this.path,a,b)};E.prototype.setPriority=E.prototype.Sc;E.prototype.push=function(a,b){x("Firebase.push",0,2,arguments.length);B("Firebase.push",this.path);Aa("Firebase.push",a,!0);z("Firebase.push",2,b,!0);var c=ye(this.m),c=Se(c),c=this.G(c);"undefined"!==typeof a&&null!==a&&c.set(a,b);return c};
E.prototype.push=E.prototype.push;E.prototype.ia=function(){return new $(this.m,this.path,this.name())};E.prototype.onDisconnect=E.prototype.ia;E.prototype.Wd=function(){L("FirebaseRef.removeOnDisconnect() being deprecated. Please use FirebaseRef.onDisconnect().remove() instead.");this.ia().remove();Ge(this.m)};E.prototype.removeOnDisconnect=E.prototype.Wd;
E.prototype.$d=function(a){L("FirebaseRef.setOnDisconnect(value) being deprecated. Please use FirebaseRef.onDisconnect().set(value) instead.");this.ia().set(a);Ge(this.m)};E.prototype.setOnDisconnect=E.prototype.$d;E.prototype.lb=function(a,b,c){x("Firebase.auth",1,3,arguments.length);if(!p(a))throw Error(y("Firebase.auth",1,!1)+"must be a valid credential (a string).");z("Firebase.auth",2,b,!0);z("Firebase.auth",3,b,!0);this.m.lb(a,b,c)};E.prototype.auth=E.prototype.lb;
E.prototype.Ob=function(a){x("Firebase.unauth",0,1,arguments.length);z("Firebase.unauth",1,a,!0);this.m.Ob(a)};E.prototype.unauth=E.prototype.Ob;E.goOffline=function(){x("Firebase.goOffline",0,0,arguments.length);Y.qb().Ma()};E.goOnline=function(){x("Firebase.goOnline",0,0,arguments.length);Y.qb().ib()};
function Lb(a,b){v(!b||!0===a||!1===a,"Can't turn on custom loggers persistently.");!0===a?("undefined"!==typeof console&&("function"===typeof console.log?Jb=q(console.log,console):"object"===typeof console.log&&(Jb=function(a){console.log(a)})),b&&ob.set("logging_enabled",!0)):a?Jb=a:(Jb=null,ob.remove("logging_enabled"))}E.enableLogging=Lb;E.ServerValue={TIMESTAMP:{".sv":"timestamp"}};E.SDK_VERSION="1.0.24";E.INTERNAL=Z;E.Context=Y;})();

},{}],3:[function(require,module,exports){
var recorder = require('./audioRecorder');
// var polykit = require('./identikit');
var dat = require("./../bower_components/dat.gui/dat.gui.js");

var startButton = document.querySelector('button#start');
var stopButton = document.querySelector('button#stop');

var cont = document.querySelector('div.polycontainer');

recorder.init();
recorder.start();

var timerDiv = document.querySelector('div.timer');

var interval;
var timeout;


var gui = new dat.GUI();
gui.close();

gui.add(recorder.analyser, "minDecibels").min(-90).max(0).step(1);
gui.add(recorder.analyser, "maxDecibels").min(-90).max(0).step(1);
gui.add(recorder.analyser, "smoothingTimeConstant").min(0.1).max(1).step(0.01);

gui.add(recorder.poly, "angleSpeed").min(0).max(0.1).step(0.001).listen();
gui.add(recorder.poly, "bgAlpha").min(0).max(0.01).step(0.0001).listen();
gui.add(recorder.poly, "inkAlpha").min(0).max(0.1).step(0.0001).listen();
gui.add(recorder.poly, "hueSpeed").min(0).max(1).step(0.001).listen();
gui.add(recorder.poly, "hue").min(0).max(360).step(1).listen();

window.gui = gui;

cont.onclick = function (argument) {
    clearInterval(interval);
    clearTimeout(timeout);
    recorder.polyRunning = true;
    var idx = 5 + (Math.random() * 5 | 0);
    var size = Math.pow(2, idx);
    console.log(idx, size)
    recorder.analyser.fftSize = size;
    recorder.poly.init();
    timeout = startTimer();
}

stopButton.onclick = function () {
    recorder.polyRunning = false;
}




function startTimer() {
    var count = 10;
    timerDiv.innerHTML = --count;

    timerDiv.style.display = null;

    interval = setInterval(function() {
        timerDiv.innerHTML = --count;
    }, 1000);


    return setTimeout(function() {
        timerDiv.innerHTML = --count;
        recorder.polyRunning = false;
        clearInterval(interval);
        timerDiv.style.display = 'none';
    }, 1000 * count);
}




},{"./../bower_components/dat.gui/dat.gui.js":1,"./audioRecorder":4}],4:[function(require,module,exports){

module.exports = {

    init: function() {

        // fork getUserMedia for multiple browser versions, for those
        // that need prefixes

        navigator.getUserMedia = (navigator.getUserMedia ||
                                  navigator.webkitGetUserMedia ||
                                  navigator.mozGetUserMedia ||
                                  navigator.msGetUserMedia);

        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        this.analyser = this.audioCtx.createAnalyser();

        // XXX fix up these constants
        this.analyser.minDecibels = -90;
        this.analyser.maxDecibels = -10;
        this.analyser.smoothingTimeConstant = 0.85;
        this.analyser.fftSize = 128;

        // setup a canvas for the audio display
        this.canvas = document.querySelector('canvas.visualiser');
        this.ctx = this.canvas.getContext("2d");

        this.identity = [];
        this.poly = require('./identikit');


    },

    // start processing the audio
    start: function() {

        // zero out the identity array
        for (var i = 0; i < this.analyser.frequencyBinCount; i++) {
            this.identity[i] = 0;
        }

        // reference
        var an = this;

        this.time = 0;

        this.poly.init();

        if (navigator.getUserMedia) {

            navigator.getUserMedia(

                { audio: true},
                // success callback
                function (stream) {

                    document.querySelector('p.mic').style.display = 'none';
                    document.querySelector('div.timer').style.display = 'block';

                    // create a handle to the stream;
                    an.stream = stream;
                    // plug it to the audiocontext
                    an.source = an.audioCtx.createMediaStreamSource(stream);
                    // and connect it to the analyser
                    an.source.connect(an.analyser);

                    // then call visualise
                    an.visualise();

                },
                // error callback
                function (err) {
                    console.error('Error ocurred with getUserMedia', err);
                }

            );

        } else {
            console.error('microphone not supported');
        }


    },

    visualise: function () {
        var W = this.canvas.width;
        var H = this.canvas.height;

        var bufferLength = this.analyser.frequencyBinCount;

        console.log(bufferLength);

        this.dataArray = new Uint8Array(bufferLength);

        this.drawVisual;
        var an = this;

        this.ctx.clearRect(0, 0, W, H);

        function draw() {
            an.drawVisual = requestAnimationFrame(draw);
            an.analyser.getByteFrequencyData(an.dataArray);
            // an.analyser.getByteTimeDomainData(an.dataArray);

            an.ctx.fillStyle = 'rgb(255,255,255)';
            an.ctx.fillRect(0, 0, W, H);

            var barWidth = (W / bufferLength);// * 2.5; /// why 2.5?

            var barHeight;
            var x = 0;

            for (var i = 0; i < bufferLength; i++) {
                barHeight = an.dataArray[i];

                an.ctx.fillStyle = 'rgba(40,' + (barHeight + 100) + ',' + barHeight + 100 + ', 0.3)';
                an.ctx.fillRect( x, H - barHeight/2, barWidth, barHeight/2);

                x += barWidth + 1;

                an.identity[i] += barHeight;

            }
            an.time++;

            an.runPoly();

        }

        draw();
    },

    runPoly: function() {

        if (!this.polyRunning) {
            return;
        }

        var averageSpectrum = this.calcAverageSpectrum();

        this.poly.createPolygon(this.dataArray);
    },

    calcAverageSpectrum : function() {
        var averageSpectrum = [];

        // normalize the identity
        for (var i = 0; i < this.identity.length; i++) {
            averageSpectrum[i] = this.identity[i] / this.time;
        }

        return averageSpectrum;
    },

    // stop processing the audio
    finish: function() {
        // XXX might break firefox
        if (this.stream.stop) {
            this.stream.stop();
        }

        cancelAnimationFrame(this.drawVisual);

        var W = this.canvas.width;
        var H = this.canvas.height;
        this.ctx.clearRect(0, 0, W, H);

        return this.calcAverageSpectrum();
    }


};
},{"./identikit":5}],5:[function(require,module,exports){
// annoyingly it sets Firebase to be a global.
require("./../bower_components/firebase/firebase.js");

var database = new Firebase('https://visual-identity.firebaseio.com/');

var imagesRef = database.child("images");

module.exports = {

    init: function (argument) {
        var canvas = document.querySelector('canvas.polygon');
        this.canvas = canvas;
        this.w = canvas.width;
        this.h = canvas.height;
        this.ctx = canvas.getContext("2d");
        this.ctx.clearRect(0, 0, this.w, this.h);

        this.saveButton = document.querySelector('button#save');

        this.saveButton.onclick = this.saveFlower.bind(this);

        this.initAngle = 0;
        this.angleSpeed = map_range(Math.random(), 0, 1, 0, 0.025);
        this.bgAlpha = 0.001;
        this.inkAlpha = 0.025;

        this.hueSpeed = map_range(Math.random(), 0, 1, 0, 0.5);

        this.hue = Math.random() * (2 * Math.PI) * (180/Math.PI);
    },

    createPolygon: function (spectrum) {
        var ctx = this.ctx;

        ctx.rect(0, 0, this.w, this.h);
        ctx.fillStyle = "rgba(255, 255, 255, " + this.bgAlpha + ")";
        ctx.fill();

        var angle = (2*Math.PI)/(spectrum.length - 1) * 2.5;
        var mid = (this.w) / 2;
        var maxV = max_val(spectrum);

        var currAngle = this.initAngle;//-Math.PI/2;
        var xPos, yPos;
        var val;

        var points = [];

        for (var i = 0; i < spectrum.length; i++) {

            val = map_range(spectrum[i], 0, maxV, 0, mid - 50);

            xPos = val * Math.sin(currAngle);
            yPos = val * Math.cos(currAngle);

            points.push([xPos, yPos]);

            currAngle -= angle;
        }

        ctx.save();
        ctx.translate(mid, mid);
        ctx.beginPath();
        // draw three points
        var p = points[0];

        // ctx.moveTo(p[0], p[1]);

        for (var i = 0; i < points.length; i++) {
            p = points[i];
            ctx.lineTo(p[0], p[1]);
        }

        ctx.closePath();

        this.hue += this.hueSpeed % 360;

        ctx.fillStyle = "hsla(" + this.hue + ", 100%, 50%, " + this.inkAlpha + ")";

        ctx.fill();

        // ctx.beginPath();
        // for (var i = 0; i < points.length; i++) {

        //     p = points[i];
        //     ctx.moveTo(0, 0)
        //     ctx.lineTo(p[0], p[1]);
        // }
        // ctx.strokeStyle = "rgb(255, 255, 0)";
        // ctx.stroke();

        ctx.restore();

        this.initAngle -= this.angleSpeed;
    },

    saveFlower: function () {

        var out = document.createElement('canvas');
        out.width = this.w;
        out.height = this.h;

        var outCtx = out.getContext("2d");
        // white BG
        outCtx.fillStyle ='rgb(255,255,255)';
        outCtx.rect(0, 0, this.w, this.h);
        outCtx.fill();
        outCtx.drawImage(this.canvas, 0, 0);

        var imgURI = out.toDataURL("image/png");
        window.open(imgURI);

        imagesRef.push({
            date: new Date().toISOString(),
            dataURI: imgURI
        });


    }

}


function map_range(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}


function max_val(array) {
    return Math.max.apply(Math, array);
}
},{"./../bower_components/firebase/firebase.js":2}]},{},[3,4,5])