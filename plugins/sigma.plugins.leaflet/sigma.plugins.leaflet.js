;(function(undefined) {
  'use strict';

  if (typeof sigma === 'undefined')
    throw new Error('sigma is not declared');

  if (typeof L === 'undefined')
    console.warn('Include leaflet to use the leaflet plugin for sigma.');

  // Initialize package:
  sigma.utils.pkg('sigma.plugins.leaflet');


  /**
   * Create a new MouseEvent object with the same properties as the specified
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
  function hasGeoCoordinates(node) {
    return node.latitude != undefined && node.longitude != undefined &&
      typeof node.latitude === 'number' && typeof node.longitude === 'number';
  }


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
    autoRescale: false,
    // Disable inertia because of inaccurate node position:
    mouseInertiaDuration: 0,
    mouseInertiaRatio: 1,
    touchInertiaDuration: 0,
    touchInertiaRatio: 1
  };

  // List of events received by the graph container
  // and copied to the map container
  var forwardedEvents = [
    'click',
    'mousedown',
    'mouseup',
    'mouseover',
    'mouseout',
    'mousemove',
    'contextmenu',
    'focus',
    'blur'
  ];


  /**
   * This function provides geospatial features to Sigma by intergrating Leaflet.
   *
   * @param {sigma}     sigInst     The Sigma instance.
   * @param {leaflet}   leafletMap  The Leaflet map instance.
   * @param {renderer?} sigRenderer The sigma renderer instance.
   */
  function LeafletPlugin(sigInst, leafletMap, sigRenderer) {
    if (typeof L === 'undefined')
      throw new Error('leaflet is not declared');

    var _self = this,
      _s = sigInst,
      _map = leafletMap,
      _renderer = sigRenderer || _s.renderers[0],
      _sigmaSettings = {},

      // Plugin state
      _bound = false,
      _settingsApplied = false,

      // Cache camera properties
      _sigmaCamera = {
        x: _s.camera.x,
        y: _s.camera.y,
        ratio: _s.camera.ratio
      };

    // Accessors to pin/unpin nodes
    var fixNode, unfixNode;
    if (typeof _s.graph.fixNode === 'function') {
      fixNode = _s.graph.fixNode;
    } else {
      fixNode = function(n) { n.fixed = true; }
    }
    if (typeof _s.graph.unfixNode === 'function') {
      unfixNode = _s.graph.unfixNode;
    } else {
      unfixNode = function(n) { n.fixed = false; }
    }

    /**
     * Update nodes positions from geospatial coordinates and refresh sigma.
     * All nodes will be updated if no parameter is specified.
     *
     * @param {?number|string|array} v One node id or a list of node ids.
     */
    this.syncNodes = function(v) {
      var center = _map.project(_map.getCenter()),
        nodes,
        node,
        point;

      if (typeof v === 'string' || typeof v === 'number' || Array.isArray(v)) {
        nodes = _s.graph.nodes(v);
      }
      else {
        nodes = _s.graph.nodes();
      }

      if (!Array.isArray(nodes)) {
        nodes = [nodes];
      }

      for (var i = 0; i < nodes.length; i++) {
        node = nodes[i];

        if (hasGeoCoordinates(node)) {
          // Pin node
          fixNode(node);
          // Store current cartesian coordinates
          if (node.leafletX === undefined) {
            node.leafletX = node.x;
          }
          if (node.leafletY === undefined) {
            node.leafletY = node.y;
          }

          // Apply new cartesian coordinates
          // TODO animate
          point = _map.project([node.latitude, node.longitude]);
          node.x = point.x - center.x + _s.camera.x;
          node.y = point.y - center.y + _s.camera.y;
        }
        else {
          // Hide node because it doesn't have geo coordinates
          // and store current "hidden" state
          if (node.leafletHidden === undefined) {
            node.leafletHidden = !!node.hidden;
          }
          node.hidden = true;
        }
      }
      _s.refresh();
    };

    /**
     * Set the map center and zoom after changes of the Sigma camera.
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
    };

    /**
     * Apply mandatory Sigma settings, update node coordinates from their
     * geospatial coordinates, and bind all event listeners.
     */
    this.enable = function() {
      showMapContainer();
      applySigmaSettings();

      // Reset camera cache
      _sigmaCamera = {
        x: _s.camera.x,
        y: _s.camera.y,
        ratio: _s.camera.ratio
      };

      _self.bindAll();
      _self.syncNodes();
    };

    /**
     * Restore the original Sigma settings and node coordinates,
     * and unbind event listeners.
     */
    this.disable = function() {
      hideMapContainer();
      _self.unbindAll();
      restoreSigmaSettings();
      restoreGraph();
    };

    /**
     * Fit the view to the nodes.
     *
     * @param  {?array}   nodes The set of nodes. Fit to all nodes otherwise.
     */
    this.fitBounds = function(nodes) {
      _map.fitBounds(_self.utils.geoBoundaries(nodes || _s.graph.nodes()));
    };

    /**
     * Bind all event listeners.
     *
     */
    this.bindAll = function() {
      if (_bound) return;
      _bound = true;
      forwardEvents();
      _s.bind('coordinatesUpdated', _self.syncMap);
      _map
        .on('zoomstart', hideGraphContainer)
        .on('zoomend', showGraphContainer);
    };

    /**
     * Unbind all event listeners.
     */
    this.unbindAll = function() {
      if (!_bound) return;
      _bound = false;
      cancelForwardEvents();
      _s.unbind('coordinatesUpdated', _self.syncMap);
      _map
        .off('zoomstart', hideGraphContainer)
        .off('zoomend', showGraphContainer);
    };

    /**
     * Unbind all event listeners, restore Sigma settings and delete all
     * references to Sigma and the Leaflet map.
     */
    this.kill = function() {
      _self.unbindAll();
      hideMapContainer();
      restoreSigmaSettings();
      _s = undefined;
      _renderer = undefined;
      _map = undefined;
      _sigmaCamera = undefined;
    };

    this.utils = {};

    /**
     * Compute the spatial boundaries of the nodes.
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
        if (node.hidden || !hasGeoCoordinates(node)) {
          continue; // skip node
        }
        maxLat = Math.max(node.latitude, maxLat);
        minLat = Math.min(node.latitude, minLat);
        maxLng = Math.max(node.longitude, maxLng);
        minLng = Math.min(node.longitude, minLng);
      }

      return L.latLngBounds(L.latLng(minLat, minLng), L.latLng(maxLat, maxLng));
    };


    // PRIVATE FUNCTIONS

    /**
     * Restore original cartesian coordinates of the nodes and "hidden" state.
     * Unpin all nodes.
     */
    function restoreGraph() {
      var nodes = _s.graph.nodes(),
        node;

      for (var i = 0; i < nodes.length; i++) {
        node = nodes[i];

        // Unpin node
        unfixNode(node);

        if (node.leafletHidden !== undefined) {
          node.hidden = node.leafletHidden;
          node.leafletHidden = undefined;
        }

        // TODO animate
        if (node.leafletX !== undefined) {
          node.x = node.leafletX;
          node.leafletX = undefined;
        }
        if (node.leafletY !== undefined) {
          node.y = node.leafletY;
          node.leafletY = undefined;
        }
      }
      _s.refresh();
    };

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
    };

    /**
     * Restore overriden sigma settings.
     */
    function restoreSigmaSettings() {
      if (!_settingsApplied) return;
      _settingsApplied = false;

      Object.keys(settings).forEach(function(key) {
        _s.settings(key, _sigmaSettings[key]);
      });
    };

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
      _renderer.container.style.visibility = 'hidden';
    }

    function showGraphContainer() {
      _renderer.container.style.visibility = '';
      _self.syncNodes();
    }

    function hideMapContainer() {
      _map.getContainer().style.opacity = 0;
      _map.getContainer().style.visibility = 'hidden';
    }

    function showMapContainer() {
      _map.getContainer().style.opacity = 1;
      _map.getContainer().style.visibility = '';
    }
  }


  /**
   * Interface
   * ------------------
   *
   * > var leafletPlugin = sigma.plugins.leaflet(s, map, s.renderers[0]);
   */
  var _instance = {};

  /**
   * @param  {sigma}                      s        The related sigma instance.
   * @param  {renderer}                   renderer The related renderer instance.
   * @param  {?sigma.plugins.activeState} a        The activeState plugin instance.
   */
  sigma.plugins.leaflet = function(sigInst, leafletMap, sigRenderer) {
    if (!sigInst) throw new Error('Missing argument: "sigInst"');
    if (!leafletMap) throw new Error('Missing argument: "leafletMap"');

    // Create instance if undefined
    if (!_instance[sigInst.id]) {
      _instance[sigInst.id] = new LeafletPlugin(sigInst, leafletMap, sigRenderer);

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
