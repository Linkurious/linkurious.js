;(function() {
  'use strict';

  sigma.utils.pkg('sigma.canvas.nodes');

  var drawDiamond = function(node, x, y, size, context) {
    context.moveTo(x - size, y);
    context.lineTo(x, y - size);
    context.lineTo(x + size, y);
    context.lineTo(x, y + size);
  };


  /**
   * The node renderer renders the node as a diamond.
   *
   * @param  {object}                   node     The node object.
   * @param  {CanvasRenderingContext2D} context  The canvas context.
   * @param  {configurable}             settings The settings function.
   * @param  {?object}                  options  Force optional parameters (e.g. color).
   */
  sigma.canvas.nodes.diamond = function(node, context, settings, options) {
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
        // Level:
        if (level) {
          setShadow(level, context);
        }

        context.beginPath();
        context.fillStyle = settings('nodeOuterBorderColor') === 'node' ?
          (color || defaultNodeColor) :
          settings('defaultNodeOuterBorderColor');
        drawDiamond(node, x, y, size + borderSize + outerBorderSize, context);
        context.closePath();
        context.fill();

        if (level) {
          resetShadow(context);
        }
      }
    }

    // Border:
    if (borderSize > 0) {
      context.beginPath();
      context.fillStyle = settings('nodeBorderColor') === 'node'
        ? borderColor
        : settings('defaultNodeBorderColor');
      drawDiamond(node, x, y, size + borderSize, context);
      context.closePath();
      context.fill();
    }

    // Level:
    sigma.utils.canvas.setLevel(level, context);

    // Shape:
    context.fillStyle = color;
    context.beginPath();
    drawDiamond(node, x, y, size, context);
    context.closePath();
    context.fill();

    // reset shadow
    if (level) {
      sigma.utils.canvas.resetLevel(context);
    }

    // Image:
    if (node.image) {
      sigma.utils.canvas.drawImage(
        node, x, y, size, context, imgCrossOrigin, settings('imageThreshold'), drawDiamond
      );
    }

    // Icon:
    if (node.icon) {
      sigma.utils.canvas.drawIcon(node, x, y, size, context, settings('iconThreshold'));
    }

  };
})();
