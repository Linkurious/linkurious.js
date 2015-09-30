;(function() {
  'use strict';

  sigma.utils.pkg('sigma.canvas.nodes');

  var drawCross = function(node, x, y, size, context) {
    var lineWeight = (node.cross && node.cross.lineWeight) || 1;
    context.moveTo(x - size, y - lineWeight);
    context.lineTo(x - size, y + lineWeight);
    context.lineTo(x - lineWeight, y + lineWeight);
    context.lineTo(x - lineWeight, y + size);
    context.lineTo(x + lineWeight, y + size);
    context.lineTo(x + lineWeight, y + lineWeight);
    context.lineTo(x + size, y + lineWeight);
    context.lineTo(x + size, y - lineWeight);
    context.lineTo(x + lineWeight, y - lineWeight);
    context.lineTo(x + lineWeight, y - size);
    context.lineTo(x - lineWeight, y - size);
    context.lineTo(x - lineWeight, y - lineWeight);
  }


  /**
   * The node renderer renders the node as a cross.
   *
   * @param  {object}                   node     The node object.
   * @param  {CanvasRenderingContext2D} context  The canvas context.
   * @param  {configurable}             settings The settings function.
   * @param  {?object}                  options  Force optional parameters (e.g. color).
   */
  sigma.canvas.nodes.cross = function(node, context, settings, options) {
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

    // Level:
    sigma.utils.canvas.setLevel(level, context);

    // Color:
    if (node.active) {
      if (settings('nodeActiveColor') === 'node') {
        color = node.active_color || color;
      }
      else {
        color = settings('defaultNodeActiveColor') || color;
      }
    }

    // Outer border:
    if (node.active) {
      if (outerBorderSize > 0) {
        context.beginPath();
        context.fillStyle = settings('nodeOuterBorderColor') === 'node' ?
          (color || defaultNodeColor) :
          settings('defaultNodeOuterBorderColor');
        drawCross(node, x, y, size + borderSize + outerBorderSize, context);
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
      drawCross(node, x, y, size + borderSize, context);
      context.closePath();
      context.fill();
    }

    // Shape:
    context.fillStyle = color;
    context.beginPath();
    drawCross(node, x, y, size, context);
    context.closePath();
    context.fill();

    // reset shadow
    sigma.utils.canvas.setLevel(level, context);

    // Image:
    if (node.image) {
      sigma.utils.canvas.drawImage(
        node, x, y, size, context, imgCrossOrigin, settings('imageThreshold', drawCross)
      );
    }

    // Icon:
    if (node.icon) {
      sigma.utils.canvas.drawIcon(node, x, y, size, context, settings('iconThreshold'));
    }

  };
})();
