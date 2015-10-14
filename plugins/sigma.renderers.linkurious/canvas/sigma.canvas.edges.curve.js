;(function() {
  'use strict';

  sigma.utils.pkg('sigma.canvas.edges');

  /**
   * This edge renderer will display edges as curves.
   *
   * @param  {object}                   edge         The edge object.
   * @param  {object}                   source node  The edge source node.
   * @param  {object}                   target node  The edge target node.
   * @param  {CanvasRenderingContext2D} context      The canvas context.
   * @param  {configurable}             settings     The settings function.
   */
  sigma.canvas.edges.curve = function(edge, source, target, context, settings) {
    if (edge instanceof sigma) {
		return this.autoCurve(edge, source);
	}
    var color = edge.active ?
          edge.active_color || settings('defaultEdgeActiveColor') :
          edge.color,
        prefix = settings('prefix') || '',
        size = edge[prefix + 'size'] || 1,
        edgeColor = settings('edgeColor'),
        defaultNodeColor = settings('defaultNodeColor'),
        defaultEdgeColor = settings('defaultEdgeColor'),
        level = edge.active ? settings('edgeActiveLevel') : edge.level,
        cp = {},
        cc = settings('curvatureCoefficients'),
        sSize = source[prefix + 'size'],
        sX = source[prefix + 'x'],
        sY = source[prefix + 'y'],
        tX = target[prefix + 'x'],
        tY = target[prefix + 'y'];

    cp = (source.id === target.id) ?
      sigma.utils.getSelfLoopControlPoints(sX, sY, sSize) :
      sigma.utils.getQuadraticControlPoint(sX, sY, tX, tY, edge.cc || cc);

    // Level:
    if (level) {
      context.shadowOffsetX = 0;
      // inspired by Material Design shadows, level from 1 to 5:
      switch(level) {
        case 1:
          context.shadowOffsetY = 1.5;
          context.shadowBlur = 4;
          context.shadowColor = 'rgba(0,0,0,0.36)';
          break;
        case 2:
          context.shadowOffsetY = 3;
          context.shadowBlur = 12;
          context.shadowColor = 'rgba(0,0,0,0.39)';
          break;
        case 3:
          context.shadowOffsetY = 6;
          context.shadowBlur = 12;
          context.shadowColor = 'rgba(0,0,0,0.42)';
          break;
        case 4:
          context.shadowOffsetY = 10;
          context.shadowBlur = 20;
          context.shadowColor = 'rgba(0,0,0,0.47)';
          break;
        case 5:
          context.shadowOffsetY = 15;
          context.shadowBlur = 24;
          context.shadowColor = 'rgba(0,0,0,0.52)';
          break;
      }
    }

    if (!color)
      switch (edgeColor) {
        case 'source':
          color = source.color || defaultNodeColor;
          break;
        case 'target':
          color = target.color || defaultNodeColor;
          break;
        default:
          color = defaultEdgeColor;
          break;
      }

    if (edge.active) {
      context.strokeStyle = settings('edgeActiveColor') === 'edge' ?
        (color || defaultEdgeColor) :
        settings('defaultEdgeActiveColor');
    }
    else {
      context.strokeStyle = color;
    }

    context.lineWidth = size;
    context.beginPath();
    context.moveTo(sX, sY);
    if (source.id === target.id) {
      context.bezierCurveTo(cp.x1, cp.y1, cp.x2, cp.y2, tX, tY);
    } else {
      context.quadraticCurveTo(cp.x, cp.y, tX, tY);
    }
    context.stroke();

    // reset shadow
    if (level) {
      context.shadowOffsetY = 0;
      context.shadowBlur = 0;
      context.shadowColor = '#000000'
    }
  };

  /**
   * This curves edges between two nodes when there are more than one
   *
   * @param  {object}     s      An instance of the sigma object
   * @param  {object}     cc     The curvature coefficients to use
   */

  sigma.canvas.edges.autoCurve = function(s, cc) {
	var count = {
		key: function(o) {
			var key = o.source + o.target;
			if (this[key]) return key;
			key = o.target + o.source;
			if (this[key]) return key;
			this[key] = { i: 0, n: 0 };
			return key;
		},
		inc: function(o) {
			this[this.key(o)].n++;
		}
	};
	var edges = s.graph.edges();
	for (var i in edges) count.inc(edges[i]);

	if (!cc) cc = { length: 0 };
	if (typeof cc == 'number') cc = { length: cc };
	if (!cc.length) cc.length = 0.125;
	if (!cc.step) cc.step = function(len, n) { return len / (n/2); };
	if (!cc.calc) cc.calc = function(len, step, i) {
		var d = len - step * i; return { y: d ? 1/d : d };
	};
	if (!cc.type) cc.type = 'curve';
	for (var i in edges) {
		var key = count.key(edges[i]);
		var n = count[key].n; if (n % 2 == 0) n--;
		var step = cc.step(cc.length, n);
		if (count[key].n > 1) {
			edges[i].type = cc.type;
			edges[i].cc = sigma.utils.extend({}, cc.calc(cc.length, step, count[key].i++), cc);
		}
    }
  };

})();
