;(function(undefined) {
  'use strict';

  if (typeof sigma === 'undefined')
    throw new Error('sigma is not declared');

  if (typeof L === 'undefined')
    console.warn('Include leaflet to use the leaflet plugin for sigma.');

  // Initialize package:
  sigma.utils.pkg('sigma.plugins.leaflet');


  /**
   * Create a new MouseEvent object with the same properties as the given
   * event object.
   *
   * @param  {MouseEvent} e
   * @return {MouseEvent}
   */
  function cloneMouseEvent(e) {
    // http://stackoverflow.com/a/12752970/738167
    // It doesn't handle WheelEvent.
    var evt = document.createEvent("MouseEvent");
    evt.initMouseEvent(e.type, e.canBubble, e.cancelable, e.view, e.detail, e.screenX,
      e.screenY, e.clientX, e.clientY, e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
      e.button, e.relatedTarget);
    return evt;
  }

  /**
   * Return true if the node has latitude and longitude coordinates.
   *
   * @param  {object} node
   * @return {boolean}
   */
  function hasNodeGeoCoordinates(node) {
    return typeof node.lat != 'undefined' && typeof node.lng != 'undefined' &&
      typeof node.lat === 'number' && typeof node.lng === 'number';
  }

  // Index of the nodes that have geo coordinates
  var _geoNodesIndex = new sigma.utils.map();

  /**
   * Attach methods to the graph to keep indexes updated.
   * ------------------
   */

  // Index the node after its insertion in the graph if it has geo coordinates.
  sigma.classes.graph.attach(
    'addNode',
    'sigma.plugins.leaflet.addNode',
    function(n) {
      if (hasNodeGeoCoordinates(n)) {
        _geoNodesIndex.set(n.id, this.nodesIndex.get(n.id));
      }
    }
  );

  // Deindex the node before its deletion from the graph.
  sigma.classes.graph.attachBefore(
    'dropNode',
    'sigma.plugins.leaflet.dropNode',
    function(id) {
      _geoNodesIndex.delete(id);
    }
  );

  // Deindex all nodes before the graph is cleared.
  sigma.classes.graph.attachBefore(
    'clear',
    'sigma.plugins.leaflet.clear',
    function() {
      _geoNodesIndex.clear();
      _geoNodesIndex = new sigma.utils.map();
    }
  );

  /**
   * This methods returns true if the given node has geo coordinates. If no
   * node is given, returns true if one node has geo coordinates in the graph.
   *
   * @param {?string|number} nodeId The optional node id to check.
   * @return {boolean}
   */
  if (!sigma.classes.graph.hasMethod('hasLatLngCoordinates'))
    sigma.classes.graph.addMethod('hasLatLngCoordinates', function(nodeId) {
      if (nodeId !== undefined) {
        var node = this.nodesIndex.get(nodeId);
        if (node) {
          return hasNodeGeoCoordinates(node);
        }
      }
      return _geoNodesIndex.size != 0;
    });


  /**
   * Sigma Leaflet integration plugin
   * ===============================
   *
   * Require https://github.com/Leaflet/Leaflet
   * Author: Sébastien Heymann @ Linkurious
   * Version: 0.1
   */

  var settings = {
    // Leaflet zoom is discrete while Sigma zoom is continuous!
    // We use sigma zoom ratio as a binary switch.
    // It will zoom to the center of the view regardless of where the mouse was.
    zoomingRatio: 0.999999999,
    doubleClickZoomingRatio: 0.999999999,
    // Non-instant zoom can trigger the coordinatesUpdated event multiple times:
    mouseZoomDuration: 0,
    doubleClickZoomDuration: 0,
    // Disable automatic fit-to-screen:
    autoRescale: ['nodeSize', 'edgeSize'],
    // Disable zoom on mouse location:
    zoomOnLocation: false,
    // Disable inertia because of inaccurate node position:
    mouseInertiaDuration: 0,
    mouseInertiaRatio: 1,
    touchInertiaDuration: 0,
    touchInertiaRatio: 1
  };

  var locateAnimationSettings = {
    node: {
      duration: 0
    },
    edge: {
      duration: 0
    },
    center: {
      duration: 0
    }
  };

  // List of events received by the graph container
  // and copied to the map container
  var forwardedEvents = [
    'click',
    'mouseup',
    'mouseover',
    'mouseout',
    'mousemove',
    // 'contextmenu', // conflict with sigma.plugins.tooltips
    'focus',
    'blur'
  ];


  /**
   * This function provides geospatial features to Sigma by intergrating Leaflet.
   *
   * Fired events:
   * *************
   * enabled  Fired when the plugin is enabled and node coordinates are synchronized with the map.
   * disabled Fired when the plugin is disabled and original node coordinates are restored.
   *
   * @param {sigma}     sigInst     The Sigma instance.
   * @param {leaflet}   leafletMap  The Leaflet map instance.
   * @param {?object}   options     The options.
   */
  function LeafletPlugin(sigInst, leafletMap, options) {
    sigma.classes.dispatcher.extend(this);

    if (typeof L === 'undefined')
      throw new Error('leaflet is not declared');

    options = options || {};

    var _self = this,
      _s = sigInst,
      _map = leafletMap,
      _renderer = options.renderer || _s.renderers[0],
      _dragListener,
      _filter,
      _sigmaSettings = Object.create(null),
      _locateAnimationSettings = Object.create(null),

      // Easing parameters (can be applied only at enable/disable)
      _easeEnabled = false,
      _easing = options.easing,
      _duration = options.duration,
      _isAnimated = false,

      // Plugin state
      _enabled = false,
      _bound = false,
      _settingsApplied = false,
      _locateSettingsApplied = false,

      // Cache camera properties
      _sigmaCamera = {
        x: _s.camera.x,
        y: _s.camera.y,
        ratio: _s.camera.ratio
      };

    if (_easing && (!sigma.plugins || typeof sigma.plugins.animate === 'undefined')) {
      throw new Error('sigma.plugins.animate is not declared');
    }

    /**
     * Check if at least one node has geographical coordinates.
     *
     * @return {boolean}
     */
    this.isApplicable = function() {
      var nodes = _s.graph.nodes();
      for (var i = 0, l = nodes.length; i < l; i++) {
        if (hasNodeGeoCoordinates(nodes[i])) {
          return true;
        }
      }
      return false;
    };

    /**
     * Check if the plugin is enabled.
     *
     * @return {boolean}
     */
    this.isEnabled = function() {
      return _enabled;
    }

    /**
     * Apply mandatory Sigma settings, update node coordinates from their
     * geospatial coordinates, and bind all event listeners.
     *
     * @return {sigma.plugins.leaflet} The plugin instance.
     */
    this.enable = function() {
      showMapContainer();
      applySigmaSettings();
      applyLocatePluginSettings();

      // Reset camera cache
      _sigmaCamera = {
        x: _s.camera.x,
        y: _s.camera.y,
        ratio: _s.camera.ratio
      };

      _self.bindAll();

      _easeEnabled = !!_easing;
      _self.syncNodes(function() {
        _self.dispatchEvent('enabled');
      });
      _easeEnabled = false;

      _enabled = true;

      return _self;
    };

    /**
     * Restore the original Sigma settings and node coordinates,
     * and unbind event listeners.
     *
     * @return {sigma.plugins.leaflet} The plugin instance.
     */
    this.disable = function() {
      hideMapContainer();
      restoreSigmaSettings();
      restoreLocatePluginSettings();

      _easeEnabled = !!_easing;

      if (_filter) {
        // must be before unbindAll
        _filter.undo('geo-coordinates').apply();
      }

      restoreGraph(function() {
        _self.dispatchEvent('disabled');
      });

      _easeEnabled = false;
      _enabled = false;

      _self.unbindAll();

      return _self;
    };

    /**
     * Update the cartesian coordinates of the given node ids from their geospatial
     * coordinates and refresh sigma.
     * All nodes will be updated if no parameter is given.
     *
     * @param {?number|string|array} v One node id or a list of node ids.
     * @param {?function} callback A callback function triggered after node positions are updated.
     * @return {sigma.plugins.leaflet} The plugin instance.
     */
    this.syncNodes = function(v, callback) {
      var nodes, node, point;

      if (typeof v === 'string' || typeof v === 'number' || Array.isArray(v)) {
        nodes = _s.graph.nodes(v);
      }
      else {
        nodes = _s.graph.nodes();
      }

      if (typeof v === 'function') {
        callback = v;
      }

      if (!Array.isArray(nodes)) {
        nodes = [nodes];
      }

      for (var i = 0, l = nodes.length; i < l; i++) {
        node = nodes[i];

        // Store current cartesian coordinates
        if (node.leaflet_x === undefined) {
          node.leaflet_x = node.x;
        }
        if (node.leaflet_y === undefined) {
          node.leaflet_y = node.y;
        }

        if (hasNodeGeoCoordinates(node)) {
          // ensures the node is indexed if lat/lng properties have been added
          _geoNodesIndex.set(node.id, _s.graph.nodes(node.id));

          // Compute new cartesian coordinates
          point = _self.utils.latLngToSigmaPoint(node);

          if (_easeEnabled) {
            // Set current position on screen
            node.x = node['read_cam0:x'] || node.x;
            node.y = node['read_cam0:y'] || node.y;

            // Store new cartesian coordinates for animation
            node.leaflet_x_easing = point.x;
            node.leaflet_y_easing = point.y;
          }
          else {
            // Apply new cartesian coordinates
            node.x = point.x;
            node.y = point.y;
          }
        }
        else {
          // ensures the node is not indexed if lat/lng properties have been removed
          _geoNodesIndex.delete(node.id);

          if (!_filter) {
            // Hide node because it doesn't have geo coordinates
            // and store current "hidden" state
            if (node.leaflet_hidden === undefined) {
              node.leaflet_hidden = !!node.hidden;
            }
            node.hidden = true;
          }
        }
      }

      applyGeoFilter();

      if (_easeEnabled) {
        animate(nodes, callback);
      }
      else {
        _s.refresh();
        if (callback) callback();
      }
      return _self;
    };

    /**
     * It will increment the zoom level of the map by 1
     * if the zoom ratio of Sigma has been decreased.
     * It will decrement the zoom level of the map by 1
     * if the zoom ratio of Sigma has been increased.
     * It will update the Leaflet map center if the zoom ratio of Sigma is the same.
     *
     * @return {sigma.plugins.leaflet} The plugin instance.
     */
    this.syncMap = function() {
      // update map zoom
      if (_sigmaCamera.ratio !== _s.camera.ratio) {

        // Leaflet zoom is discrete while Sigma zoom is continuous!
        // We use sigma zoom ratio as a binary switch.
        if (_sigmaCamera.ratio < _s.camera.ratio) {
          _map.zoomIn();
        }
        else {
          _map.zoomOut();
        }
        // Reset zoom ratio of Sigma
        _s.camera.ratio = 1;
      }
      else {
        // update map center
        var dX = _s.camera.x - _sigmaCamera.x;
        var dY = _s.camera.y - _sigmaCamera.y;

        _sigmaCamera.x = _s.camera.x;
        _sigmaCamera.y = _s.camera.y;

        _map.panBy([dX, dY], {
          animate: false // the map will stick to the graph
        });
      }
      return _self;
    };

    /**
     * Fit the view to the graph or to the given nodes or edges. If sigma is
     * currently animated, it will postpone the execution after the end of the
     * animation.
     *
     * @param  {?object} options       The options. Fit to all nodes otherwise.
     *         {?number|string|array}  options.nodeIds The set of node ids.
     *         {?number|string|array}  options.edgeIds The set of edges ids.
     *         {?boolean}              options.animate Animate the nodes if true.
     *         {?function}             options.onComplete The callback function.
     * @return {sigma.plugins.leaflet} The plugin instance.
     */
    this.fitBounds = function(options) {
      var o = options || {};
      var zoom = _map.getZoom();
      if (_isAnimated) {
        _s.bind('animate.end', fitGeoBounds);
      }
      else {
        fitGeoBounds();
      }

      function fitGeoBounds() {
        if (o.edgeIds) {
          if (!Array.isArray(o.edgeIds)) {
            o.edgeIds = [o.edgeIds];
          }
          o.nodeIds = [];
          var edges = _s.graph.edges(o.edgeIds);
          for (var i = 0, l = edges.length; i < l; i++) {
            o.nodeIds.push(edges[i].source);
            o.nodeIds.push(edges[i].target);
          }
        }
        if (o.nodeIds && !Array.isArray(o.nodeIds)) {
          o.nodeIds = [o.nodeIds];
        }
        var nodes = o.nodeIds ? _s.graph.nodes(o.nodeIds) : _s.graph.nodes();

        _map.fitBounds(_self.utils.geoBoundaries(nodes), {
          animate: false
        });

        if (_map.getZoom() === zoom) {
          _easeEnabled = !!o.animate;

          if (o.onComplete) {
            _self.syncNodes(o.onComplete);
          }
          else {
            _self.syncNodes();
          }

          _easeEnabled = false;
        }
        else if (o.onComplete) {
          o.onComplete();
        }

        // handler removes itself
        setTimeout(function() {
          _s.unbind('animate.end', fitGeoBounds);
        }, 0);
      }

      return _self;
    };

    /**
     * Zoom in the map.
     */
    this.zoomIn = function() {
      _map.zoomIn();
    };

    /**
     * Zoom out the map.
     */
    this.zoomOut = function() {
      _map.zoomOut();
    };

    /**
     * Bind the given instance of the dragNodes listener. The geographical
     * coordinates of the dragged nodes will be updated to their new location
     * to preserve their position during zoom.
     *
     * @param {sigma.plugins.dragNodes} listener The dragNodes plugin instance.
     * @return {sigma.plugins.leaflet} The plugin instance.
     */
    this.bindDragListener = function(listener) {
      _dragListener = _dragListener || listener;
      _dragListener.bind('drop', leafletDropNodesHandler);
      return _self;
    };

    /**
     * Unbind the instance of the dragNodes listener.
     *
     * @return {sigma.plugins.leaflet} The plugin instance.
     */
    this.unbindDragListener = function() {
      if (_dragListener === undefined) return;

      _dragListener.unbind('drop', leafletDropNodesHandler);
      _dragListener = undefined;
      return _self;
    };

    /**
     * Bind the given instance of the filter plugin and apply the geo filter.
     *
     * @param {sigma.plugins.filter} listener The filter plugin instance.
     * @return {sigma.plugins.leaflet} The plugin instance.
     */
    this.bindFilter = function(filterInstance) {
      _filter = filterInstance;
      applyGeoFilter();
      return _self;
    };

    /**
     * Unbind the instance of the filter plugin.
     *
     * @return {sigma.plugins.leaflet} The plugin instance.
     */
    this.unbindFilter = function() {
      _filter = undefined;
      return _self;
    };

    /**
     * Reset the geographical coordinates of the nodes that have been dragged.
     *
     * @return {sigma.plugins.leaflet} The plugin instance.
     */
    this.resetDraggedNodesLatLng = function() {
      var node,
        nodes = _s.graph.nodes();

      for (var i = 0, l = nodes.length; i < l; i++) {
        node = nodes[i];

        if (node.lat_init !== undefined && node.lng_init !== undefined) {
          node.lat = node.lat_init;
          node.lng = node.lng_init;

          node.lat_init = undefined;
          node.lng_init = undefined;
        }
      }
      return _self;
    };

    /**
     * Bind all event listeners.
     *
     * @return {sigma.plugins.leaflet} The plugin instance.
     */
    this.bindAll = function() {
      if (_bound) return;

      _bound = true;
      forwardEvents();
      _s.bind('coordinatesUpdated', _self.syncMap);
      _map
        .on('zoomstart', hideGraphContainer)
        .on('zoomend', showGraphContainer);

      // Toggle animation state
      _s.bind('animate.start', toggleAnimating);
      _s.bind('animate.end', toggleAnimating);

      return _self;
    };

    /**
     * Unbind all event listeners.
     *
     * @return {sigma.plugins.leaflet} The plugin instance.
     */
    this.unbindAll = function() {
      if (!_bound) return;

      _bound = false;
      cancelForwardEvents();
      _s.unbind('coordinatesUpdated', _self.syncMap);
      _map
        .off('zoomstart', hideGraphContainer)
        .off('zoomend', showGraphContainer);

      // Toggle animation state
      _s.unbind('animate.start', toggleAnimating);
      _s.unbind('animate.end', toggleAnimating);

      _self.unbindDragListener();
      _self.unbindFilter();

      return _self;
    };

    /**
     * Unbind all event listeners, restore Sigma settings and remove all
     * references to Sigma and the Leaflet map.
     */
    this.kill = function() {
      _self.unbindAll();
      hideMapContainer();
      restoreSigmaSettings();
      _enabled = false;

      _s = undefined;
      _renderer = undefined;
      _map = undefined;
      _sigmaCamera = undefined;
    };

    this.utils = {};

    /**
     * Returns the geographical coordinates of a given Sigma point x,y.
     *
     * @param  {node|leaflet<Point>} point The Sigma x,y coordinates.
     * @return {leaflet<LatLng>}           The geographical coordinates.
     */
    this.utils.sigmaPointToLatLng = function(point) {
      var center = _map.project(_map.getCenter());
      return _map.unproject([
        point.x + center.x - _s.camera.x,
        point.y + center.y - _s.camera.y
      ]);
    };

    /**
     * Returns the cartesian coordinates of a Leaflet map layer point.
     *
     * @param  {node|leaflet<LatLng>} latlng The Leaflet map layer point.
     * @return {leaflet<Point>}              The Sigma x,y coordinates.
     */
    this.utils.latLngToSigmaPoint = function(latlng) {
      var center = _map.project(_map.getCenter());
      var point = _map.project(latlng);
      return {
        x: point.x - center.x + _s.camera.x,
        y: point.y - center.y + _s.camera.y
      }
    };

    /**
     * Compute the spatial boundaries of the given nodes.
     * Ignore hidden nodes and nodes with missing latitude or longitude coordinates.
     *
     * @param  {array}   nodes The nodes of the graph.
     * @return {leaflet<LatLngBounds>}
     */
    this.utils.geoBoundaries = function(nodes) {
      var node,
        minLat = Infinity,
        minLng = Infinity,
        maxLat = -Infinity,
        maxLng = -Infinity;

      for (var i = 0, l = nodes.length; i < l; i++) {
        node = nodes[i];
        if (node.hidden || !hasNodeGeoCoordinates(node)) {
          continue; // skip node
        }
        maxLat = Math.max(node.lat, maxLat);
        minLat = Math.min(node.lat, minLat);
        maxLng = Math.max(node.lng, maxLng);
        minLng = Math.min(node.lng, minLng);
      }

      return L.latLngBounds(L.latLng(minLat, minLng), L.latLng(maxLat, maxLng));
    };


    // PRIVATE FUNCTIONS

    /**
     * Restore original cartesian coordinates of the nodes and "hidden" state.
     * Unpin all nodes.
     */
    function restoreGraph(callback) {
      if (!_s) return;

      var nodes = _s.graph.nodes(),
        node;

      for (var i = 0; i < nodes.length; i++) {
        node = nodes[i];

        if (!_filter && node.leaflet_hidden !== undefined) {
          node.hidden = node.leaflet_hidden;
          node.leaflet_hidden = undefined;
        }

        if (node.leaflet_x !== undefined && node.leaflet_y !== undefined) {
          if (_easeEnabled) {
            // Set current position on screen
            node.x = node['read_cam0:x'] || node.x;
            node.y = node['read_cam0:y'] || node.y;

            // Store new cartesian coordinates for animation
            node.leaflet_x_easing = node.leaflet_x;
            node.leaflet_y_easing = node.leaflet_y;
          }
          else {
            node.x = node.leaflet_x;
            node.y = node.leaflet_y;
          }

          node.leaflet_x = undefined;
          node.leaflet_y = undefined;
        }
      }

      if (_easeEnabled) {
        animate(nodes, callback);
      }
      else {
        _s.refresh();
        if (callback) callback();
      }
    }

    /**
     * Apply the geo filter or create it and apply it.
     */
    function applyGeoFilter() {
      if (_filter) {
        if (_filter.has('geo-coordinates')) {
          _filter.apply();
        }
        else {
          _filter.nodesBy(hasNodeGeoCoordinates, 'geo-coordinates').apply();
        }
      }
    }

    /**
     * Toggle the node animation state.
     */
    function toggleAnimating() {
      _isAnimated = !_isAnimated;
    }

    /**
     * Animate a set of given nodes.
     *
     * @param {array} nodes The list of nodes to animate.
     * @param {?function} callback The function to run after the animation is complete.
     */
    function animate(nodes, callback) {
      sigma.plugins.animate(
        _s,
        {
          x: 'leaflet_x_easing',
          y: 'leaflet_y_easing'
        },
        {
          easing: _easing,
          onComplete: function() {
            _s.refresh();
            for (var i = 0; i < nodes.length; i++) {
              nodes[i].leaflet_x_easing = null;
              nodes[i].leaflet_y_easing = null;
            }
            if (callback) callback();
          },
          duration: _duration
        }
      );
    }

    /**
     * Set new geographical coordinates to the nodes of the given event
     * according to their Sigma cartesian coordinates.
     *
     * @param {object} event The Sigma 'drop' nodes event.
     */
    function leafletDropNodesHandler(event) {
      var node,
        latLng,
        nodes = event.data.nodes || [event.data.node];

      for (var i = 0, l = nodes.length; i < l; i++) {
        node = nodes[i];
        latLng = _self.utils.sigmaPointToLatLng(node);

        node.lat_init = node.lat;
        node.lng_init = node.lng;

        node.lat = latLng.lat;
        node.lng = latLng.lng;
      }
    }

    /**
     * Apply mandatory settings to sigma for the integration to work.
     * Cache overriden sigma settings to be restored when the plugin is killed.
     * Reset zoom ratio.
     */
    function applySigmaSettings() {
      if (_settingsApplied) return;
      _settingsApplied = true;

      Object.keys(settings).forEach(function(key) {
        _sigmaSettings[key] = _s.settings(key);
        _s.settings(key, settings[key]);
      });

      _s.camera.ratio = 1;
    }

    /**
     * Restore overriden sigma settings.
     */
    function restoreSigmaSettings() {
      if (!_settingsApplied) return;
      _settingsApplied = false;

      Object.keys(settings).forEach(function(key) {
        _s.settings(key, _sigmaSettings[key]);
      });
    }

    /**
     * Apply mandatory settings to sigma.plugins.locate for the integration to work.
     * Cache overriden settings to be restored when the plugin is killed.
     */
    function applyLocatePluginSettings() {
      if (_locateSettingsApplied || typeof sigma.plugins.locate === 'undefined') return;
      _locateSettingsApplied = true;

      if (_s) {
        // locate plugin must be instanciated before!
        var locateAnim = sigma.plugins.locate(_s).settings.animation;

        _locateAnimationSettings.nodeDuration = locateAnim.node.duration;
        _locateAnimationSettings.edgeDuration = locateAnim.edge.duration;
        _locateAnimationSettings.centerDuration = locateAnim.center.duration;

        locateAnim.node.duration = 0;
        locateAnim.edge.duration = 0;
        locateAnim.center.duration = 0;
      }
    }

    /**
     * Restore overriden sigma.plugins.locate settings.
     */
    function restoreLocatePluginSettings() {
      if (!_locateSettingsApplied || typeof sigma.plugins.locate === 'undefined') return;
      _locateSettingsApplied = false;

      if (_s) {
        // locate plugin must be instanciated before!
        var locateAnim = sigma.plugins.locate(_s).settings.animation;

        locateAnim.node.duration = _locateAnimationSettings.nodeDuration;
        locateAnim.edge.duration = _locateAnimationSettings.edgeDuration;
        locateAnim.center.duration = _locateAnimationSettings.centerDuration;
      }
    }

    /**
     * Forward a subset of mouse events from the sigma container to the Leaflet map.
     */
    function forwardEvents() {
      forwardedEvents.forEach(function(eventType) {
        // Listen on capture phase because sigma prevents propagation on bubbling phase
        _renderer.container.addEventListener(eventType, forwardEventsHandler, true);
      });
    }

    function cancelForwardEvents() {
      forwardedEvents.forEach(function(eventType) {
        _renderer.container.removeEventListener(eventType, forwardEventsHandler, true);
      });
    }

    function forwardEventsHandler(e) {
      _map.getContainer().dispatchEvent(cloneMouseEvent(e));
    }

    function hideGraphContainer() {
      _s.settings('enableCamera', false);
      _renderer.container.style.visibility = 'hidden';
    }

    function showGraphContainer() {
      _s.settings('enableCamera', true);
      _renderer.container.style.visibility = '';
      _self.syncNodes();
    }

    function hideMapContainer() {
      if (_map) {
        _map.getContainer().style.opacity = 0;
        _map.getContainer().style.visibility = 'hidden';
      }
    }

    function showMapContainer() {
      if (_map) {
        _map.getContainer().style.opacity = 1;
        _map.getContainer().style.visibility = '';
      }
    }
  }


  /**
   * Interface
   * ------------------
   *
   * > var leafletPlugin = sigma.plugins.leaflet(s, map, { easing: 'cubicInOut' });
   */
  var _instance = {};

  /**
   * This function provides geospatial features to Sigma by intergrating Leaflet.
   *
   * Recognized options:
   * **********************
   * Here is the exhaustive list of every accepted parameters in the settings
   * object:
   *
   *   {?sigma.renderer}    renderer   The instance of the sigma renderer.
   *   {?(function|string)} easing     Either the name of an easing in the
   *                                   sigma.utils.easings package or a
   *                                   function. If not specified, the
   *                                   quadraticInOut easing from this package
   *                                   will be used instead.
   *   {?number}            duration   The duration of the animation. If not
   *                                   specified, the "animationsTime" setting
   *                                   value of the sigma instance will be used
   *                                   instead.
   *
   * @param {sigma}   sigInst    The related sigma instance.
   * @param {leaflet} leafletMap The Leaflet map instance.
   * @param {?object} options    The configuration options.
   */
  sigma.plugins.leaflet = function(sigInst, leafletMap, options) {
    if (!sigInst) throw new Error('Missing argument: "sigInst"');
    if (!leafletMap) throw new Error('Missing argument: "leafletMap"');

    // Create instance if undefined
    if (!_instance[sigInst.id]) {
      _instance[sigInst.id] = new LeafletPlugin(sigInst, leafletMap, options);

      // Binding on kill to clear the references
      sigInst.bind('kill', function() {
        _instance[sigInst.id].kill();
        _instance[sigInst.id] = undefined;
      });
    }

    return _instance[sigInst.id];
  };

  /**
   * This method removes the event listeners and kills the leaflet plugin instance.
   *
   * @param  {sigma} sigInst The related sigma instance.
   */
  sigma.plugins.killLeafletPlugin = function(sigInst) {
    if (!sigInst) throw new Error('Missing argument: "sigInst"');

    if (_instance[sigInst.id] instanceof LeafletPlugin) {
      _instance[sigInst.id].kill();
      _instance[sigInst.id] = undefined;
    }
  };


}).call(this);
