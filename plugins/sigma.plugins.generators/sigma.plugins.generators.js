;(function(undefined) {
  'use strict';

  if (typeof sigma === 'undefined')
    throw new Error('sigma is not declared');

  sigma.utils.pkg('sigma.plugins');

  sigma.plugins.generators = {}; // collection of generators

  function isNumber(value) {
    // source: is.js
    // NaN is number :)
    return value === value && Object.prototype.toString.call(value) === '[object Number]';
  };

  function isObject(value) {
    // source: is.js
    return typeof value === 'object' && !!value;
  };

  /**
   * Generates a random graph.
   *
   * @param  {object} options
   * @param  {number} options.nbNodes The number of nodes.
   * @param  {number} options.nbEdges The number of edges.
   * @return {object}         A graph object that can be read by sigma.classes.graph
   */
  sigma.plugins.generators.random = function(options) {
    if (!options)
      throw new Error('Missing argument: options');
    if (!isObject(options))
      throw new TypeError('Invalid argument: options is not an object, was ' + options);
    if (!isNumber(options.nbNodes) || options.nbNodes < 1)
      throw new TypeError('Invalid argument: options.nbNodes is not a positive number, was ' + options.nbNodes);
    if (!isNumber(options.nbEdges) || options.nbEdges < 1)
      throw new TypeError('Invalid argument: options.nbEdges is not a number, was ' + options.nbEdges);

    var i,
        N = options.nbNodes,
        E = options.nbEdges,
        g = {
          nodes: [],
          edges: []
        };

    // Generate a random graph:
    for (i = 0; i < N; i++)
      g.nodes.push({
        id: 'n' + i,
        label: 'Node ' + i,
        x: Math.random(),
        y: Math.random(),
        size: 1
      });

    for (i = 0; i < E; i++)
      g.edges.push({
        id: 'e' + i,
        label: 'Edge ' + i,
        source: 'n' + (Math.random() * N | 0),
        target: 'n' + (Math.random() * N | 0)
      });

    return g;
  };

  /**
   * Generates a simple balanced tree.
   * Source: https://github.com/gka/randomgraph.js (license: public domain)
   *
   * @param  {object} options
   * @param  {number} options.nbChildren The number of children each node has.
   * @param  {number} options.height     The height of the tree.
   * @return {object}   A graph object that can be read by sigma.classes.graph
   */
  sigma.plugins.generators.balancedTree = function(options) {
    if (!options)
      throw new Error('Missing argument: options');
    if (!isObject(options))
      throw new TypeError('Invalid argument: options is not an object, was ' + options);
    if (!isNumber(options.nbChildren) || options.nbChildren < 1)
      throw new TypeError('Invalid argument: options.nbChildren is not a positive number, was ' + options.nbChildren);
    if (!isNumber(options.height) || options.height < 1)
      throw new TypeError('Invalid argument: options.height is not a positive number, was ' + options.height);

    var v = 0,
        m = 0,
        R = options.nbChildren,
        H = options.height,
        graph = {
          nodes: [{
            id: 'n0',
            label: 'Node 0',
            x: Math.random(),
            y: Math.random(),
            size: 1,
            index: 0
          }],
          edges: []
        },
        newLeaves = [],
        i, j, height, node, leaves;

    for (i = 0; i < R; i++) {
      node = {
        id: 'n' + (++v),
        label: 'Node '+ v,
        x: Math.random(),
        y: Math.random(),
        size: 1,
        index: (v - 1)
      };
      graph.nodes.push(node);
      newLeaves.push(node);
      graph.edges.push({
        id: 'e' + (m++),
        label: 'Edge ' + m,
        source: 'n0',
        target: 'n' + v
      });
    }

    for (height = 1; height < H; height++) {
      leaves = newLeaves;
      newLeaves = [];
      for (j = 0; j < leaves.length; j++) {
        for (i = 0; i < R; i++) {
          node = {
            id: 'n' + (++v),
            label: 'Node '+ v,
            x: Math.random(),
            y: Math.random(),
            size: 1,
            index: (v - 1)
          };
          newLeaves.push(node);
          graph.nodes.push(node);
          graph.edges.push({
            id: 'e' + (m++),
            label: 'Edge ' + m,
            source: 'n' + leaves[j].index,
            target: 'n' + v
          });
        }
      }
    }
    return graph;
  };

  /**
   * Generates an Erdős–Rényi graph. Call it with options (n,p) or (n,m).
   * Source: https://github.com/gka/randomgraph.js (license: public domain)
   *
   * @param  {object}  options
   * @param  {number}  options.nbNodes The number of nodes.
   * @param  {?number} options.p The probability [0..1] of a edge between any two nodes.
   * @param  {?number} options.nbEdges The number of edges.
   * @return {object}    A graph object that can be read by sigma.classes.graph
   */
  sigma.plugins.generators.erdosRenyi = function(options) {
    if (!options)
      throw new Error('Missing argument: options');
    if (!isObject(options))
      throw new TypeError('Invalid argument: options is not an object, was ' + options);
    if (!isNumber(options.nbNodes) || options.nbNodes < 1)
      throw new TypeError('Invalid argument: options.nbNodes is not a positive number, was ' + options.nbNodes);
    if (options.nbNodes < 3)
      throw new TypeError('Invalid argument: options.nbNodes is smaller than 3, was ' + options.nbNodes);
    if ('nbEdges' in options && 'p' in options)
      throw new TypeError('Invalid argument: choose between options.nbEdges and options.p');

    var graph = { nodes: [], edges: [] },
      edge,
      i,
      j,
      k = 0,
      N = options.nbNodes,
      P = options.p;

    if (options.p >= 0) {
      if (!isNumber(options.p) || options.p < 0)
        throw new TypeError('Invalid argument: options.p is not a positive number, was ' + options.p);

      for (i = 0; i < N; i++) {
        graph.nodes.push({
          id: 'n' + i,
          label: 'Node '+ i,
          x: Math.random(),
          y: Math.random(),
          size: 1
        });
        for (j = 0; j < i; j++) {
          if (Math.random() < P) {
            graph.edges.push({
              id: 'e' + (k++),
              label: 'Edge ' + k,
              source: 'n' + i,
              target: 'n' + j
            });
          }
        }
      }
    }
    else {
      if (!isNumber(options.nbEdges) || options.nbEdges < 1)
        throw new TypeError('Invalid argument: options.nbEdges is not a positive number, was ' + options.nbEdges);

      var tmpEdges = [],
        M = options.nbEdges,
        k;

      for (i = 0; i < N; i++) {
        graph.nodes.push({
          id: 'n' + i,
          label: 'Node '+ i,
          x: Math.random(),
          y: Math.random(),
          size: 1
        });
        for (j = i + 1; j < N; j++) {
          tmpEdges.push({
            source: 'n' + i,
            target: 'n' + j
          });
        }
      }
      // pick m random edges from tmpEdges
      k = tmpEdges.length - 1;
      for (i = 0; i < M; i++) {
        edge = tmpEdges.splice(Math.floor(Math.random() * k), 1)[0];
        edge.id = 'e' + i;
        edge.label = 'Edge ' + i;
        graph.edges.push(edge);
        k--;
      }
    }
    return graph;
  };

  /**
   * Generates a Barabási–Albert graph.
   * Source: https://github.com/gka/randomgraph.js (license: public domain)
   *
   * @param  {object} options
   * @param  {number} options.nbNodes The total number of nodes  N  > 0
   * @param  {number} options.m0      m0 > 0 && m0 <  N
   * @param  {number} options.m       M  > 0 && M  <= m0
   * @return {object}   A graph object that can be read by sigma.classes.graph
   */
  sigma.plugins.generators.barabasiAlbert = function(options) {
    if (!options)
      throw new Error('Missing argument: options');
    if (!isObject(options))
      throw new TypeError('Invalid argument: options is not an object, was ' + options);
    if (!isNumber(options.nbNodes) || options.nbNodes < 1)
      throw new TypeError('Invalid argument: options.nbNodes is not a positive number, was ' + options.nbNodes);
    if (options.nbNodes < 3)
      throw new TypeError('Invalid argument: options.nbNodes is smaller than 3, was ' + options.nbNodes);
    if (!isNumber(options.m0) || options.m0 <= 0)
      throw new TypeError('Invalid argument: options.m0 is not a positive number, was ' + options.m0);
    if (!isNumber(options.m) || options.m <= 0)
      throw new TypeError('Invalid argument: options.m is not a positive number, was ' + options.m);
    if (options.m0 >= options.nbNode)
      throw new TypeError('Invalid argument: options.m0 is greater than options.nbNodes, was ' + options.m0);
    if (options.m > options.m0)
      throw new TypeError('Invalid argument: options.m is strictly greater than options.m0, was ' + options.m);

    var graph = { nodes: [], edges: [] },
      edge_lut = {},
      degrees = [],
      i, j, edge, sum, s, m, r, p,
      k = 0,
      N = options.nbNodes,
      m0 = options.m0,
      M = options.m;

    // creating m0 nodes
    for (i = 0; i < m0; i++) {
      graph.nodes.push({
        id: 'n' + i,
        label: 'node '+ i,
        x: Math.random(),
        y: Math.random(),
        size: 1
      });
      degrees[i] = 0;
    }
    // Linking every node with each other (no self-loops)
    for (i = 0; i < m0; i++) {
      for (j = i + 1; j < m0; j++) {
        edge = {
          id: 'e' + (k++),
          label: 'Edge ' + k,
          source: 'n' + i,
          target: 'n' + j
        };
        edge_lut[edge.source + '-' + edge.target] = edge;
        graph.edges.push(edge);
        degrees[i]++;
        degrees[j]++;
      }
    }
    // Adding N - m0 nodes, each with M edges
    for (i = m0; i < N; i++) {
      graph.nodes.push({
        id: 'n' + i,
        label: 'node '+ i,
        x: Math.random(),
        y: Math.random(),
        size: 1
      });
      degrees[i] = 0;
      sum = 0;  // sum of all nodes degrees
      for (j = 0; j < i; j++) sum += degrees[j];
      s = 0;
      for (m = 0; m < M; m++) {
        r = Math.random();
        p = 0;
        for (j = 0; j < i; j++) {
          if (edge_lut[i + '-' + j] || edge_lut[j + '-' + i]) continue;
          if (i == 1) p = 1;
          else {
            p += degrees[j] / sum + s / (i - m);
          }

          if (r <= p) {
            s += degrees[j] / sum;
            edge = {
              id: 'e' + (k++),
              label: 'Edge ' + k,
              source: 'n' + i,
              target: 'n' + j
            };
            edge_lut[edge.source + '-' + edge.target] = edge;
            graph.edges.push(edge);
            degrees[i]++;
            degrees[j]++;
            break;
          }
        }
      }
    }
    return graph;
  };

  /**
   * Generates a Watts-Strogatz Small World graph.
   * Call it with options alpha or beta to run the corresponding model.
   * Source: https://github.com/gka/randomgraph.js (license: public domain)
   *
   * @param  {object}  options
   * @param  {number}  options.nbNodes The number of nodes.
   * @param  {number}  options.k       The mean degree of nodes (even integer).
   * @param  {?number} options.alpha   The rewiring probability [0..1].
   * @param  {?number} options.beta    The rewiring probability [0..1].
   * @return {object}    A graph object that can be read by sigma.classes.graph
   */
  sigma.plugins.generators.wattsStrogatz = function(options) {
    if (!options)
      throw new Error('Missing argument: options');
    if (!isObject(options))
      throw new TypeError('Invalid argument: options is not an object, was ' + options);
    if (!isNumber(options.nbNodes) || options.nbNodes < 1)
      throw new TypeError('Invalid argument: options.nbNodes is not a positive number, was ' + options.nbNodes);
    if (options.nbNodes < 3)
      throw new TypeError('Invalid argument: options.nbNodes is smaller than 3, was ' + options.nbNodes);
    if (!isNumber(options.k) || (options.k % 2) != 0)
      throw new TypeError('Invalid argument: options.k is not an even integer, was ' + options.k);

    var graph = { nodes: [], edges: [] },
      i, j, k = 0, edge,
      edge_lut = {},
      N = options.nbNodes,
      K = options.k;

    function calculateRij(i, j) {
      if (i == j || edge_lut[i + '-' + j]) return 0;
      var mij = calculatemij(i, j);
      if (mij >= K) return 1;
      if (mij === 0) return p;
      return Math.pow(mij / K, options.alpha) * (1 - p) + p;
    };

    function calculatemij(i, j) {
      var mij = 0, l;
      for (l = 0; l < N; l++) {
        if (l != i && l != j && edge_lut[i + '-' + l] && edge_lut[j + '-' + l]) {
          mij++;
        }
      }
      return mij;
    };

    if ('alpha' in options) {
      if (!isNumber(options.alpha) || options.alpha < 0 || options.alpha > 1)
        throw new TypeError('Invalid argument: options.alpha is not a number between [0,1], was ' + options.alpha);

      var p = Math.pow(10, -10),
        ec = 0,
        ids = [],
        nk_half = N * K / 2,
        Rij, sumRij, r, pij;

      for (i = 0; i < N; i++) {
        graph.nodes.push({
          id: 'n' + i,
          label: 'Node '+ i,
          x: Math.random(),
          y: Math.random(),
          size: 1
        });
        // create a latice ring structure
        edge = {
          id: 'e' + (k++),
          label: 'Edge '+ k,
          source: 'n' + i,
          target: 'n' + ((i + 1) % N)
        };
        edge_lut[edge.source + '-' + edge.target] = edge;
        graph.edges.push(edge);
        ec++;
      }
      // Creating N * K / 2 edges
      while (ec < nk_half) {
        for (i = 0; i < N; i++) {
          ids.push(i);
        }
        while (ec < nk_half && ids.length > 0) {
          i = ids.splice(Math.floor(Math.random() * ids.length), 1)[0];
          Rij = [];
          sumRij = 0;
          for (j = 0; j < N; j++) {
            Rij[j] = calculateRij(i, j);
            sumRij += Rij[j];
          }
          r = Math.random();
          pij = 0;
          for (j = 0; j < N; j++) {
            if (i != j) {
              pij += Rij[j] / sumRij;
              if (r <= pij) {
                edge = {
                  id: 'e' + (k++),
                  label: 'Edge '+ k,
                  source: 'n' + i,
                  target: 'n' + j
                };
                graph.edges.push(edge);
                ec++;
                edge_lut[edge.source + '-' + edge.target] = edge;
              }
            }
          }
        }
      }
    }
    else { // beta
      if (!isNumber(options.beta) || options.beta < 0 || options.beta > 1)
        throw new TypeError('Invalid argument: options.beta is not a number between [0,1], was ' + options.beta);

      var t;

      K = K>>1; // divide by two
      for (i = 0; i < N; i++) {
        graph.nodes.push({
          id: 'n' + i,
          label: 'node '+ i,
          x: Math.random(),
          y: Math.random(),
          size: 1
        });
        // create a latice ring structure
        for (j = 1; j <= K; j++) {
          edge = {
            id: 'e' + (k++),
            label: 'Edge '+ k,
            source: 'n' + i,
            target: 'n' + ((i + j) % N)
          };
          edge_lut[edge.source + '-' + edge.target] = edge;
          graph.edges.push(edge);
        }
      }
      // rewiring of edges
      for (i = 0; i < N; i++) {
        for (j = 1; j <= K; j++) { // for every pair of nodes
          if (Math.random() <= options.beta) {
            do {
              t = Math.floor(Math.random() * (N - 1));
            }
            while (t == i || edge_lut['n'+ i + '-n' + t]);

            var j_ = (i + j) % N;
            edge_lut['n'+ i + '-n' + j_].target = 'n'+ t; // rewire
            edge_lut['n'+ i + '-n' + t] = edge_lut['n'+ i + '-n' + j_];
            delete edge_lut['n'+ i + '-n' + j_];
          }
        }
      }
    }

    return graph;
  };

  /**
   * Generates a path.
   * Source: https://github.com/anvaka/ngraph.generators (license: MIT)
   *
   * @param  {number} length The number of nodes.
   * @return {object}        A graph object that can be read by sigma.classes.graph
   */
  sigma.plugins.generators.path = function(length) {
    if (!length || length < 0) {
      throw new TypeError('Invalid argument: "length" is not a positive number, was ' + length);
    }

    var graph = {
      nodes: [{
        id: 'n0',
        label: 'Node 0',
        x: Math.random(),
        y: Math.random(),
        size: 1
      }],
      edges: []
    };

    for (var i = 1; i < length; ++i) {
      graph.nodes.push({
        id: 'n' + i,
        label: 'Node ' + i,
        x: Math.random(),
        y: Math.random(),
        size: 1
      });
      graph.edges.push({
        id: 'e' + i,
        label: 'Edge '+ i,
        source: 'n' + (i - 1),
        target: 'n' + i
      });
    }
    return graph;
  };

  /**
   * Generates a grid with n rows and m columns.
   * Source: https://github.com/anvaka/ngraph.generators (license: MIT)
   *
   * @param  {Number} n The number of rows in the graph.
   * @param  {Number} m The number of columns in the graph.
   * @return {object}   A graph object that can be read by sigma.classes.graph
   */
  sigma.plugins.generators.grid = function(n, m) {
    if (n < 1)
      throw new TypeError('Invalid argument: "n" is not a positive integer, was ' + n);
    if (m < 1)
      throw new TypeError('Invalid argument: "m" is not a positive integer, was ' + m);

    var graph = { nodes: [], edges: [] },
      i,
      j,
      k = 0,
      nodeids = [],
      source,
      target;

    nodeids.length = n * m;

    if (n === 1 && m === 1) {
      graph.nodes.push({
        id: 'n0',
        label: 'Node 0',
        x: Math.random(),
        y: Math.random(),
        size: 1
      });
      return graph;
    }

    for (i = 0; i < n; ++i) {
      for (j = 0; j < m; ++j) {
        source = i + j * n;
        if (!nodeids[source]) {
          graph.nodes.push({
            id: 'n' + source,
            label: 'Node ' + source,
            x: Math.random(),
            y: Math.random(),
            size: 1
          });
          nodeids[source] = true;
        }

        if (i > 0) {
          target = i - 1 + j * n;
          if (!nodeids[target]) {
            graph.nodes.push({
              id: 'n' + target,
              label: 'Node ' + target,
              x: Math.random(),
              y: Math.random(),
              size: 1
            });
            nodeids[target] = true;
          }
          graph.edges.push({
            id: 'e' + (k++),
            label: 'Edge '+ k,
            source: 'n' + source,
            target: 'n' + target
          });
        }
        if (j > 0) {
          target = i + (j - 1) * n;
          if (!nodeids[target]) {
            graph.nodes.push({
              id: 'n' + target,
              label: 'Node ' + target,
              x: Math.random(),
              y: Math.random(),
              size: 1
            });
            nodeids[target] = true;
          }
          graph.edges.push({
            id: 'e' + (k++),
            label: 'Edge '+ k,
            source: 'n' + source,
            target: 'n' + target
          });
        }
      }
    }

    return graph;
  };

}).call(this);
