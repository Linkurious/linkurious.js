/**
 * This plugin provides a method to drag & drop nodes. Check the
 * sigma.plugins.dragNodes function doc or the examples/drag-nodes.html code
 * sample to know more.
 */
(function() {
  'use strict';

  if (typeof sigma === 'undefined')
    throw 'sigma is not declared';

  sigma.utils.pkg('sigma.plugins');


  /**
   * This function will add `mousedown`, `mouseup` & `mousemove` events to the
   * nodes in the `overNode`event to perform drag & drop operations. It uses
   * `linear interpolation` [http://en.wikipedia.org/wiki/Linear_interpolation]
   * and `rotation matrix` [http://en.wikipedia.org/wiki/Rotation_matrix] to
   * calculate the X and Y coordinates from the `cam` or `renderer` node
   * attributes. These attributes represent the coordinates of the nodes in
   * the real container, not in canvas.
   *
   * Fired events:
   * *************
   * startdrag  Fired at the beginning of the drag.
   * drag       Fired while the node is dragged.
   * drop       Fired at the end of the drag if the node has been dragged.
   * dragend    Fired at the end of the drag.
   *
   * Recognized parameters:
   * **********************
   * @param  {sigma}                      s        The related sigma instance.
   * @param  {renderer}                   renderer The related renderer instance.
   * @param  {?sigma.plugins.activeState} a        The activeState plugin instance.
   */
  function DragNodes(s, renderer, a, opts) {
    sigma.classes.dispatcher.extend(this);

    // A quick hardcoded rule to prevent people from using this plugin with the
    // WebGL renderer (which is impossible at the moment):
    if (
      sigma.renderers.webgl &&
      renderer instanceof sigma.renderers.webgl
    )
      throw new Error(
        'The sigma.plugins.dragNodes is not compatible with the WebGL renderer'
      );

    // Init variables:
    var _self = this,
      _s = s,
      _a = a,
      _body = document.body,
      _renderer = renderer,
      _mouse = renderer.container.lastChild,
      _camera = renderer.camera,
      _node = null,
      _draggingNode = null,
      _prefix = renderer.options.prefix,
      _hoverStack = [],
      _hoverIndex = {},
      _isMouseDown = false,
      _isMouseOverCanvas = false,
      _drag = false,
      _sticky = true;

    if (renderer instanceof sigma.renderers.svg) {
        _mouse = renderer.container.firstChild;
    }

    renderer.bind('hovers', nodeMouseOver);
    renderer.bind('hovers', treatOutNode);
    renderer.bind('click', click);

    _s.bind('kill', function() {
      _self.unbindAll();
    });

    /**
     * Unbind all event listeners.
     */
    this.unbindAll = function() {
      _mouse.removeEventListener('mousedown', nodeMouseDown);
      _body.removeEventListener('mousemove', nodeMouseMove);
      _body.removeEventListener('mouseup', nodeMouseUp);
      _renderer.unbind('hovers', nodeMouseOver);
      _renderer.unbind('hovers', treatOutNode);
    }

    // Calculates the global offset of the given element more accurately than
    // element.offsetTop and element.offsetLeft.
    function calculateOffset(element) {
      var style = window.getComputedStyle(element);
      var getCssProperty = function(prop) {
        return parseInt(style.getPropertyValue(prop).replace('px', '')) || 0;
      };
      return {
        left: element.getBoundingClientRect().left + getCssProperty('padding-left'),
        top: element.getBoundingClientRect().top + getCssProperty('padding-top')
      };
    };

    function click(event) {
      // event triggered at the end of the click
      _isMouseDown = false;
      _body.removeEventListener('mousemove', nodeMouseMove);
      _body.removeEventListener('mouseup', nodeMouseUp);

      if (!_hoverStack.length) {
        _node = null;
      }
      else {
        // Drag node right after click instead of needing mouse out + mouse over:
        setTimeout(function() {
          // Set the current node to be the last one in the array
          _node = _hoverStack[_hoverStack.length - 1];
          _mouse.addEventListener('mousedown', nodeMouseDown);
        }, 0);
      }
    };

    function nodeMouseOver(event) {
      if (event.data.enter.nodes.length == 0) {
        return;
      }
      var n = event.data.enter.nodes[0];
      // Don't treat the node if it is already registered
      if (_hoverIndex[n.id]) {
        return;
      }

      // Add node to array of current nodes over
      _hoverStack.push(n);
      _hoverIndex[n.id] = true;

      if(!_isMouseDown) {
        // Set the current node to be the last one in the array
        _node = _hoverStack[_hoverStack.length - 1];
        _mouse.addEventListener('mousedown', nodeMouseDown);
      }
    };

    function treatOutNode(event) {
      if (event.data.leave.nodes.length == 0) {
        return;
      }
      var n = event.data.leave.nodes[0];
      // Remove the node from the array
      var indexCheck = _hoverStack.map(function(e) { return e; }).indexOf(n);
      _hoverStack.splice(indexCheck, 1);
      delete _hoverIndex[n.id];

      if(_hoverStack.length && ! _isMouseDown) {
        // On out, set the current node to be the next stated in array
        _node = _hoverStack[_hoverStack.length - 1];
      } else {
        _mouse.removeEventListener('mousedown', nodeMouseDown);
      }
    };

    function nodeMouseDown(event) {
      if(event.which == 3) return; // Right mouse button pressed

      _isMouseDown = true;
      if (_node && _s.graph.nodes().length > 0) {
        _sticky = true;
        _mouse.removeEventListener('mousedown', nodeMouseDown);
        _body.addEventListener('mousemove', nodeMouseMove);
        _body.addEventListener('mouseup', nodeMouseUp);

        // Deactivate drag graph.
        _renderer.settings({mouseEnabled: false, enableHovering: false});

        _self.dispatchEvent('startdrag', {
          node: _node,
          captor: event,
          renderer: _renderer
        });
      }
    };

    function nodeMouseUp(event) {
      _isMouseDown = false;
      _mouse.addEventListener('mousedown', nodeMouseDown);
      _body.removeEventListener('mousemove', nodeMouseMove);
      _body.removeEventListener('mouseup', nodeMouseUp);

      // Activate drag graph.
      _renderer.settings({mouseEnabled: true, enableHovering: true});

      if (_drag) {
        _self.dispatchEvent('drop', {
          node: _node,
          captor: event,
          renderer: _renderer
        });

        if(_a) {
          var activeNodes = _a.nodes();
          for(var i = 0; i < activeNodes.length; i++) {
            delete activeNodes[i].alphaX;
            delete activeNodes[i].alphaY;
          }
        }

        _s.refresh(opts);
      }
      _self.dispatchEvent('dragend', {
        node: _node,
        captor: event,
        renderer: _renderer
      });

      _drag = false;
      _node = null;
    };

    function nodeMouseMove(event) {
      if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
        clearTimeout(timeOut);
        var timeOut = setTimeout(executeNodeMouseMove, 0);
      } else {
        executeNodeMouseMove();
      }

      function executeNodeMouseMove() {
        var offset = calculateOffset(_renderer.container),
            x = event.clientX - offset.left,
            y = event.clientY - offset.top,
            cos = Math.cos(_camera.angle),
            sin = Math.sin(_camera.angle),
            nodes = _s.graph.nodes(),
            ref = [],
            x2,
            y2,
            activeNodes,
            n,
            aux,
            isHoveredNodeActive,
            dist;

        if (nodes.length < 2) return;

        dist = sigma.utils.getDistance(x, y, _node[_prefix + 'x'],_node[_prefix + 'y']);

        if (_sticky && dist < _node[_prefix + 'size']) return;
        _sticky = false;

        // Find two reference points and derotate them
        // We take the first node as a first reference point and then try to find
        // another node not aligned with it
        for (var i = 0;;i++) {
          n = nodes[i];
          if (n) {
            aux = {
              x: n.x * cos + n.y * sin,
              y: n.y * cos - n.x * sin,
              renX: n[_prefix + 'x'], //renderer X
              renY: n[_prefix + 'y'], //renderer Y
            };
            ref.push(aux);
          }
          if(i == nodes.length - 1) { //we tried all nodes
            break
          }
          if (i > 0) {
            if (ref[0].x == ref[1].x || ref[0].y == ref[1].y) {
              ref.pop() // drop last nodes and try to find another one
            } else { // ww managed to find two nodes not aligned
              break
            }
          }
        }

        var a = ref[0], b = ref[1];

        // Applying linear interpolation.
        var divx = (b.renX - a.renX);
        if (divx === 0) divx = 1; //fix edge case where axis are aligned

        var divy = (b.renY - a.renY);
        if (divy === 0) divy = 1; //fix edge case where axis are aligned

        x = ((x - a.renX) / divx) * (b.x - a.x) + a.x;
        y = ((y - a.renY) / divy) * (b.y - a.y) + a.y;

        x2 = x * cos - y * sin;
        y2 = y * cos + x * sin;

        // Drag multiple nodes, Keep distance
        if(_a) {
          activeNodes = _a.nodes();

          // If hovered node is active, drag active nodes nodes
          isHoveredNodeActive = (-1 < activeNodes.map(function(node) {
            return node.id;
          }).indexOf(_node.id));

          if (isHoveredNodeActive) {
            for(var i = 0; i < activeNodes.length; i++) {
              // Delete old reference
              if(_draggingNode != _node) {
                activeNodes[i].alphaX = null;
                activeNodes[i].alphaY = null;
              }

              // Calcul first position of activeNodes
              if(!activeNodes[i].alphaX || !activeNodes[i].alphaY) {
                activeNodes[i].alphaX = activeNodes[i].x - x;
                activeNodes[i].alphaY = activeNodes[i].y - y;
              }

              // Move activeNodes to keep same distance between dragged nodes
              // and active nodes
              activeNodes[i].x = _node.x + activeNodes[i].alphaX;
              activeNodes[i].y = _node.y + activeNodes[i].alphaY;
            }
          }
        }

        // Rotating the coordinates.
        _node.x = x2;
        _node.y = y2;

        _s.refresh(sigma.utils.extend({skipIndexation: true}, opts));

        _drag = true;
        _self.dispatchEvent('drag', {
          node: _node,
          captor: event,
          renderer: _renderer
        });

        _draggingNode = _node;
      }
    };
  };

  /**
   * Interface
   * ------------------
   *
   * > var dragNodesListener = sigma.plugins.dragNodes(s, s.renderers[0], a);
   */
  var _instance = {};

  /**
   * @param  {sigma}                      s        The related sigma instance.
   * @param  {renderer}                   renderer The related renderer instance.
   * @param  {?sigma.plugins.activeState} a        The activeState plugin instance.
   */
  sigma.plugins.dragNodes = function(s, renderer, a, opts) {
    // Create object if undefined
    if (!_instance[s.id]) {
      // Handle drag events:
      _instance[s.id] = new DragNodes(s, renderer, a, opts);
    }

    s.bind('kill', function() {
      sigma.plugins.killDragNodes(s);
    });

    return _instance[s.id];
  };

  /**
   * This method removes the event listeners and kills the dragNodes instance.
   *
   * @param  {sigma} s The related sigma instance.
   */
  sigma.plugins.killDragNodes = function(s) {
    if (_instance[s.id] instanceof DragNodes) {
      _instance[s.id].unbindAll();
      delete _instance[s.id];
    }
  };

}).call(window);
