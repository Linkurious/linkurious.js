;(function(undefined) {
  'use strict';

  if (typeof sigma === 'undefined')
    throw 'sigma is not declared';

  // Initialize packages:
  sigma.utils.pkg('sigma.canvas.labels');

  /**
   * This label renderer will display the label of the node
   *
   * @param  {object}                   node     The node object.
   * @param  {CanvasRenderingContext2D} context  The canvas context.
   * @param  {configurable}             settings The settings function.
   * @param  {object?}                  infos    The batch infos.
   */
  sigma.canvas.labels.def = function(node, context, settings, infos) {
    var fontSize,
        prefix = settings('prefix') || '',
        size = node[prefix + 'size'] || 1,
        fontStyle = settings('fontStyle'),
        borderSize = settings('nodeBorderSize'),
        labelWidth,
        labelOffsetX,
        labelOffsetY,
        alignment = settings('labelAlignment'),
        maxLineLength = settings('maxNodeLabelLineLength') || 0;

    if (size <= settings('labelThreshold'))
      return;

    if (!node.label || typeof node.label !== 'string')
      return;

    fontSize = (settings('labelSize') === 'fixed') ?
      settings('defaultLabelSize') :
      settings('labelSizeRatio') * size;

    var new_font = (fontStyle ? fontStyle + ' ' : '') +
      fontSize + 'px ' +
      (node.active ?
        settings('activeFont') || settings('font') :
        settings('font'));

    if (infos && infos.ctx.font != new_font) { //use font value caching
      context.font = new_font;
      infos.ctx.font = new_font;
    } else {
      context.font = new_font;
    }

    context.fillStyle =
        (settings('labelColor') === 'node') ?
        node.color || settings('defaultNodeColor') :
        settings('defaultLabelColor');

    labelOffsetX = 0;
    labelOffsetY = fontSize / 3;
    context.textAlign = 'center';

    switch (alignment) {
      case 'bottom':
        labelOffsetY = + size + 4 * fontSize / 3;
        break;
      case 'center':
        break;
      case 'left':
        context.textAlign = 'right';
        labelOffsetX = - size - borderSize - 3;
        break;
      case 'top':
        labelOffsetY = - size - 2 * fontSize / 3;
        break;
      case 'inside':
        labelWidth = sigma.utils.canvas.getTextWidth(context, settings('approximateLabelWidth'), fontSize, node.label);
        if (labelWidth <= (size + fontSize / 3) * 2) {
          break;
        }
      /* falls through*/
      case 'right':
      /* falls through*/
      default:
        labelOffsetX = size + borderSize + 3;
        context.textAlign = 'left';
        break;
    }

    var lines = getLines(node.label, maxLineLength),
        baseX = node[prefix + 'x'] + labelOffsetX,
        baseY = Math.round(node[prefix + 'y'] + labelOffsetY);

    for (var i = 0; i < lines.length; ++i) {
      context.fillText(lines[i], baseX, baseY + i * (fontSize + 1));
    }
  };

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
}).call(this);
