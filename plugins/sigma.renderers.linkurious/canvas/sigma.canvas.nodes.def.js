;(function() {
  'use strict';

  sigma.utils.pkg('sigma.canvas.nodes');

  // incrementally scaled, not automatically resized for now
  // (ie. possible memory leak if there are many graph load / unload)
  var imgCache = {};

  var drawImage = function (node, x, y, size, context, imgCrossOrigin, threshold) {
    if(!node.image || !node.image.url || size < threshold) return;

    var url = node.image.url;
    var ih = node.image.h || 1; // 1 is arbitrary, anyway only the ratio counts
    var iw = node.image.w || 1;
    var scale = node.image.scale || 1;
    var clip = node.image.clip || 1;

    // create new IMG or get from imgCache
    var image = imgCache[url];
    if(!image) {
      image = document.createElement('IMG');
      image.setAttribute('crossOrigin', imgCrossOrigin);
      image.src = url;
      image.onload = function() {
        window.dispatchEvent(new Event('resize'));
      };
      imgCache[url] = image;
    }

    // calculate position and draw
    var xratio = (iw < ih) ? (iw / ih) : 1;
    var yratio = (ih < iw) ? (ih / iw) : 1;
    var r = size * scale;

    // Draw the clipping disc:
    context.save(); // enter clipping mode
    context.beginPath();
    context.arc(x, y, size * clip, 0, Math. PI * 2, true);
    context.closePath();
    context.clip();

    // Draw the actual image
    context.drawImage(
      image,
      x + Math.sin(-3.142 / 4) * r * xratio,
      y - Math.cos(-3.142 / 4) * r * yratio,
      r * xratio * 2 * Math.sin(-3.142 / 4) * (-1),
      r * yratio * 2 * Math.cos(-3.142 / 4)
    );
    context.restore(); // exit clipping mode
  };

  var drawIcon = function (node, x, y, size, context, threshold) {
    if(!node.icon || size < threshold) return;

    var font = node.icon.font || 'Arial',
        fgColor = node.icon.color || '#F00',
        text = node.icon.content || '?',
        px = node.icon.x || 0.5,
        py = node.icon.y || 0.5,
        height = size,
        width = size;


    var fontSizeRatio = 0.70;
    if (typeof node.icon.scale === "number") {
      fontSizeRatio = Math.abs(Math.max(0.01, node.icon.scale));
    }


    var fontSize = Math.round(fontSizeRatio * height);

    context.save();
    context.fillStyle = fgColor;

    context.font = '' + fontSize + 'px ' + font;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, x, y);
    context.restore();
  };

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
          : (node.border_color || o.borderColor || defaultNodeColor),
        level = node.active ? settings('nodeActiveLevel') : node.level;

    // Level:
    if (level) {
      context.shadowOffsetX = 0;
      // inspired by Material Design shadows, level from 1 to 5:
      switch(level) {
        case 1:
          context.shadowOffsetY = 1.5;
          context.shadowBlur = 4;
          context.shadowColor = 'rgba(0,0,0,0.36)';
          break;
        case 2:
          context.shadowOffsetY = 3;
          context.shadowBlur = 12;
          context.shadowColor = 'rgba(0,0,0,0.39)';
          break;
        case 3:
          context.shadowOffsetY = 6;
          context.shadowBlur = 12;
          context.shadowColor = 'rgba(0,0,0,0.42)';
          break;
        case 4:
          context.shadowOffsetY = 10;
          context.shadowBlur = 20;
          context.shadowColor = 'rgba(0,0,0,0.47)';
          break;
        case 5:
          context.shadowOffsetY = 15;
          context.shadowBlur = 24;
          context.shadowColor = 'rgba(0,0,0,0.52)';
          break;
      }
    }

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
    }
    else {
      context.fillStyle = color;
      context.beginPath();
      context.arc(x, y, size, 0, Math.PI * 2, true);
      context.closePath();
      context.fill();

      if (!node.active && borderSize > 0) {
		drawBorder(context, x, y, size, borderColor, borderSize);
      }
    }

    // reset shadow
    if (level) {
      context.shadowOffsetY = 0;
      context.shadowBlur = 0;
      context.shadowColor = '#000000'
    }

    // Image:
    if (node.image) {
      drawImage(node, x, y, size, context, imgCrossOrigin, settings('imageThreshold'));
    }

    // Icon:
    if (node.icon) {
      drawIcon(node, x, y, size, context, settings('iconThreshold'));
    }

  };
})();
