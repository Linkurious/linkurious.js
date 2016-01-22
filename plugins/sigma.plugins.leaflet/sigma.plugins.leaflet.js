;(function(undefined) {
  'use strict';

  if (typeof sigma === 'undefined')
    throw new Error('sigma is not declared');

  if (typeof L === 'undefined')
    console.warn('to use the leaflet plugin, '
      +'you have to include leaflet');

  // Initialize package:
  sigma.utils.pkg('sigma.plugins.leaflet');


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
      _renderer = sigRenderer || sigInst.renderers[0],
      _sigmaSettings = {},

      // Cache camera properties
      _sigmaCamera = {
        x: sigInst.camera.x,
        y: sigInst.camera.y,
        ratio: sigInst.camera.ratio
      };

    /**
     * Set nodes positions from spatial coordinates and refresh sigma.
     */
    this.syncGraph = function() {
      var
        center = _map.project(_map.getCenter()),
        nodes = _s.graph.nodes(),
        node,
        point;

      for (var i = 0; i < nodes.length; i++) {
        node = nodes[i];
        if (node.hidden || node.latitude == undefined || node.longitude == undefined) {
          continue; // skip node
        }
        point = _map.project([node.latitude, node.longitude]);
        node.x = point.x - center.x + sigInst.camera.x;
        node.y = point.y - center.y + sigInst.camera.y;
      }
      _s.refresh();
    }

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
    }

    /**
     * Apply mandatory settings to sigma for the integration to work.
     * Cache overriden sigma settings to be restored when the plugin is killed.
     */
    this.applySigmaSettings = function() {
      Object.keys(settings).forEach(function(key) {
        _sigmaSettings[key] = _s.settings(key);
        _s.settings(key, settings[key]);
      });
    }

    /**
     * Restore overriden sigma settings
     */
    this.restoreSigmaSettings = function() {
      Object.keys(settings).forEach(function(key) {
        _s.settings(key, _sigmaSettings[key]);
      });
    }

    /**
     * Fit the view to the nodes.
     *
     * @param  {?array}   nodes The set of nodes. Fit to all nodes otherwise.
     */
    this.fitBounds = function(nodes) {
      _map.fitBounds(_self.utils.geoBoundaries(nodes || _s.graph.nodes()));
    }

    this.bindAll = function() {
      forwardEvents();
      _s.bind('coordinatesUpdated', _self.syncMap);
      _map
        .on('zoomstart', hideContainer)
        .on('zoomend', showContainer);
    }

    this.unbindAll = function() {
      cancelForwardEvents();
      _s.unbind('coordinatesUpdated', _self.syncMap);
      _map
        .off('zoomstart', hideContainer)
        .off('zoomend', showContainer);
    };

    this.kill = function() {
      _self.unbindAll();
      _self.restoreSigmaSettings();
      _s = undefined;
      _renderer = undefined;
      _map = undefined;
      _sigmaCamera = undefined;
    };

    this.applySigmaSettings();
    this.bindAll();
    this.syncGraph();

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
        if (node.hidden || node.latitude == undefined || node.longitude == undefined) {
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

    function hideContainer() {
      _renderer.container.style.visibility = 'hidden';
    }

    function showContainer() {
      _renderer.container.style.visibility = '';
      _self.syncGraph();
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
