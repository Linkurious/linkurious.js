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

    /* ~6% */

    bm[1] = performance.now();

    fontSize = (settings('labelSize') === 'fixed') ?
      settings('defaultLabelSize') :
      settings('labelSizeRatio') * size;

    /* ~8% */

    bm[2] = performance.now();

    var new_font = (fontStyle ? fontStyle + ' ' : '') +
      fontSize + 'px ' +
      (node.active ?
        settings('activeFont') || settings('font') :
        settings('font'));

    /* ~10% */

    bm[3] = performance.now();

    if (infos && infos.ctx.font != new_font) { //use font value caching
      font = new_font;
      infos.ctx.font = new_font;
    } else {
      font = new_font;
    }

    /* ~10% */

    bm[4] = performance.now();

    fillStyle =
        (settings('labelColor') === 'node') ?
        node.color || settings('defaultNodeColor') :
        settings('defaultLabelColor');

    labelOffsetX = 0;
    labelOffsetY = fontSize / 3;
    textAlign = 'center';

    /* ~14% */

    bm[5] = performance.now();

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

    /* ~16% */

    bm[6] = performance.now();

    var textX = Math.round(node[prefix + 'x'] + labelOffsetX);
    var textY = Math.round(node[prefix + 'y'] + labelOffsetY);

    /* ~26% */


    //var w = Math.ceil(0.6 * node.label.length * fontSize);
    //var h = Math.ceil(w * 3 / 4);

    bm[7] = performance.now();

    context.textAlign = textAlign;
    context.fillStyle = fillStyle;
    context.font = font;

    /* 31% */

    bm[8] = performance.now();

    context.fillText(node.label, textX, textY);

    /* 86% */
  };
}).call(this);
