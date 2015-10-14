;(function() {
  'use strict';

  sigma.utils.pkg('sigma.canvas.nodes');

  var drawEquilateral = function(node, x, y, size, context) {
    var pcount = (node.equilateral && node.equilateral.numPoints) || 5;
    var rotate = ((node.equilateral && node.equilateral.rotate) || 0); // we expect radians: Math.PI/180;
    var radius = size;

    // TODO FIXME there is an angle difference between the webgl algorithm and
    // the canvas algorithm
    rotate += Math.PI / pcount; // angleOffset

     // first point on outer radius, angle 'rotate'
    context.moveTo(
      x + radius * Math.sin(rotate),
      y - radius * Math.cos(rotate)
    );

    for(var i = 1; i < pcount; i++) {
      context.lineTo(
        x + Math.sin(rotate + 2 * Math.PI * i / pcount) * radius,
        y - Math.cos(rotate + 2 * Math.PI * i / pcount) * radius
      );
    }
  };


  /**
   * The node renderer renders the node as a equilateral.
   *
   * @param  {object}                   node     The node object.
   * @param  {CanvasRenderingContext2D} context  The canvas context.
   * @param  {configurable}             settings The settings function.
   * @param  {?object}                  options  Force optional parameters (e.g. color).
   */
  sigma.canvas.nodes.equilateral = function(node, context, settings, options) {
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
        drawEquilateral(node, x, y, size + borderSize + outerBorderSize, context);
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
      drawEquilateral(node, x, y, size + borderSize, context);
      context.closePath();
      context.fill();
    }

    // Level:
    sigma.utils.canvas.setLevel(level, context);

    // Shape:
    context.fillStyle = color;
    context.beginPath();
    drawEquilateral(node, x, y, size, context);
    context.closePath();
    context.fill();

    // reset shadow
    if (level) {
      sigma.utils.canvas.resetLevel(context);
    }

    // Image:
    if (node.image) {
      sigma.utils.canvas.drawImage(
        node, x, y, size, context, imgCrossOrigin, settings('imageThreshold'), drawEquilateral
      );
    }

    // Icon:
    if (node.icon) {
      sigma.utils.canvas.drawIcon(node, x, y, size, context, settings('iconThreshold'));
    }

  };
})();
