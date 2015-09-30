;(function() {
  'use strict';

  sigma.utils.pkg('sigma.canvas.nodes');

  var drawStar = function(node, x, y, size, context) {
    var pcount = (node.star && node.star.numPoints) || 5,
        inRatio = (node.star && node.star.innerRatio) || 0.5,
        outR = size,
        inR = size * inRatio,
        angleOffset = Math.PI / pcount;

    context.moveTo(x, y - size); // first point on outer radius, top

    for(var i = 0; i < pcount; i++) {
      context.lineTo(
        x + Math.sin(angleOffset + 2 * Math.PI * i / pcount) * inR,
        y - Math.cos(angleOffset + 2 * Math.PI * i / pcount) * inR
      );
      context.lineTo(
        x + Math.sin(2 * Math.PI * (i + 1) / pcount) * outR,
        y - Math.cos(2 * Math.PI * (i + 1) / pcount) * outR
      );
    }
  };


  /**
   * The node renderer renders the node as a star.
   *
   * @param  {object}                   node     The node object.
   * @param  {CanvasRenderingContext2D} context  The canvas context.
   * @param  {configurable}             settings The settings function.
   * @param  {?object}                  options  Force optional parameters (e.g. color).
   */
  sigma.canvas.nodes.star = function(node, context, settings, options) {
    var o = options || {},
        prefix = settings('prefix') || '',
        size = node[prefix + 'size'] || 1,
        x = node[prefix + 'x'],
        y = node[prefix + 'y'],
        defaultNodeColor = settings('defaultNodeColor'),
        imgCrossOrigin = settings('imgCrossOrigin') || 'anonymous',
        borderSize = node.border_size || settings('borderSize'),
        outerBorderSize = settings('outerBorderSize'),
        color = o.color || node.color || defaultNodeColor,
        borderColor = settings('nodeBorderColor') === 'default'
          ? settings('defaultNodeBorderColor')
          : (o.borderColor || node.border_color || defaultNodeColor),
        level = node.active ? settings('nodeActiveLevel') : node.level;

    if (node.active) {
      // Color:
      if (settings('nodeActiveColor') === 'node') {
        color = node.active_color || color;
      }
      else {
        color = settings('defaultNodeActiveColor') || color;
      }

      // Outer border:
      if (outerBorderSize > 0) {
        context.beginPath();
        context.fillStyle = settings('nodeOuterBorderColor') === 'node' ?
          (color || defaultNodeColor) :
          settings('defaultNodeOuterBorderColor');
        drawStar(node, x, y, size + borderSize + outerBorderSize * 2, context);
        context.closePath();
        context.fill();
      }
    }

    // Border:
    if (borderSize > 0) {
      context.beginPath();
      context.fillStyle = settings('nodeBorderColor') === 'node'
        ? borderColor
        : settings('defaultNodeBorderColor');
      drawStar(node, x, y, size + borderSize, context);
      context.closePath();
      context.fill();
    }

    // Level:
    sigma.utils.canvas.setLevel(level, context);

    // Shape:
    context.fillStyle = color;
    context.beginPath();
    drawStar(node, x, y, size, context);
    context.closePath();
    context.fill();

    // reset shadow
    if (level) {
      sigma.utils.canvas.resetLevel(context);
    }

    // Image:
    if (node.image) {
      sigma.utils.canvas.drawImage(
        node, x, y, size, context, imgCrossOrigin, settings('imageThreshold'), drawStar
      );
    }

    // Icon:
    if (node.icon) {
      sigma.utils.canvas.drawIcon(node, x, y, size, context, settings('iconThreshold'));
    }

  };
})();
