;(function() {
  'use strict';

  sigma.utils.pkg('sigma.canvas.edges');

  /**
   * Curves multiple edges between two nodes (i.e. "parallel edges").
   * This method is not a renderer. It should be called after modification
   * of the graph structure.
   * Time complexity: 2 * O(|E|)
   *
   * @param  {object}   s      The sigma instance
   * @param  {?number}  ratio  The curvature ratio (default: 0.125)
   */
  sigma.canvas.edges.autoCurve = function(s, ratio) {
    var count = {
      key: function(o) {
        var key = o.source + ',' + o.target;
        if (this[key]) {
          return key;
        }
        key = o.target + ',' + o.source;
        if (this[key]) {
          return key;
        }
        this[key] = { i: 0, n: 0 };
        return key;
      },
      inc: function(o) {
        // number of edges parallel to this one (included)
        this[this.key(o)].n++;
      }
    };

    // curvature coefficients
    var cc = {
      ratio: ratio || 0.125,
      step: function(len, n) {
        if (n % 2 === 0) {
          n--;
        }
        return len / (0.5 * n);
      },
      calc: function(len, step, i) {
        var d = len - step * i;
        return { y: d ? 1/d : d };
      }
    };

    var defaultEdgeType = s.settings('defaultEdgeType');
    var edges = s.graph.edges();

    edges.forEach(function(edge) {
      count.inc(edge);
    });

    var key, step;

    edges.forEach(function(edge) {
      key = count.key(edge);

      if (count[key].n > 1) {
        if (edge.type === 'arrow' || edge.type === 'tapered' ||
          defaultEdgeType === 'arrow' || defaultEdgeType === 'tapered') {

          edge.cc_prev_type = edge.type;
          edge.type = 'curvedArrow';
        }
        else {
          edge.cc_prev_type = edge.type;
          edge.type = 'curve';
        }

        step = cc.step(cc.ratio, count[key].n);

        edge.cc = sigma.utils.extend(
          {},
          cc.calc(cc.ratio, step, count[key].i++),
          cc
        );
      }
      else if (edge.cc) {
        // the edge is no longer a parallel edge
        edge.type = edge.cc_prev_type;
        edge.cc_prev_type = null;
        edge.cc = null;
      }
    });
  };

})();
