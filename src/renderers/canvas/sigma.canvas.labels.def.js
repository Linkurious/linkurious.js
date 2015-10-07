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
    /* < 1 ms */

    var fontSize,
        prefix = settings('prefix') || '',
        size = node[prefix + 'size'] || 1,
        fontStyle = settings('fontStyle'),
        borderSize = settings('borderSize'),
        labelWidth,
        labelOffsetX,
        labelOffsetY,
        alignment = settings('labelAlignment'),
        textAlign,
        fillStyle,
        font;

    /*
    if (size <= settings('labelThreshold'))
      return;
    */

    if (!node.label || typeof node.label !== 'string')
      return;

    /* ~5ms */

    fontSize = (settings('labelSize') === 'fixed') ?
      settings('defaultLabelSize') :
      settings('labelSizeRatio') * size;

    var new_font = (fontStyle ? fontStyle + ' ' : '') +
      fontSize + 'px ' +
      (node.active ?
        settings('activeFont') || settings('font') :
        settings('font'));

    if (infos && infos.ctx.font != new_font) { //use font value caching
      font = new_font;
      infos.ctx.font = new_font;
    } else {
      font = new_font;
    }

    /* < 7 ms */

    fillStyle =
        (settings('labelColor') === 'node') ?
        node.color || settings('defaultNodeColor') :
        settings('defaultLabelColor');

    labelOffsetX = 0;
    labelOffsetY = fontSize / 3;
    textAlign = 'center';

    /* ~8 ms */

    switch (alignment) {
      case 'bottom':
        labelOffsetY = + size + 4 * fontSize / 3;
        break;
      case 'center':
        break;
      case 'left':
        textAlign = 'right';
        labelOffsetX = - size - borderSize - 3;
        break;
      case 'top':
        labelOffsetY = - size - 2 * fontSize / 3;
        break;
      case 'inside':
        labelWidth = sigma.utils.canvas.getTextWidth(context,
            settings('approximateLabelWidth'), fontSize, node.label);
        if (labelWidth <= (size + fontSize / 3) * 2) {
          break;
        }
      /* falls through*/
      case 'right':
      /* falls through*/
      default:
        labelOffsetX = size + borderSize + 3;
        textAlign = 'left';
        break;
    }

    /* ~9 ms */

    var textX = Math.round(node[prefix + 'x'] + labelOffsetX);
    var textY = Math.round(node[prefix + 'y'] + labelOffsetY);

    /* 10~13 ms */

    //var w = Math.ceil(0.6 * node.label.length * fontSize);
    //var h = Math.ceil(w * 3 / 4);

    context.textAlign = textAlign;
    context.fillStyle = fillStyle;
    context.font = font;

    /* 13~14 ms */

    context.fillText(node.label, textX, textY);

    /* ~34 ms */
  };
}).call(this);
