;(function() {
  'use strict';

  sigma.utils.pkg('sigma.canvas.nodes');

  var drawBorder = function(context, x, y, radius, color, line_width) {
    context.beginPath();
    context.strokeStyle = color;
	  context.lineWidth = line_width;
    context.arc(x, y, radius, 0, Math.PI * 2, true);
    context.closePath();
    context.stroke();
  };


  /**
   * The default node renderer. It renders the node as a simple disc.
   *
   * @param  {object}                   node     The node object.
   * @param  {CanvasRenderingContext2D} context  The canvas context.
   * @param  {configurable}             settings The settings function.
   * @param  {?object}                  options  Force optional parameters (e.g. color).
   */
  sigma.canvas.nodes.def = function(node, context, settings, options) {
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

    if (node.active) {
      // Color:
      if (settings('nodeActiveColor') === 'node') {
        color = node.active_color || color;
      }
      else {
        color = settings('defaultNodeActiveColor') || color;
      }

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

    if ((!node.active ||
      (node.active && settings('nodeActiveColor') === 'node')) &&
      node.colors &&
      node.colors.length) {

      // see http://jsfiddle.net/hvYkM/1/
      var i,
          l = node.colors.length,
          j = 1 / l,
          lastend = 0;

      for (i = 0; i < l; i++) {
        context.fillStyle = node.colors[i];
        context.beginPath();
        context.moveTo(x, y);
        context.arc(x, y, size, lastend, lastend + (Math.PI * 2 * j), false);
        context.lineTo(x, y);
        context.closePath();
        context.fill();
        lastend += Math.PI * 2 * j;
      }
      sigma.utils.canvas.resetLevel(context);
    }
    else {
      context.fillStyle = color;
      context.beginPath();
      context.arc(x, y, size, 0, Math.PI * 2, true);
      context.closePath();
      context.fill();

      sigma.utils.canvas.resetLevel(context);

      if (!node.active && borderSize > 0 && (size > 2 * borderSize)) {
		    drawBorder(context, x, y, size, borderColor, borderSize);
      }
    }

    // Image:
    if (node.image) {
      sigma.utils.canvas.drawImage(
        node, x, y, size, context, imgCrossOrigin, settings('imageThreshold')
      );
    }

    // Icon:
    if (node.icon) {
      sigma.utils.canvas.drawIcon(node, x, y, size, context, settings('iconThreshold'));
    }

  };
})();
