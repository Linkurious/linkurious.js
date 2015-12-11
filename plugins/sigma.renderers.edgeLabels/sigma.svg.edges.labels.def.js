;(function(undefined) {
  'use strict';

  if (typeof sigma === 'undefined')
    throw 'sigma is not declared';

  // Initialize packages:
  sigma.utils.pkg('sigma.svg.edges.labels');

  /**
   * The default edge label renderer. It renders the label as a simple text.
   */
  sigma.svg.edges.labels.def = {

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
          x = Math.round((source[prefix + 'x'] + target[prefix + 'x']) / 2),
          y = Math.round((source[prefix + 'y'] + target[prefix + 'y']) / 2),
          dX,
          dY,
          tY = 0,
          sign,
          angle = 0,
          fontSize = (settings('labelSize') === 'fixed') ?
          settings('defaultLabelSize') :
          settings('labelSizeRatio') * size;

      if (source.id === target.id)
        return;

      // Case when we don't want to display the label
      if (!settings('forceLabels') && size < settings('edgeLabelThreshold'))
        return;

      if (typeof edge.label !== 'string')
        return;

      if ('auto' === settings('edgeLabelAlignment')) {
        dX = target[prefix + 'x'] - source[prefix + 'x'];
        dY = target[prefix + 'y'] - source[prefix + 'y'];
        sign = (source[prefix + 'x'] < target[prefix + 'x']) ? 1 : -1;
        angle = Math.atan2(dY * sign, dX * sign) * (180 / Math.PI); // deg
        tY = Math.round(-1 - size);
      }

      // Updating
      text.setAttributeNS(null, 'x', x);
      text.setAttributeNS(null, 'y', y);
      text.setAttributeNS(null, 'transform', 'rotate('+angle+' '+x+' '+y+') translate(0 '+tY+')');

      // Showing
      text.style.display = '';

      return this;
    }
  };
}).call(this);
