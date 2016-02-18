/**
 * This plugin provides a method to display a tooltip at a specific event, e.g.
 * to display some node properties on node hover. Check the
 * sigma.plugins.tooltip function doc or the examples/tooltip.html code sample
 * to know more.
 */
(function() {
  'use strict';

  if (typeof sigma === 'undefined')
    throw new Error('sigma is not declared');

  // Initialize package:
  sigma.utils.pkg('sigma.plugins');

  /**
   * Sigma tooltip
   * =============================
   *
   * @author Sébastien Heymann <seb@linkurio.us> (Linkurious)
   * @version 0.3
   */

  var settings = {
    stage: {
      show: 'rightClickStage',
      hide: 'clickStage',
      cssClass: 'sigma-tooltip',
      position: 'top',    // top | bottom | left | right
      autoadjust: false,
      delay: 0,
      hideDelay: 0,
      template: '',       // HTML string
      renderer: null      // function
    },
    node: {
      show: 'clickNode',
      hide: 'clickStage',
      cssClass: 'sigma-tooltip',
      position: 'top',    // top | bottom | left | right
      autoadjust: false,
      delay: 0,
      hideDelay: 0,
      template: '',       // HTML string
      renderer: null      // function
    },
    edge: {
      show: 'clickEdge',
      hide: 'clickStage',
      cssClass: 'sigma-tooltip',
      position: 'top',    // top | bottom | left | right
      autoadjust: false,
      delay: 0,
      hideDelay: 0,
      template: '',       // HTML string
      renderer: null      // function
    },
    doubleClickDelay: 800
  };


  /**
   * This function will display a tooltip when a sigma event is fired. It will
   * basically create a DOM element, fill it with the template or the result of
   * the renderer function, set its position and CSS class, and insert the
   * element as a child of the sigma container. Only one tooltip may exist.
   *
   * Recognized parameters of options:
   * *********************************
   * Enable node tooltips by adding the "node" key to the options object.
   * Enable edge tooltips by adding the "edge" key to the options object.
   * Each value could be an array of objects for multiple tooltips,
   * or an object for one tooltip.
   * Here is the exhaustive list of every accepted parameter in these objects:
   *
   *   {?string}   show       The event that triggers the tooltip. Default
   *                          values: "clickNode", "clickEdge". Other suggested
   *                          values: "overNode", "doubleClickNode",
   *                          "rightClickNode", "hovers", "doubleClickEdge",
   *                          "rightClickEdge", "doubleClickNode",
   *                          "rightClickNode".
   *   {?string}   hide       The event that hides the tooltip. Default value:
   *                          "clickStage". Other suggested values: "hovers"
   *   {?string}   template   The HTML template. It is directly inserted inside
   *                          a div element unless a renderer is specified.
   *   {?function} renderer   This function may process the template or be used
   *                          independently. It should return an HTML string or
   *                          a DOM element. It is executed at runtime. Its
   *                          context is sigma.graph.
   *   {?string}   cssClass   The CSS class attached to the top div element.
   *                          Default value: "sigma-tooltip".
   *   {?string}   position   The position of the tooltip regarding the mouse.
   *                          If it is not specified, the tooltip top-left
   *                          corner is positionned at the mouse position.
   *                          Available values: "top", "bottom", "left",
   *                          "right".
   *   {?number}   delay      The delay in miliseconds before displaying the
   *                          tooltip after the show event is triggered.
   *   {?boolean}  autoadjust [EXPERIMENTAL] If true, tries to adjust the
   *                          tooltip position to be fully included in the body
   *                          area. Doesn't work on Firefox 30. Better work on
   *                          elements with fixed width and height.
   *
   * > sigma.plugins.tooltip(s, {
   * >   node: {
   * >     template: 'Hello node!'
   * >   },
   * >   edge: {
   * >     template: 'Hello edge!'
   * >   },
   * >   stage: {
   * >     template: 'Hello stage!'
   * >   }
   * > });
   *
   * @param {sigma}    s        The related sigma instance.
   * @param {renderer} renderer The related sigma renderer.
   * @param {object}   options  An object with options.
   */
  function Tooltips(s, renderer, options) {
    var self = this,
        _tooltip,
        _timeoutHandle,
        _timeoutHideHandle,
        _stageTooltips = [],
        _nodeTooltips = [],
        _edgeTooltips = [],
        _mouseOverTooltip = false,
        _doubleClick = false;

    if (Array.isArray(options.stage)) {
      for (var i = 0; i < options.stage.length; i++) {
        _stageTooltips.push(sigma.utils.extend(options.stage[i], settings.stage));
      }
    } else {
      _stageTooltips.push(sigma.utils.extend(options.stage, settings.stage));
    }

    if (Array.isArray(options.node)) {
      for (var i = 0; i < options.node.length; i++) {
        _nodeTooltips.push(sigma.utils.extend(options.node[i], settings.node));
      }
    } else {
      _nodeTooltips.push(sigma.utils.extend(options.node, settings.node));
    }

    if (Array.isArray(options.edge)) {
      for (var i = 0; i < options.edge.length; i++) {
        _edgeTooltips.push(sigma.utils.extend(options.edge[i], settings.edge));
      }
    } else {
      _edgeTooltips.push(sigma.utils.extend(options.edge, settings.edge));
    }

    sigma.classes.dispatcher.extend(this);

    s.bind('kill', function() {
      sigma.plugins.killTooltips(s);
    });

    function contextmenuListener(event) {
      event.preventDefault();
    };

    /**
     * This function removes the existing tooltip and creates a new tooltip for a
     * specified node or edge.
     *
     * @param {object}    o          The node or the edge.
     * @param {object}    options    The options related to the object.
     * @param {number}    x          The X coordinate of the mouse.
     * @param {number}    y          The Y coordinate of the mouse.
     * @param {function?} onComplete Optional function called when open finish
     */
    this.open = function(o, options, x, y, onComplete) {
      remove();

      // Create the DOM element:
      _tooltip = document.createElement('div');
      if (options.renderer) {
        // Copy the object:
        var clone = Object.create(null),
            tooltipRenderer,
            type,
            k;
        for (k in o)
          clone[k] = o[k];

        tooltipRenderer = options.renderer.call(s.graph, clone, options.template);

        type = typeof tooltipRenderer;

        if (type === 'undefined') return;

        if (type === 'string') {
           _tooltip.innerHTML = tooltipRenderer;
        }
        else {
          // tooltipRenderer is a dom element:
          _tooltip.appendChild(tooltipRenderer);
        }
      }
      else {
        _tooltip.innerHTML = options.template;
      }

      var containerPosition = window.getComputedStyle(renderer.container).position;

      if(containerPosition !== 'static') {
        _tooltip.style.position = 'absolute';
        var containerRect = renderer.container.getBoundingClientRect();
        x = ~~(x - containerRect.left);
        y = ~~(y - containerRect.top);
      }


      // Style it:
      _tooltip.className = options.cssClass;

      if (options.position !== 'css') {
        if(containerPosition === 'static') {
          _tooltip.style.position = 'absolute';
        }

        // Default position is mouse position:
        _tooltip.style.left = x + 'px';
        _tooltip.style.top = y + 'px';
      }

      _tooltip.addEventListener('mouseenter', function() {
        _mouseOverTooltip = true;
      }, false);

      _tooltip.addEventListener('mouseleave', function() {
        _mouseOverTooltip = false;
      }, false);

      // Execute after rendering:
      setTimeout(function() {
        if (!_tooltip)
          return;

        // Insert the element in the DOM:
        renderer.container.appendChild(_tooltip);

        // Find offset:
        var bodyRect = document.body.getBoundingClientRect(),
            tooltipRect = _tooltip.getBoundingClientRect(),
            offsetTop =  tooltipRect.top - bodyRect.top,
            offsetBottom = bodyRect.bottom - tooltipRect.bottom,
            offsetLeft =  tooltipRect.left - bodyRect.left,
            offsetRight = bodyRect.right - tooltipRect.right;

        if (options.position === 'top') {
          // New position vertically aligned and on top of the mouse:
          _tooltip.className = options.cssClass + ' top';
          _tooltip.style.left = x - (tooltipRect.width / 2) + 'px';
          _tooltip.style.top = y - tooltipRect.height + 'px';
        }
        else if (options.position === 'bottom') {
          // New position vertically aligned and on bottom of the mouse:
          _tooltip.className = options.cssClass + ' bottom';
          _tooltip.style.left = x - (tooltipRect.width / 2) + 'px';
          _tooltip.style.top = y + 'px';
        }
        else if (options.position === 'left') {
          // New position vertically aligned and on bottom of the mouse:
          _tooltip.className = options.cssClass+ ' left';
          _tooltip.style.left = x - tooltipRect.width + 'px';
          _tooltip.style.top = y - (tooltipRect.height / 2) + 'px';
        }
        else if (options.position === 'right') {
          // New position vertically aligned and on bottom of the mouse:
          _tooltip.className = options.cssClass + ' right';
          _tooltip.style.left = x + 'px';
          _tooltip.style.top = y - (tooltipRect.height / 2) + 'px';
        }

        // Adjust position to keep the tooltip inside body:
        // FIXME: doesn't work on Firefox
        if (options.autoadjust) {

          // Update offset
          tooltipRect = _tooltip.getBoundingClientRect();
          offsetTop = tooltipRect.top - bodyRect.top;
          offsetBottom = bodyRect.bottom - tooltipRect.bottom;
          offsetLeft = tooltipRect.left - bodyRect.left;
          offsetRight = bodyRect.right - tooltipRect.right;

          if (offsetBottom < 0) {
            _tooltip.className = options.cssClass;
            if (options.position === 'top' || options.position === 'bottom') {
              _tooltip.className = options.cssClass + ' top';
            }
            _tooltip.style.top = y - tooltipRect.height + 'px';
          }
          else if (offsetTop < 0) {
            _tooltip.className = options.cssClass;
            if (options.position === 'top' || options.position === 'bottom') {
              _tooltip.className = options.cssClass + ' bottom';
            }
            _tooltip.style.top = y + 'px';
          }
          if (offsetRight < 0) {
            //! incorrect tooltipRect.width on non fixed width element.
            _tooltip.className = options.cssClass;
            if (options.position === 'left' || options.position === 'right') {
              _tooltip.className = options.cssClass + ' left';
            }
            _tooltip.style.left = x - tooltipRect.width + 'px';
          }
          else if (offsetLeft < 0) {
            _tooltip.className = options.cssClass;
            if (options.position === 'left' || options.position === 'right') {
              _tooltip.className = options.cssClass + ' right';
            }
            _tooltip.style.left = x + 'px';
          }
        }
        if (onComplete) onComplete();
      }, 0);
    };

    /**
     * This function removes the tooltip element from the DOM.
     */
    function remove() {
      if (_tooltip && _tooltip.parentNode) {
        // Remove from the DOM:
        _tooltip.parentNode.removeChild(_tooltip);
        _tooltip = null;
      }
    };

    /**
     * This function clears all timeouts related to the tooltip
     * and removes the tooltip.
     */
    function cancel() {
      clearTimeout(_timeoutHandle);
      clearTimeout(_timeoutHideHandle);
      _timeoutHandle = false;
      _timeoutHideHandle = false;
      remove();
    };

    /**
     * Similar to cancel() but can be delayed.
     *
     * @param {number} delay. The delay in miliseconds.
     */
    function delayedCancel(delay) {
      clearTimeout(_timeoutHandle);
      clearTimeout(_timeoutHideHandle);
      _timeoutHandle = false;
      _timeoutHideHandle = setTimeout(function() {
        if (!_mouseOverTooltip) remove();
      }, delay);
    };

    // INTERFACE:
    this.close = function() {
      cancel();
      this.dispatchEvent('hidden');
      return this;
    };

    this.kill = function() {
      this.unbindEvents();
      clearTimeout(_timeoutHandle);
      clearTimeout(_timeoutHideHandle);
      _tooltip = null;
      _timeoutHandle = null;
      _timeoutHideHandle = null;
      _doubleClick = false;
      _stageTooltips = [];
      _nodeTooltips = [];
      _edgeTooltips = [];
    };

    this.unbindEvents = function() {
      var tooltips = _stageTooltips.concat(_nodeTooltips).concat(_edgeTooltips);

      for (var i = 0; i < tooltips.length; i++) {
        s.unbind(tooltips[i].show);
        s.unbind(tooltips[i].hide);

        if (tooltips[i].show === 'rightClickNode' || tooltips[i].show === 'rightClickEdge') {
          renderer.container.removeEventListener(
            'contextmenu',
            contextmenuListener
          );
        }
      }
      // Remove the default event handlers
      s.unbind('doubleClickStage');
      s.unbind('doubleClickNode');
      s.unbind('doubleClickEdge');
    };

    this.bindStageEvents = function(tooltip) {
      s.bind(tooltip.show, function(event) {
        if (tooltip.show !== 'doubleClickStage' && _doubleClick) {
          return;
        }

        var clientX = event.data.captor.clientX,
            clientY = event.data.captor.clientY;

        clearTimeout(_timeoutHandle);
        _timeoutHandle = setTimeout(function() {
          self.open(
            null,
            tooltip,
            clientX,
            clientY,
            self.dispatchEvent.bind(self,'shown', event.data));
        }, tooltip.delay);
      });

      s.bind(tooltip.hide, function(event) {
        var p = _tooltip;
        delayedCancel(settings.stage.hideDelay);
        if (p)
          self.dispatchEvent('hidden', event.data);
      });
    };

    this.bindNodeEvents = function(tooltip) {
      s.bind(tooltip.show, function(event) {
        if (tooltip.show !== 'doubleClickNode' && _doubleClick) {
          return;
        }

        var n = event.data.node;
        if (!n && event.data.enter) {
          n = event.data.enter.nodes[0];
        }
        if (n == undefined) return;

        var clientX = event.data.captor.clientX,
            clientY = event.data.captor.clientY;

        clearTimeout(_timeoutHandle);
        _timeoutHandle = setTimeout(function() {
          self.open(
            n,
            tooltip,
            clientX,
            clientY,
            self.dispatchEvent.bind(self,'shown', event.data));
        }, tooltip.delay);
      });

      s.bind(tooltip.hide, function(event) {
        if (event.data.leave && event.data.leave.nodes.length == 0)
          return
        var p = _tooltip;
        delayedCancel(settings.node.hideDelay);
        if (p)
          self.dispatchEvent('hidden', event.data);
      });
    };

    this.bindEdgeEvents = function(tooltip) {
      s.bind(tooltip.show, function(event) {
        if (tooltip.show !== 'doubleClickEdge' && _doubleClick) {
          return;
        }

        var e = event.data.edge;
        if (!e && event.data.enter) {
          e = event.data.enter.edges[0];
        }
        if (e == undefined) return;

        var clientX = event.data.captor.clientX,
            clientY = event.data.captor.clientY;

        clearTimeout(_timeoutHandle);
        _timeoutHandle = setTimeout(function() {
          self.open(
            e,
            tooltip,
            clientX,
            clientY,
            self.dispatchEvent.bind(self,'shown', event.data));
        }, tooltip.delay);
      });

      s.bind(tooltip.hide, function(event) {
        if (event.data.leave && event.data.leave.edges.length == 0)
          return
        var p = _tooltip;
        delayedCancel(settings.edge.hideDelay);
        if (p)
          self.dispatchEvent('hidden', event.data);
      });
    };

    // STAGE tooltip:
    if (options.stage) {
      var hasDoubleClickStage = false;

      for (var i = 0; i < _stageTooltips.length; i++) {
        if (_stageTooltips[i].renderer !== null &&
            typeof _stageTooltips[i].renderer !== 'function')
          throw new TypeError('"options.stage.renderer" is not a function, was ' + _stageTooltips[i].renderer);

        if (_stageTooltips[i].position !== undefined) {
          if (_stageTooltips[i].position !== 'top' &&
              _stageTooltips[i].position !== 'bottom' &&
              _stageTooltips[i].position !== 'left' &&
              _stageTooltips[i].position !== 'right' &&
              _stageTooltips[i].position !== 'css') {
            throw new Error('"options.position" is not "top", "bottom", "left", "right", or "css", was ' + _stageTooltips[i].position);
          }
        }

        if (_stageTooltips[i].show === 'doubleClickStage') {
          hasDoubleClickStage = true;
        }
      }

      for (var i = 0; i < _stageTooltips.length; i++) {
        this.bindStageEvents(_stageTooltips[i]);
      }

      if (!hasDoubleClickStage) {
        s.bind('doubleClickStage', function(event) {
          cancel();
          _doubleClick = true;
          self.dispatchEvent('hidden', event.data);
          setTimeout(function() {
            _doubleClick = false;
          }, settings.doubleClickDelay);
        });
      }
    }

    // NODE tooltip:
    if (options.node) {
      var hasRightClickNode = false;
      var hasDoubleClickNode = false;

      for (var i = 0; i < _nodeTooltips.length; i++) {
        if (_nodeTooltips[i].renderer !== null &&
            typeof _nodeTooltips[i].renderer !== 'function')
          throw new TypeError('"options.node.renderer" is not a function, was ' + _nodeTooltips[i].renderer);

        if (_nodeTooltips[i].position !== undefined) {
          if (_nodeTooltips[i].position !== 'top' &&
              _nodeTooltips[i].position !== 'bottom' &&
              _nodeTooltips[i].position !== 'left' &&
              _nodeTooltips[i].position !== 'right' &&
              _nodeTooltips[i].position !== 'css') {
            throw new Error('"options.position" is not "top", "bottom", "left", "right", or "css", was ' + _nodeTooltips[i].position);
          }
        }

        if (_nodeTooltips[i].show === 'doubleClickNode') {
          hasDoubleClickNode = true;
        } else if (_nodeTooltips[i].show === 'rightClickNode') {
          hasRightClickNode = true;
        }
      }

      for (var i = 0; i < _nodeTooltips.length; i++) {
        this.bindNodeEvents(_nodeTooltips[i]);
      }

      if (!hasDoubleClickNode) {
        s.bind('doubleClickNode', function(event) {
          cancel();
          _doubleClick = true;
          self.dispatchEvent('hidden', event.data);
          setTimeout(function() {
            _doubleClick = false;
          }, settings.doubleClickDelay);
        });
      }
    }

    // EDGE tooltip:
    if (options.edge) {
      var hasRightClickEdge = false;
      var hasDoubleClickEdge = false;

      for (var i = 0; i < _edgeTooltips.length; i++) {
        if (_edgeTooltips[i].renderer !== null &&
            typeof _edgeTooltips[i].renderer !== 'function')
          throw new TypeError('"options.edge.renderer" is not a function, was ' + _edgeTooltips[i].renderer);

        if (_edgeTooltips[i].position !== undefined) {
          if (_edgeTooltips[i].position !== 'top' &&
              _edgeTooltips[i].position !== 'bottom' &&
              _edgeTooltips[i].position !== 'left' &&
              _edgeTooltips[i].position !== 'right' &&
              _edgeTooltips[i].position !== 'css') {
            throw new Error('"options.position" is not "top", "bottom", "left", "right", or "css", was ' + _edgeTooltips[i].position);
          }
        }

        if (_edgeTooltips[i].show === 'doubleClickEdge') {
          hasDoubleClickEdge = true;
        } else if (_edgeTooltips[i].show === 'rightClickEdge') {
          hasRightClickEdge = true;
        }
      }

      for (var i = 0; i < _edgeTooltips.length; i++) {
        this.bindEdgeEvents(_edgeTooltips[i]);
      }

      if (!hasDoubleClickEdge) {
        s.bind('doubleClickEdge', function(event) {
          cancel();
          _doubleClick = true;
          self.dispatchEvent('hidden', event.data);
          setTimeout(function() {
            _doubleClick = false;
          }, settings.doubleClickDelay);
        })
      }
    }

    // Prevent the browser context menu to appear
    // if the right click event is already handled:
    if (hasRightClickNode || hasRightClickEdge) {
      renderer.container.addEventListener(
        'contextmenu',
        contextmenuListener
      );
    }
  };

  /**
   * Interface
   * ------------------
   */
  var _instance = {};

  /**
   * @param {sigma}    s        The related sigma instance.
   * @param {renderer} renderer The related sigma renderer.
   * @param {object}   options  An object with options.
   */
  sigma.plugins.tooltips = function(s, renderer, options) {
    // Create object if undefined
    if (!_instance[s.id]) {
      _instance[s.id] = new Tooltips(s, renderer, options);
    }
    return _instance[s.id];
  };

  /**
   *  This function kills the tooltips instance.
   */
  sigma.plugins.killTooltips = function(s) {
    if (_instance[s.id] instanceof Tooltips) {
      _instance[s.id].kill();
    }
    delete _instance[s.id];
  };

}).call(window);
