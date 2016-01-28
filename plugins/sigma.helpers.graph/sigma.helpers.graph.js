;(function(undefined) {
  'use strict';

  if (typeof sigma === 'undefined')
    throw new Error('sigma is not declared');

  var _fixedNodesIndex = new sigma.utils.map();

  /**
   * Sigma Graph Helpers
   * =============================
   *
   * @author Sébastien Heymann <seb@linkurio.us> (Linkurious)
   * @version 0.2
   */

  /**
   * Attach methods to the graph to keep indexes updated.
   * ------------------
   */

  // Index the node after its insertion in the graph if `n.fixed` is `true`.
  sigma.classes.graph.attach(
    'addNode',
    'sigma.helpers.graph.addNode',
    function(n) {
      if (n.fixed) {
        _fixedNodesIndex.set(n.id, this.nodesIndex.get(n.id));
      }
    }
  );

  // Deindex the node before its deletion from the graph.
  sigma.classes.graph.attachBefore(
    'dropNode',
    'sigma.helpers.graph.dropNode',
    function(id) {
      _fixedNodesIndex.delete(id);
    }
  );

  // Deindex all nodes before the graph is cleared.
  sigma.classes.graph.attachBefore(
    'clear',
    'sigma.helpers.graph.clear',
    function() {
      _fixedNodesIndex.clear();
      _fixedNodesIndex = new sigma.utils.map();
    }
  );

  /**
   * This methods will set the value of `fixed` to `true` on a specified node.
   *
   * @param {string}     The node id.
   */
  if (!sigma.classes.graph.hasMethod('fixNode'))
    sigma.classes.graph.addMethod('fixNode', function(id) {
      if (this.nodesIndex.get(id)) {
        this.nodesIndex.get(id).fixed = true;
        _fixedNodesIndex.set(id, this.nodesIndex.get(id));
      }
      return this;
    });

  /**
   * This methods will set the value of `fixed` to `false` on a specified node.
   *
   * @param {string}     The node id.
   */
  if (!sigma.classes.graph.hasMethod('unfixNode'))
    sigma.classes.graph.addMethod('unfixNode', function(id) {
      if (this.nodesIndex.get(id)) {
        this.nodesIndex.get(id).fixed = undefined;
        _fixedNodesIndex.delete(id);
      }
      return this;
    });

  /**
   * This methods returns the list of fixed nodes.
   *
   * @return {array}     The array of fixed nodes.
   */
  if (!sigma.classes.graph.hasMethod('getFixedNodes'))
    sigma.classes.graph.addMethod('getFixedNodes', function() {
      var nodes = [];
      _fixedNodesIndex.forEach(function(n, id) {
        nodes.push(n);
      });
      return nodes;
    });

  /**
   * This methods returns true if fixed nodes exist.
   *
   * @return {boolean}
   */
  if (!sigma.classes.graph.hasMethod('hasFixedNodes'))
    sigma.classes.graph.addMethod('hasFixedNodes', function() {
      return _fixedNodesIndex.size != 0;
    });


  /**
   * This methods drops a set of nodes from the graph.
   *
   * @param  {string|array} v One id, or an array of ids.
   * @return {sigma.graph}    The instance itself.
   */
  if (!sigma.classes.graph.hasMethod('dropNodes'))
    sigma.classes.graph.addMethod('dropNodes', function(v) {
      if (arguments.length > 1)
        throw new Error('Too many arguments. Use an array instead.');

      if (typeof v === 'string' || typeof v === 'number')
        this.dropNode(v);

      else if (Array.isArray(v)) {
        var i, l;
        for (i = 0, l = v.length; i < l; i++)
          if (typeof v[i] === 'string' || typeof v[i] === 'number')
            this.dropNode(v[i]);
          else
            throw new TypeError('Invalid argument: a node id is not a string or a number, was ' + v[i]);
      }
      else
        throw new TypeError('Invalid argument: "v" is not a string, a number, or an array, was ' + v);

      return this;
    });

  /**
   * This methods drops a set of edges from the graph.
   *
   * @param  {string|array} v One id, or an array of ids.
   * @return {sigma.graph}    The instance itself.
   */
  if (!sigma.classes.graph.hasMethod('dropEdges'))
    sigma.classes.graph.addMethod('dropEdges', function(v) {
      if (arguments.length > 1)
        throw new Error('Too many arguments. Use an array instead.');

      if (typeof v === 'string' || typeof v === 'number')
        this.dropEdge(v);

      else if (Array.isArray(v)) {
        var i, l;
        for (i = 0, l = v.length; i < l; i++)
          if (typeof v[i] === 'string' || typeof v[i] === 'number')
            this.dropEdge(v[i]);
          else
            throw new TypeError('Invalid argument: an edge id is not a string or a number, was ' + v[i]);
      }
      else
        throw new TypeError('Invalid argument: it is not a string, a number, or an array, was ' + v);

      return this;
    });

  /**
   * This methods returns an array of nodes that are adjacent to a node.
   *
   * @param  {number|string} id    The node id.
   * @param  {?object}  options:
   *         {?boolean} withHidden Get not hidden nodes if set false, all
   *                               nodes otherwise.
   * @return {array}               The array of adjacent nodes.
   */
  if (!sigma.classes.graph.hasMethod('adjacentNodes'))
    sigma.classes.graph.addMethod('adjacentNodes', function(id, options) {
      options = options || {};
      options.withHidden = (arguments.length == 2) ? options.withHidden : true;


      if (typeof id !== 'string' && typeof id !== 'number')
        throw new TypeError('The node id is not a string or a number, was ' + id);

      var self = this,
          target,
          edgeNotHidden,
          nodes = [];
      (this.allNeighborsIndex.get(id) || []).forEach(function(map, target) {
        if (options.withHidden) {
          nodes.push(self.nodesIndex.get(target));
        }
        else if (!self.nodes(target).hidden) {
          // check if at least one non-hidden edge exists
          // between the node and the target node:
          edgeNotHidden =
            self.allNeighborsIndex.get(id).get(target).keyList().map(function(eid) {
              return self.edges(eid);
            })
            .filter(function(e) {
              return !e.hidden;
            })
            .length != 0;

          if (edgeNotHidden) {
            nodes.push(self.nodesIndex.get(target));
          }
        }
      });

      return nodes;
    });

  /**
   * This methods returns an array of edges that are adjacent to a node.
   *
   * @param  {number|string} id    The node id.
   * @param  {?object}  options:
   *         {?boolean} withHidden Get not hidden nodes if set false, all
   *                               nodes otherwise.
   * @return {array}               The array of adjacent edges.
   */
  if (!sigma.classes.graph.hasMethod('adjacentEdges'))
    sigma.classes.graph.addMethod('adjacentEdges', function(id, options) {
      options = options || {};
      options.withHidden = (arguments.length == 2) ? options.withHidden : true;


      if (typeof id !== 'string' && typeof id !== 'number')
        throw new TypeError('The node id is not a string or a number, was ' + id);

      var self = this,
          a = this.allNeighborsIndex.get(id) || [],
          eid,
          edges = [];

      a.forEach(function(map, target) {
        a.get(target).forEach(function(map2, eid) {
          if (options.withHidden || !self.edges(eid).hidden) {
            edges.push(self.edges(eid));
          }
        });
      });

      return edges;
    });

}).call(this);
