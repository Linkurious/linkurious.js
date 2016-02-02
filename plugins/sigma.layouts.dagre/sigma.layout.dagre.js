;(function(undefined) {
  'use strict';

  if (typeof sigma === 'undefined')
    throw new Error('sigma is not declared');

  if (typeof dagre === 'undefined' || typeof dagre.graphlib === 'undefined')
    console.warn('to use the dagre plugin, '
      +'you have to include dagre and dagre.graphlib');

  // Initialize package:
  sigma.utils.pkg('sigma.layouts.dagre');

  /**
   * Sigma Dagre layout
   * ===============================
   *
   * Require https://github.com/cpettitt/dagre
   * Author: Sébastien Heymann @ Linkurious
   * Version: 0.1
   */

  // see https://github.com/cpettitt/dagre/wiki#configuring-the-layout
  var settings = {
    directed: true, // take edge direction into account
    multigraph: true, // allows multiple edges between the same pair of nodes
    compound: false, //

    // dagre algo options
    rankDir: 'TB', // Direction for rank nodes. Can be TB, BT, LR, or RL,
                   // where T = top, B = bottom, L = left, and R = right.
  };

  var _instance = {};

  /**
   * Event emitter Object
   * ------------------
   */
  var _eventEmitter = {};

  function getBoundaries(nodes, prefix) {
    var i,
        l,
        prefix = prefix || '',
        sizeMax = -Infinity,
        minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

    for (i = 0, l = nodes.length; i < l; i++) {
      sizeMax = Math.max(nodes[i][prefix + 'size'], sizeMax);
      maxX = Math.max(nodes[i][prefix + 'x'], maxX);
      minX = Math.min(nodes[i][prefix + 'x'], minX);
      maxY = Math.max(nodes[i][prefix + 'y'], maxY);
      minY = Math.min(nodes[i][prefix + 'y'], minY);
    }

    sizeMax = sizeMax || 1;

    return {
      sizeMax: sizeMax,
      minX: minX,
      minY: minY,
      maxX: maxX,
      maxY: maxY
    };
  };

  function scaleRange (value, baseMin, baseMax, limitMin, limitMax) {
    return ((limitMax - limitMin) * (value - baseMin) / (baseMax - baseMin)) + limitMin;
  };

  function rescalePosition(point, baseBox, limitBox) {
    return {
      x: scaleRange(point.x, baseBox.minX, baseBox.maxX, limitBox.minX, limitBox.maxX),
      y: scaleRange(point.y, baseBox.minY, baseBox.maxY, limitBox.minY, limitBox.maxY)
    }
  };

  /**
   * Dagre Object
   * ------------------
   */
  function dagreLayout() {
    if (typeof dagre === 'undefined')
      throw new Error('dagre is not declared');

    if (typeof dagre.graphlib === 'undefined')
      throw new Error('dagre.graphlib is not declared');

    var
      self = this,
      dg;

    this.init = function (sigInst, options) {
      options = options || {};

      if (options.nodes) {
        this.nodes = options.nodes;
        delete options.nodes;
      }

      if (options.boundingBox) {
        this.boundingBox = options.boundingBox;
        delete options.boundingBox;
      }

      // Properties
      this.sigInst = sigInst;
      this.config = sigma.utils.extend(options, settings);
      this.easing = options.easing;
      this.duration = options.duration;

      if (this.easing && (!sigma.plugins || typeof sigma.plugins.animate === 'undefined')) {
        throw new Error('sigma.plugins.animate is not declared');
      }

      // State
      this.running = false;
    };

    this.start = function() {
      if (this.running) return;

      this.running = true;

      // Create a new directed graph
      dg = new dagre.graphlib.Graph({
        directed: this.config.directed,
        multigraph: this.config.multigraph,
        compound: this.config.compound
      });

      // Set an object for the graph label
      dg.setGraph(this.config);

      var nodes = this.nodes || this.sigInst.graph.nodes();
      for (var i = 0; i < nodes.length; i++) {
        if (!nodes[i].fixed) {
          dg.setNode(nodes[i].id, {});
        }
      }

      if (this.boundingBox === true) {
        this.boundingBox = getBoundaries(nodes);
      }

      var edges = this.sigInst.graph.edges();
      for (var i = 0; i < edges.length; i++) {
        if (dg.node(edges[i].source) != null && dg.node(edges[i].target) != null) {
          dg.setEdge(edges[i].source, edges[i].target, { id: edges[i].id });
        }
      };

      _eventEmitter[self.sigInst.id].dispatchEvent('start');

      // console.time('sigma.layouts.dagre');
      dagre.layout(dg);
      // console.timeEnd('sigma.layouts.dagre');

      var edge;
      dg.edges().map(function(e) {
        edge = self.sigInst.graph.edges(dg.edge(e).id);
        edge.points = dg.edge(e).points;
      });

      this.stop();
    };

    this.stop = function() {
      if (!dg) return;

      var nodes = dg.nodes().map(function(nid) {
        return self.sigInst.graph.nodes(nid) || self.sigInst.graph.nodes(Number(nid));
      });

      var coord;

      if (this.boundingBox) {
        var baseBoundingBox = getBoundaries(dg.nodes().map(function(nid) {
          return dg.node(nid);
        }));
      }

      this.running = false;

      if (this.easing) {
        // Set new node coordinates
        for (var i = 0; i < nodes.length; i++) {
          if (this.boundingBox) {
            coord = rescalePosition(dg.node(nodes[i].id), baseBoundingBox, self.boundingBox);
            nodes[i].dagre_x = coord.x;
            nodes[i].dagre_y = coord.y;
          }
          else {
            nodes[i].dagre_x = dg.node(nodes[i].id).x;
            nodes[i].dagre_y = dg.node(nodes[i].id).y;
          }
        }

        _eventEmitter[self.sigInst.id].dispatchEvent('interpolate');
        sigma.plugins.animate(
          self.sigInst,
          {
            x: 'dagre_x',
            y: 'dagre_y'
          },
          {
            nodes: nodes,
            easing: self.easing,
            onComplete: function() {
              for (var i = 0; i < nodes.length; i++) {
                nodes[i].dagre_x = null;
                nodes[i].dagre_y = null;
              }
              _eventEmitter[self.sigInst.id].dispatchEvent('stop');
              self.sigInst.refresh();
            },
            duration: self.duration
          }
        );
      }
      else {
        // Apply changes
        var node;
        dg.nodes().forEach(function(nid) {
          node = self.sigInst.graph.nodes(nid);
          node.x = dg.node(nid).x;
          node.y = dg.node(nid).y;
        });

        _eventEmitter[self.sigInst.id].dispatchEvent('stop');
        this.sigInst.refresh();
      }
    };

    this.kill = function() {
      this.sigInst = null;
      this.config = null;
      this.easing = null;
    };
  };



  /**
   * Interface
   * ----------
   */

  /**
   * Configure the layout algorithm.

   * Recognized options:
   * **********************
   * Here is the exhaustive list of every accepted parameters in the settings
   * object:
   *
   *   {?array}             nodes      The subset of nodes to apply the layout.
   *   {?object}           boundingBox Constrain layout bounds. Value: {minX, maxX, minY, maxY}
   *                                   or true (all current positions of the given nodes)
   *   {?boolean}           directed   If `true`, take edge direction into
   *                                   account. Default: `true`.
   *   {?boolean}           multigraph If `true`, allows multiple edges between
   *                                   the same pair of nodes. Default: `true`.
   *   {?boolean}           compound   If `true`, allows ompound nodes, i.e.
   *                                   nodes which can be the parent of other
   *                                   nodes. Default: `false`.
   *   {?string}            rankDir    Direction for rank nodes. Can be TB, BT,
   *                                   LR, or RL, where T = top, B = bottom,
   *                                   L = left, and R = right.
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
   *
   * @param  {sigma}   sigInst The related sigma instance.
   * @param  {object} config  The optional configuration object.
   *
   * @return {sigma.classes.dispatcher} Returns an event emitter.
   */
  sigma.layouts.dagre.configure = function(sigInst, config) {
    if (!sigInst) throw new Error('Missing argument: "sigInst"');
    if (!config) throw new Error('Missing argument: "config"');

    // Create instance if undefined
    if (!_instance[sigInst.id]) {
      _instance[sigInst.id] = new dagreLayout();

      _eventEmitter[sigInst.id] = {};
      sigma.classes.dispatcher.extend(_eventEmitter[sigInst.id]);

      // Binding on kill to clear the references
      sigInst.bind('kill', function() {
        _instance[sigInst.id].kill();
        _instance[sigInst.id] = null;
        _eventEmitter[sigInst.id] = null;
      });
    }

    _instance[sigInst.id].init(sigInst, config);

    return _eventEmitter[sigInst.id];
  };

  /**
   * Start the layout algorithm. It will use the existing configuration if no
   * new configuration is passed.

   * Recognized options:
   * **********************
   * Here is the exhaustive list of every accepted parameters in the settings
   * object:
   *
   *   {?array}             nodes      The subset of nodes to apply the layout.
   *   {?object}           boundingBox Constrain layout bounds. Value: {minX, maxX, minY, maxY}
   *                                   or true (all current positions of the given nodes).
   *   {?boolean}           directed   If `true`, take edge direction into
   *                                   account. Default: `true`.
   *   {?boolean}           multigraph If `true`, allows multiple edges between
   *                                   the same pair of nodes. Default: `true`.
   *   {?boolean}           compound   If `true`, allows ompound nodes, i.e.
   *                                   nodes which can be the parent of other
   *                                   nodes. Default: `false`.
   *   {?string}            rankDir    Direction for rank nodes. Can be TB, BT,
   *                                   LR, or RL, where T = top, B = bottom,
   *                                   L = left, and R = right.
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
   *
   * @param  {sigma}   sigInst The related sigma instance.
   * @param  {?object} config  The optional configuration object.
   *
   * @return {sigma.classes.dispatcher} Returns an event emitter.
   */
  sigma.layouts.dagre.start = function(sigInst, config) {
    if (!sigInst) throw new Error('Missing argument: "sigInst"');

    if (config) {
      this.configure(sigInst, config);
    }

    _instance[sigInst.id].start();

    return _eventEmitter[sigInst.id];
  };

  /**
   * Returns true if the layout has started and is not completed.
   *
   * @param  {sigma}   sigInst The related sigma instance.
   *
   * @return {boolean}
   */
  sigma.layouts.dagre.isRunning = function(sigInst) {
    if (!sigInst) throw new Error('Missing argument: "sigInst"');

    return !!_instance[sigInst.id] && _instance[sigInst.id].running;
  };

}).call(this);
