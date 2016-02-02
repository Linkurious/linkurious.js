;(function() {
  'use strict';

  sigma.utils.pkg('sigma.canvas.nodes');

  var drawSquare = function(node, x, y, size, context) {
    // 45 deg rotation of a diamond shape
    var rotate = Math.PI * 45 / 180;

    // first point on outer radius, dwangle 'rotate'
    context.moveTo(
      x + size * Math.sin(rotate),
      y - size * Math.cos(rotate)
    );

    for(var i = 1; i < 4; i++) {
      context.lineTo(
        x + Math.sin(rotate + 2 * Math.PI * i / 4) * size,
        y - Math.cos(rotate + 2 * Math.PI * i / 4) * size
      );
    }
  };


  /**
   * The node renderer renders the node as a square.
   *
   * @param  {object}                   node     The node object.
   * @param  {CanvasRenderingContext2D} context  The canvas context.
   * @param  {configurable}             settings The settings function.
   * @param  {?object}                  options  Force optional parameters (e.g. color).
   */
  sigma.canvas.nodes.square = function(node, context, settings, options) {
    var o = options || {},
        prefix = settings('prefix') || '',
        size = node[prefix + 'size'] || 1,
        x = node[prefix + 'x'],
        y = node[prefix + 'y'],
        defaultNodeColor = settings('defaultNodeColor'),
        imgCrossOrigin = settings('imgCrossOrigin') || 'anonymous',
        borderSize = node.border_size || settings('nodeBorderSize'),
        outerBorderSize = settings('nodeOuterBorderSize'),
        activeBorderSize = node.border_size || settings('nodeActiveBorderSize'),
        activeOuterBorderSize = settings('nodeActiveOuterBorderSize'),
        color = o.color || node.color || defaultNodeColor,
        borderColor = settings('nodeBorderColor') === 'default'
          ? settings('defaultNodeBorderColor')
          : (o.borderColor || node.border_color || defaultNodeColor),
        level = node.active ? settings('nodeActiveLevel') : node.level;

    // Level:
    sigma.utils.canvas.setLevel(level, context);

    if (node.active) {
      // Color:
      if (settings('nodeActiveColor') === 'node') {
        color = node.active_color || color;
      }
      else {
        color = settings('defaultNodeActiveColor') || color;
      }

      // Outer Border:
      if (activeOuterBorderSize > 0) {
        context.beginPath();
        context.fillStyle = settings('nodeActiveOuterBorderColor') === 'node' ?
          (color || defaultNodeColor) :
          settings('defaultNodeActiveOuterBorderColor');
        context.arc(x, y, size + activeBorderSize + activeOuterBorderSize, 0, Math.PI * 2, true);
        context.closePath();
        context.fill();
      }
      // Border:
      if (activeBorderSize > 0) {
        context.beginPath();
        context.fillStyle = settings('nodeActiveBorderColor') === 'node'
          ? borderColor
          : settings('defaultNodeActiveBorderColor');
        context.arc(x, y, size + activeBorderSize, 0, Math.PI * 2, true);
        context.closePath();
        context.fill();
      }
    }
    else {
      // Outer Border:
      if (outerBorderSize > 0) {
        context.beginPath();
        context.fillStyle = settings('nodeOuterBorderColor') === 'node' ?
          (color || defaultNodeColor) :
          settings('defaultNodeOuterBorderColor');
        context.arc(x, y, size + borderSize + outerBorderSize, 0, Math.PI * 2, true);
        context.closePath();
        context.fill();
      }

      // Border:
      if (borderSize > 0) {
        context.beginPath();
        context.fillStyle = settings('nodeBorderColor') === 'node'
          ? borderColor
          : settings('defaultNodeBorderColor');
        context.arc(x, y, size + borderSize, 0, Math.PI * 2, true);
        context.closePath();
        context.fill();
      }
    }

    // Shape:
    context.fillStyle = color;
    context.beginPath();
    drawSquare(node, x, y, size, context);
    context.closePath();
    context.fill();

    // reset shadow
    if (level) {
      sigma.utils.canvas.resetLevel(context);
    }

    // Image:
    if (node.image) {
      sigma.utils.canvas.drawImage(
        node, x, y, size, context, imgCrossOrigin, settings('imageThreshold'), drawSquare
      );
    }

    // Icon:
    if (node.icon) {
      sigma.utils.canvas.drawIcon(node, x, y, size, context, settings('iconThreshold'));
    }

  };
})();
