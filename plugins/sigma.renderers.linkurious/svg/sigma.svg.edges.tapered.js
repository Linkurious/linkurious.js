;(function() {
  'use strict';

  sigma.utils.pkg('sigma.svg.edges');

  /**
   * It renders the edge as a tapered line.
   * Danny Holten, Petra Isenberg, Jean-Daniel Fekete, and J. Van Wijk (2010)
   * Performance Evaluation of Tapered, Curved, and Animated Directed-Edge
   * Representations in Node-Link Graphs. Research Report, Sep 2010.
   */
  sigma.svg.edges.tapered = {

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

      var polygon = document.createElementNS(settings('xmlns'), 'polygon');

      // Attributes
      polygon.setAttributeNS(null, 'data-edge-id', edge.id);
      polygon.setAttributeNS(null, 'class', settings('classPrefix') + '-edge');
      polygon.setAttributeNS(null, 'fill', color);
      polygon.setAttributeNS(null, 'fill-opacity', 0.6);
      polygon.setAttributeNS(null, 'stroke-width', 0);

      return polygon;
    },

    /**
     * SVG Element update.
     *
     * @param  {object}                   edge       The edge object.
     * @param  {DOMElement}               polygon    The polygon DOM Element.
     * @param  {object}                   source     The source node object.
     * @param  {object}                   target     The target node object.
     * @param  {configurable}             settings   The settings function.
     */
    update: function(edge, polygon, source, target, settings) {
      var prefix = settings('prefix') || '',
        sX = source[prefix + 'x'],
        sY = source[prefix + 'y'],
        tX = target[prefix + 'x'],
        tY = target[prefix + 'y'],
        size = edge[prefix + 'size'] || 1,
        dist = sigma.utils.getDistance(sX, sY, tX, tY),
        c,
        p;

      if (!dist) return; // should be a self-loop

      // Intersection points:
      c = sigma.utils.getCircleIntersection(sX, sY, size, tX, tY, dist);

      // Path
      p = tX+','+tY+' '+c.xi+','+c.yi+' '+c.xi_prime+','+c.yi_prime;
      polygon.setAttributeNS(null, "points", p);

      // Showing
      polygon.style.display = '';

      return this;
    }
  };
})();
