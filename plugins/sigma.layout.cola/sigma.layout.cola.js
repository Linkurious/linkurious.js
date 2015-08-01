;(function() {
  'use strict';

  if (typeof sigma === 'undefined') {
    throw 'sigma is not declared';
  }

  // default layout options
  var defaultOptions = {
    avoidOverlaps: true,
    convergenceThreshold: 0.01,
    handleDisconnected: true,
    initialUnconstrainedIterations: 0,
    initialUserConstraintIterations: 0,
    initialAllConstraintsIterations: 0,
    symmetricDiffLinkLengths: 6
  };

  function ColaLayout(sigInst, options, dragListener) {
    //initialize cola instance
    this.animationFrame = new AnimationFrame();
    this.colaNodeIndices = {};
    this.dragListener = dragListener;
    // this.dragListener = sigma.plugins.dragNodes(
    //   sigInst,
    //   sigInst.renderers[0]);
    this.options = defaultOptions;
    this.sigInst = sigInst;

    for (var i in options) {
      if (options[i].hasOwnProperty) {
        this.options[i] = options[i];
      }
    }
  }

  ColaLayout.prototype.start = function() {
    var animationFrame = this.animationFrame,
      colaLinks = [],
      colaNodeIndices = {},
      container = this.sigInst.renderers[0].container,
      dragListener = this.dragListener,
      edges = this.sigInst.graph.edges(),
      nodes = this.sigInst.graph.nodes(),
      options = this.options,
      parentNodes = [],
      sigInst = this.sigInst;

    nodes.forEach(function(node, index) {
      // set up node boundaries
      node.width = node.size * 2;
      node.height = node.size * 2;
      colaNodeIndices[node.id] = index;
    });

    edges.forEach(function(edge) {
      // set up cola edges
      var sourceIndex = colaNodeIndices[edge.source];
      var targetIndex = colaNodeIndices[edge.target];

      // keep track of all parent nodes, so we can use this to create
      // layout constraints
      if (parentNodes[sourceIndex] == null) {
        parentNodes[sourceIndex] = [];
      }

      parentNodes[sourceIndex].push(targetIndex);
      colaLinks.push({
        source: colaNodeIndices[edge.source],
        target: colaNodeIndices[edge.target]
      });
    });

    var adaptor = cola.adaptor({
      trigger: function() {
        // trigger gets called on simulation events: start, tick, and
        // end. Update sigma nodes when one of these events occurs
        sigInst.refresh();
      },
      kick: function(tick) {
        // we may want to decrease number of tick per frame
        function frame() {
          if (tick()) {
            return;
          }
          animationFrame.request(frame);
        }
        animationFrame.request(frame);
      },
      on: function() {
      },
      drag: function() {
        // handled in dragListener
      }
    });

    // initialize cola adaptor
    adaptor
      .size([container.offsetWidth, container.offsetHeight])
      .avoidOverlaps(options.avoidOverlaps)
      .nodes(nodes)
      .links(colaLinks)
      .handleDisconnected(options.handleDisconnected)
      .convergenceThreshold(options.convergenceThreshold);

    // lazy contraints logic to align child nodes
    if (options.constraints == null && options.alignment != null &&
      (options.alignment === 'x' || options.alignment === 'y')) {
      var constraints = [];
      parentNodes.forEach(function(parentNode) {
        var constraint = {'type': 'alignment',
          'axis': options.alignment,
          'offsets': []};
        parentNode.forEach(function(target) {
          constraint.offsets.push({node: target, offset: 0});
        });
        constraints.push(constraint);
      });
      adaptor.constraints(constraints);
    }

    if (options.constraints != null) {
      adaptor.constraints(options.constraints);
    }

    if (options.linkLength) {
      adaptor.linkDistance(options.linkLength);
    }

    if (options.flow != null &&
        options.flow.axis != null) {
      var minSeparation = options.flow.minSeparation != null ?
          options.flow.minSeparation : 0;
      adaptor.flowLayout(options.flow.axis, minSeparation);
    }

    adaptor.start(options.initialUnconstrainedIterations,
        options.initialUserConstraintIterations,
        options.initialAllConstraintsIterations);

    // use dragListener from sigma to perform drag actions
    if (dragListener) {
      dragListener.bind('startdrag', function(e) {
        adaptor.dragstart(e.data.node);
        adaptor.resume();
      });

      dragListener.bind('drag', function(e) {
        var node = e.data.node;
        node.px = node.x;
        node.py = node.y;
      });

      dragListener.bind('dragend', function(e) {
        var node = e.data.node;
        node.px = node.x;
        node.py = node.y;
        adaptor.resume();
        adaptor.dragend(e.data.node);
      });
    }

    this.adaptor = adaptor;
  };

  ColaLayout.prototype.stop = function() {
    if (this.adaptor) {
      this.adaptor.stop();
    }
    return this;
  };

  /**
   * Interface
   * ---------
   */

  sigma.prototype.startCola = function(config, dragListener) {
    if (!this.cola) {
      this.cola = new ColaLayout(this, config);
    }

    this.cola.start();
    return this;
  };

  sigma.prototype.stopCola = function() {
    if (this.cola) {
      this.cola.stop();
    }

    return this;
  };

  sigma.prototype.killCola = function() {
    if (this.cola) {
      this.cola.stop();
      this.cola = null;
    }

    return this;
  };

  sigma.prototype.isColaRunning = function() {
    return this.cola != null;
  };
})();
