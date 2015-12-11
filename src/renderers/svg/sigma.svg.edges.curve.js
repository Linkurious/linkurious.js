;(function() {
  'use strict';

  sigma.utils.pkg('sigma.svg.edges');

  /**
   * The curve edge renderer. It renders the edge as a bezier curve.
   */
  sigma.svg.edges.curve = {

    /**
     * SVG Element creation.
     *
     * @param  {object}                   edge       The edge object.
     * @param  {object}                   source     The source node object.
     * @param  {object}                   target     The target node object.
     * @param  {configurable}             settings   The settings function.
     */
    create: function(edge, source, target, settings) {
      var color = edge.color,
          prefix = settings('prefix') || '',
          edgeColor = settings('edgeColor'),
          defaultNodeColor = settings('defaultNodeColor'),
          defaultEdgeColor = settings('defaultEdgeColor');

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

      var path = document.createElementNS(settings('xmlns'), 'path');

      // Attributes
      path.setAttributeNS(null, 'data-edge-id', edge.id);
      path.setAttributeNS(null, 'class', settings('classPrefix') + '-edge');
      path.setAttributeNS(null, 'stroke', color);

      return path;
    },

    /**
     * SVG Element update.
     *
     * @param  {object}                   edge       The edge object.
     * @param  {DOMElement}               path       The path DOM Element.
     * @param  {object}                   source     The source node object.
     * @param  {object}                   target     The target node object.
     * @param  {configurable}             settings   The settings function.
     */
    update: function(edge, path, source, target, settings) {
      var prefix = settings('prefix') || '',
          sSize = source[prefix + 'size'],
          sX = source[prefix + 'x'],
          sY = source[prefix + 'y'],
          tX = target[prefix + 'x'],
          tY = target[prefix + 'y'],
          cp,
          p;

      path.setAttributeNS(null, 'stroke-width', edge[prefix + 'size'] || 1);

      if (source.id === target.id) {
        cp = sigma.utils.getSelfLoopControlPoints(sX, sY, sSize);
        // Path
        p = 'M' + sX + ',' + sY + ' ' +
            'C' + cp.x1 + ',' + cp.y1 + ' ' +
            cp.x2 + ',' + cp.y2 + ' ' +
            tX + ',' + tY;
      }
      else {
        cp = sigma.utils.getQuadraticControlPoint(sX, sY, tX, tY, edge.cc);
        // Path
        p = 'M' + sX + ',' + sY + ' ' +
            'Q' + cp.x + ',' + cp.y + ' ' +
            tX + ',' + tY;
      }

      // Updating attributes
      path.setAttributeNS(null, 'd', p);
      path.setAttributeNS(null, 'fill', 'none');

      // Showing
      path.style.display = '';

      return this;
    }
  };
})();
