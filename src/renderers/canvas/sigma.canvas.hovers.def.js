;(function(undefined) {
  'use strict';

  if (typeof sigma === 'undefined')
    throw 'sigma is not declared';

  // Initialize packages:
  sigma.utils.pkg('sigma.canvas.hovers');

  /**
   * This hover renderer will basically display the label with a background.
   *
   * @param  {object}                   node     The node object.
   * @param  {CanvasRenderingContext2D} context  The canvas context.
   * @param  {configurable}             settings The settings function.
   */
  sigma.canvas.hovers.def = function(node, context, settings) {
    var x,
        y,
        w,
        h,
        e,
        labelX,
        labelY,
        lines,
        baseX,
        baseY,
        borderSize = settings('nodeBorderSize'),
        alignment = settings('labelAlignment'),
        fontStyle = settings('hoverFontStyle') || settings('fontStyle'),
        prefix = settings('prefix') || '',
        size = node[prefix + 'size'],
        maxLineLength = settings('maxNodeLabelLineLength') || 0,
        fontSize = (settings('labelSize') === 'fixed') ?
          settings('defaultLabelSize') :
          settings('labelSizeRatio') * size;


    // Label background:
    context.font = (fontStyle ? fontStyle + ' ' : '') +
      fontSize + 'px ' + (settings('hoverFont') || settings('font'));

    context.beginPath();
    context.fillStyle = settings('labelHoverBGColor') === 'node' ?
      (node.color || settings('defaultNodeColor')) :
      settings('defaultHoverLabelBGColor');

    if (settings('labelHoverShadow')) {
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
      context.shadowBlur = 8;
      context.shadowColor = settings('labelHoverShadowColor');
    }

    lines = getLines(node.label, maxLineLength);
    drawHoverBorder(alignment, context, fontSize, node, lines, maxLineLength);

    // Node border:
    if (borderSize > 0) {
      context.beginPath();
      context.fillStyle = settings('nodeBorderColor') === 'node' ?
        (node.color || settings('defaultNodeColor')) :
        settings('defaultNodeBorderColor');
      context.arc(
        node[prefix + 'x'],
        node[prefix + 'y'],
        size + borderSize,
        0,
        Math.PI * 2,
        true
      );
      context.closePath();
      context.fill();
    }

    // Node:
    var nodeRenderer = sigma.canvas.nodes[node.type] || sigma.canvas.nodes.def;
    nodeRenderer(node, context, settings);

    // Display the label:
    if (node.label && typeof node.label === 'string') {
      context.fillStyle = (settings('labelHoverColor') === 'node') ?
        (node.color || settings('defaultNodeColor')) :
        settings('defaultLabelHoverColor');
      var labelWidth = sigma.utils.canvas.getTextWidth(context,
            settings('approximateLabelWidth'), fontSize, node.label),
          labelOffsetX = - labelWidth / 2,
          labelOffsetY = fontSize / 3;

      switch (alignment) {
        case 'bottom':
          labelOffsetY = + size + 4 * fontSize / 3;
          break;
        case 'center':
          break;
        case 'left':
          labelOffsetX = - size - borderSize - 3 - labelWidth;
          break;
        case 'top':
          labelOffsetY = - size - 2 * fontSize / 3;
          break;
        case 'inside':
          if (labelWidth <= (size + fontSize / 3) * 2) {
            break;
          }
        /* falls through*/
        case 'right':
        /* falls through*/
        default:
          labelOffsetX = size + borderSize + 3;
          break;
      }

      baseX = node[prefix + 'x'] + labelOffsetX;
      baseY = Math.round(node[prefix + 'y'] + labelOffsetY);

      for (var i = 0; i < lines.length; ++i) {
        context.fillText(lines[i], baseX, baseY + i * (fontSize + 1));
      }
    }

    function drawHoverBorder(alignment, context, fontSize, node, lines, maxLineLength) {
      var labelWidth =
        (maxLineLength > 1 && lines.length > 1) ?
        0.6 * maxLineLength * fontSize :
        sigma.utils.canvas.getTextWidth(
          context,
          settings('approximateLabelWidth'),
          fontSize,
          lines[0]
        );

      var x = Math.round(node[prefix + 'x']),
          y = Math.round(node[prefix + 'y']),
          h = ((fontSize + 1) * lines.length) + 4,
          e = Math.round(size + fontSize / 4),
          w = Math.round(labelWidth + size + 1.5 + fontSize / 3);

      if (node.label && typeof node.label === 'string') {
        // draw a rectangle for the label
        switch (alignment) {
          case 'center':
            break;
          case 'left':
            x = Math.round(node[prefix + 'x'] + fontSize / 2 + 2);
            y = Math.round(node[prefix + 'y'] - fontSize / 2 - 2);

            context.moveTo(x, y + e);
            context.arcTo(x, y, x - e, y, e);
            context.lineTo(x - w - borderSize - e, y);
            context.lineTo(x - w - borderSize - e, y + h);
            context.lineTo(x - e, y + h);
            context.arcTo(x, y + h, x, y + h - e, e);
            context.lineTo(x, y + e);
            break;
          case 'top':
            context.rect(x - w / 2, y - e - h, w, h);
            break;
          case 'bottom':
            context.rect(x - w / 2, y + e, w, h);
            break;
          case 'inside':
            if (labelWidth <= e * 2) {
              // don't draw anything
              break;
            }
            // use default setting, falling through
          /* falls through*/
          case 'right':
          /* falls through*/
          default:
            x = Math.round(node[prefix + 'x'] - fontSize / 2 - 2);
            y = Math.round(node[prefix + 'y'] - fontSize / 2 - 2);

            context.moveTo(x, y + e);
            context.arcTo(x, y, x + e, y, e);
            context.lineTo(x + w + borderSize + e, y);
            context.lineTo(x + w + borderSize + e, y + h);
            context.lineTo(x + e, y + h);
            context.arcTo(x, y + h, x, y + h - e, e);
            context.lineTo(x, y + e);
            break;
        }
      }

      context.closePath();
      context.fill();

      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
      context.shadowBlur = 0;
    }

    /**
     * Split a text into several lines. Each line won't be longer than the specified maximum length.
     * @param {string}  text            Text to split
     * @param {number}  maxLineLength   Maximum length of a line. A value <= 1 will be treated as "infinity".
     * @returns {Array<string>}         List of lines
     */
    function getLines(text, maxLineLength) {
      if (maxLineLength <= 1) {
        return [text];
      }

      var words = text.split(' '),
        lines = [],
        lineLength = 0,
        lineIndex = -1,
        lineList = [],
        lineFull = true;

      for (var i = 0; i < words.length; ++i) {
        if (lineFull) {
          if (words[i].length > maxLineLength) {
            var parts = splitWord(words[i], maxLineLength);
            for (var j = 0; j < parts.length; ++j) {
              lines.push([parts[j]]);
              ++lineIndex;
            }
            lineLength = parts[parts.length - 1].length;
          } else {
            lines.push([words[i]
            ]);
            ++lineIndex;
            lineLength = words[i].length + 1;
          }
          lineFull = false;
        } else if (lineLength + words[i].length <= maxLineLength) {
          lines[lineIndex].push(words[i]);
          lineLength += words[i].length + 1;
        } else {
          lineFull = true;
          --i;
        }
      }

      for (i = 0; i < lines.length; ++i) {
        lineList.push(lines[i].join(' '))
      }

      return lineList;
    }

    /**
     * Split a word into several lines (with a '-' at the end of each line but the last).
     * @param {string} word       Word to split
     * @param {number} maxLength  Maximum length of a line
     * @returns {Array<string>}   List of lines
     */
    function splitWord(word, maxLength) {
      var parts = [];

      for (var i = 0; i < word.length; i += maxLength - 1) {
        parts.push(word.substr(i, maxLength - 1) + '-');
      }

      var lastPartLen = parts[parts.length - 1].length;
      parts[parts.length - 1] = parts[parts.length - 1].substr(0, lastPartLen - 1) + ' ';

      return parts;
    }
  };
}).call(this);
