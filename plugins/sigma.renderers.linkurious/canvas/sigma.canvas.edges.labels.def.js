;(function(undefined) {
  'use strict';

  if (typeof sigma === 'undefined')
    throw 'sigma is not declared';

  // Initialize packages:
  sigma.utils.pkg('sigma.canvas.edges.labels');

  var PREV_FONT = null; //contains the current context.font value

  sigma.canvas.edges.labels.def = {
    pre: function(context, settings) {
      PREV_FONT = '';
    },
  };
  
  /**
   * This label renderer will just display the label on the line of the edge.
   * The label is rendered at half distance of the edge extremities, and is
   * always oriented from left to right on the top side of the line.
   *
   * @param  {object}                   edge         The edge object.
   * @param  {object}                   source node  The edge source node.
   * @param  {object}                   target node  The edge target node.
   * @param  {CanvasRenderingContext2D} context      The canvas context.
   * @param  {configurable}             settings     The settings function.
   */
  sigma.canvas.edges.labels.def.render =
    function(edge, source, target, context, settings) {
    if (typeof edge.label !== 'string' || source == target)
      return;

    var prefix = settings('prefix') || '',
        size = edge[prefix + 'size'] || 1;

    if (size < settings('edgeLabelThreshold') && !edge.hover)
      return;

    if (0 === settings('edgeLabelSizePowRatio'))
      throw new Error('Invalid setting: "edgeLabelSizePowRatio" is equal to 0.');

    var fontSize,
        angle = 0,
        fontStyle = edge.hover ?
          (settings('hoverFontStyle') || settings('fontStyle')) :
          settings('fontStyle'),
        x = (source[prefix + 'x'] + target[prefix + 'x']) / 2,
        y = (source[prefix + 'y'] + target[prefix + 'y']) / 2,
        dX, dY, sign;

    // The font size is sublineraly proportional to the edge size, in order to
    // avoid very large labels on screen.
    // This is achieved by f(x) = x * x^(-1/ a), where 'x' is the size and 'a'
    // is the edgeLabelSizePowRatio. Notice that f(1) = 1.
    // The final form is:
    // f'(x) = b * x * x^(-1 / a), thus f'(1) = b. Application:
    // fontSize = defaultEdgeLabelSize if edgeLabelSizePowRatio = 1

    fontSize = (settings('edgeLabelSize') === 'fixed') ?
      settings('defaultEdgeLabelSize') :
      settings('defaultEdgeLabelSize') *
      size *
      Math.pow(size, -1 / settings('edgeLabelSizePowRatio'));

    var new_font = [
        fontStyle,
        fontSize + 'px',
        settings('font')
      ].join(' ');
    if (edge.active) {
     new_font = [
        settings('activeFontStyle') || settings('fontStyle'),
        fontSize + 'px',
        settings('activeFont') || settings('font')
      ].join(' ');
    }

    //fallback if the font value caching is not available
    if (PREV_FONT === null) {
      context.font = new_font;
    } else if (PREV_FONT != new_font) { //use font value caching
      context.font = new_font;
      PREV_FONT = new_font;
    }

    context.textAlign = 'center';
    context.textBaseline = 'alphabetic';

    // force horizontal alignment if not enough space to draw the text,
    // otherwise draw text along the edge line:
    if ('auto' === settings('edgeLabelAlignment')) {
      var labelWidth;
      if (settings('approximateLabelWidth')) {
        labelWidth = 0.5 * edge.label.length * fontSize;
      }else {
        labelWidth = context.measureText(edge.label).width;
      }
      var edgeLength = sigma.utils.getDistance(
          source[prefix + 'x'],
          source[prefix + 'y'],
          target[prefix + 'x'],
          target[prefix + 'y']);

        // reduce node sizes + constant
        edgeLength = edgeLength - source[prefix + 'size'] - target[prefix + 'size'] - 10;

      if (labelWidth < edgeLength) {
        dX = target[prefix + 'x'] - source[prefix + 'x'];
        dY = target[prefix + 'y'] - source[prefix + 'y'];
        sign = (source[prefix + 'x'] < target[prefix + 'x']) ? 1 : -1;
        angle = Math.atan2(dY * sign, dX * sign);
      }
    }

    if (edge.hover) {
      // Label background:
      context.fillStyle = settings('edgeLabelHoverBGColor') === 'edge' ?
        (edge.color || settings('defaultEdgeColor')) :
        settings('defaultEdgeHoverLabelBGColor');

      if (settings('edgeLabelHoverShadow')) {
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        context.shadowBlur = 8;
        context.shadowColor = settings('edgeLabelHoverShadowColor');
      }

      drawBackground(angle, context, fontSize, size, edge.label, x, y);

      if (settings('edgeLabelHoverShadow')) {
        context.shadowBlur = 0;
        context.shadowColor = '#000';
      }
    }

    if (edge.active) {
      context.fillStyle =
        settings('edgeActiveColor') === 'edge' ?
        (edge.active_color || settings('defaultEdgeActiveColor')) :
        settings('defaultEdgeLabelActiveColor');
    }
    else {
      context.fillStyle =
        (settings('edgeLabelColor') === 'edge') ?
        (edge.color || settings('defaultEdgeColor')) :
        settings('defaultEdgeLabelColor');
    }

    context.translate(x, y);
    context.rotate(angle);
    context.fillText(
      edge.label,
      0,
      (-size / 2) - 3
    );
    context.rotate(-angle);
    context.translate(-x, -y);
  };


  function drawBackground(angle, context, fontSize, size, label, x, y) {
    var w = Math.round(
          context.measureText(label).width + size + 1.5 + fontSize / 3
        ),
        h = fontSize + 4;

    context.save();
    context.beginPath();

    // draw a rectangle for the label
    context.translate(x, y);
    context.rotate(angle);
    context.rect(-w / 2, -h - size / 2, w, h);

    context.closePath();
    context.fill();
    context.restore();
  }

  //fallback if the new rendering system is not available
  if (sigma.renderers.canvas.applyRenderers === undefined) {
    sigma.canvas.edges.labels.def = sigma.canvas.edges.labels.def.render;
  }

}).call(this);