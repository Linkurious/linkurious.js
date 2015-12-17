;(function(undefined) {
  'use strict';

  if (typeof sigma === 'undefined')
    throw 'sigma is not declared';

  // Initialize packages:
  sigma.utils.pkg('sigma.svg.edges.labels');

  /**
   * The label renderer for curved edges. It renders the label as a simple text.
   */
  sigma.svg.edges.labels.curve = {

    /**
     * SVG Element creation.
     *
     * @param  {object}                   edge       The edge object.
     * @param  {configurable}             settings   The settings function.
     */
    create: function(edge, settings) {
      var prefix = settings('prefix') || '',
          size = edge[prefix + 'size'],
          text = document.createElementNS(settings('xmlns'), 'text');

      var fontSize = (settings('labelSize') === 'fixed') ?
        settings('defaultLabelSize') :
        settings('labelSizeRatio') * size;

      var fontColor = (settings('edgeLabelColor') === 'edge') ?
        (edge.color || settings('defaultEdgeColor')) :
        settings('defaultEdgeLabelColor');

      text.setAttributeNS(null, 'data-label-target', edge.id);
      text.setAttributeNS(null, 'class', settings('classPrefix') + '-label');
      text.setAttributeNS(null, 'font-size', fontSize);
      text.setAttributeNS(null, 'font-family', settings('font'));
      text.setAttributeNS(null, 'fill', fontColor);

      text.innerHTML = edge.label;
      text.textContent = edge.label;

      return text;
    },

    /**
     * SVG Element update.
     *
     * @param  {object}                   edge     The edge object.
     * @param  {object}                   source   The source node object.
     * @param  {object}                   target   The target node object.
     * @param  {DOMElement}               text     The label DOM element.
     * @param  {configurable}             settings The settings function.
     */
    update: function(edge, source, target, text, settings) {
      var prefix = settings('prefix') || '',
          size = edge[prefix + 'size'],
          sSize = source[prefix + 'size'],
          x = Math.round((source[prefix + 'x'] + target[prefix + 'x']) / 2),
          y = Math.round((source[prefix + 'y'] + target[prefix + 'y']) / 2),
          sX = source[prefix + 'x'],
          sY = source[prefix + 'y'],
          tX = target[prefix + 'x'],
          tY = target[prefix + 'y'],
          dX = tX - sX,
          dY = tY - sY,
          translateY = 0,
          sign = (sX < tX) ? 1 : -1,
          angle = 0,
          t = 0.5,  //length of the curve
          cp = {},
          c,
          fontSize = (settings('labelSize') === 'fixed') ?
          settings('defaultLabelSize') :
          settings('labelSizeRatio') * size;

      // Case when we don't want to display the label
      if (!settings('forceLabels') && size < settings('edgeLabelThreshold'))
        return;

      if (typeof edge.label !== 'string')
        return;

      if (source.id === target.id) {
        cp = sigma.utils.getSelfLoopControlPoints(sX, sY, sSize);
        c = sigma.utils.getPointOnBezierCurve(
          t, sX, sY, tX, tY, cp.x1, cp.y1, cp.x2, cp.y2
        );
      } else {
        cp = sigma.utils.getQuadraticControlPoint(sX, sY, tX, tY, edge.cc);
        c = sigma.utils.getPointOnQuadraticCurve(t, sX, sY, tX, tY, cp.x, cp.y);
      }

      if ('auto' === settings('edgeLabelAlignment')) {
        translateY = -1 - size;
        if (source.id === target.id) {
          angle = 45; // deg
        }
        else {
          angle = Math.atan2(dY * sign, dX * sign) * (180 / Math.PI); // deg
        }
      }

      // Updating
      text.setAttributeNS(null, 'x', c.x);
      text.setAttributeNS(null, 'y', c.y);
      text.setAttributeNS(
        null,
        'transform',
        'rotate('+angle+' '+c.x+' '+c.y+') translate(0 '+translateY+')'
      );

      // Showing
      text.style.display = '';

      return this;
    }
  };
}).call(this);
