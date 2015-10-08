/*
  Let's summarize.
  * One "caption format" per node category
  * Color is bound to an attribute OR the category
    - If the attribute is qualitative (or is category) -> random color
    - If the attribute is quantitative -> gradient
  * Icon is bound to an attribute OR the category (only qualitative)
  * Size is bound a quantitative attribute
*/

;(function(undefined) {
  'use strict';

  if (typeof sigma === 'undefined')
    throw 'sigma is not declared';

  // Initialize package:
  sigma.utils.pkg('sigma.plugins');


  function getPropertyName(prop) {
    var s = prop.split('.');
    if (s.length > 2 && s[s.length - 2] === 'categories') {
      return 'Category';
    } else {
      return prettyfy(s[s.length - 1]);
    }
  }

  function strToObjectRef(obj, str) {
    if (str == null) return null;
    return str.split('.').reduce(function(obj, i) { return obj[i] }, obj);
  }

  function iterate(obj, func) {
    for (var k in obj) {
      if (!obj.hasOwnProperty(k)) {
        continue;
      }

      func(obj[k], k);
    }
  }

  var widgetWidth = 200,
      legendFontSize = 20,
      legendFontFamily = 'Arial',
      legendColor = 'black';

  /**
   *
   * @param s                   The sigma instance
   * @param canvas              The canvas object on which we must draw the legend
   * @param config  {{Object}}  nbRows, nbColumns, ordering
   *
   * ordering: define the ordering of widgets: list of:
   * 'node_size', 'node_icons', 'node_colors', 'node_text', 'edge_size', 'edge_direction'
   * 'edge_colors', 'edge_text'
   */
  sigma.plugins.drawLegend = function (s, canvas, config) {
    var designPlugin = sigma.plugins.design(s),
        context = canvas.getContext('2d');

    /* Nodes size */
    context.drawImage(drawSizeLegend(s.graph.nodes(), designPlugin.styles.nodes, 'node'), 10, 10);
    context.drawImage(drawSizeLegend(s.graph.edges(), designPlugin.styles.edges, 'edge', '%'), 10, 200);
    context.drawImage(drawQualitativeLegend(designPlugin.styles.nodes, designPlugin.palette, 'node', 'color'), 10, 350);
    context.drawImage(drawQualitativeLegend(designPlugin.styles.nodes, designPlugin.palette, 'node', 'icon'), 10, 550);
  };

  function getWidgetsLayout(nbRows, nbCols, placement, nbWidgets) {
    var layout = [];

    var horizontal = placement === 'left' || placement === 'right';
    for (var i = 0; i < nbRows; ++i) {
      for (var j = 0; j < nbCols; ++j) {

      }
    }
  }

  function getNodeSizeWidgetDimensions(maxNodeSize) {
    var height = ((maxNodeSize > legendFontSize ? maxNodeSize : legendFontSize) + 10) * 4;
    var width = 50;

    return {w:width, h:height};
  }

  function LegendWidget(x, y, context) {
    this.x = x;
    this.y = y;
    this.parentContext = context;
  }

  /**
   *
   * @param elts
   * @param styles
   * @param eltType 'node' or 'edge'
   * @param unit
   * @returns {*}
   */
  function drawSizeLegend(elts, styles, eltType, unit) {
    if (elts.length === 0) {
      return null;
    }

    var canvas = document.createElement('canvas'),
        context = canvas.getContext('2d'),
        propName = styles.size.by,
        minValue = strToObjectRef(elts[0], propName),
        maxValue = minValue,
        lineHeight = (styles.size.max * 2 > legendFontSize ? styles.size.max * 2 : legendFontSize) + 10,
        width = widgetWidth,
        height = lineHeight * 4;

    canvas.width = width;
    canvas.height = height;

    for (var i = 1; i < elts.length; ++i) {
      var value = strToObjectRef(elts[i], propName);
      if (value < minValue) {
        minValue = value;
      } else if (value > maxValue) {
        maxValue = value;
      }
    }

    context.fillStyle = '#dddddd';
    context.fillRect(0, 0, width, height);

    drawWidgetTitle(canvas, getPropertyName(styles.size.by) + (unit ? ' (' + unit + ')' : ''));

    if (eltType === 'node') {
      context.textAlign = 'left';
      context.fillText(maxValue, width / 2, 1.5 * lineHeight - 2);
      context.fillText((minValue + maxValue) / 2, width / 2, 2.5 * lineHeight - 2);
      context.fillText(minValue, width / 2, 3.5 * lineHeight - 2);

      drawCircle(context, lineHeight, lineHeight * 1.5, styles.size.max, 'black');
      drawCircle(context, lineHeight, lineHeight * 2.5, (styles.size.max + styles.size.min) / 2, 'black');
      drawCircle(context, lineHeight, lineHeight * 3.5, styles.size.min, 'black');
    } else if (eltType === 'edge') {
      var colWidth = widgetWidth / 3;
      context.textAlign = 'center';
      context.fillText(maxValue, colWidth * 0.5, lineHeight * 3);
      context.fillText((minValue + maxValue) / 2, colWidth * 1.5, lineHeight * 3);
      context.fillText(minValue, colWidth * 2.5, lineHeight * 3);

      var meanSize = (styles.size.max + styles.size.min) / 2;
      context.fillStyle = 'black';
      context.fillRect(0, lineHeight * 1.8, colWidth, styles.size.max);
      context.fillRect(colWidth, lineHeight * 1.8 + meanSize / 2, colWidth, meanSize);
      context.fillRect(colWidth * 2, lineHeight * 1.8 + meanSize, colWidth, styles.size.min);
    }

    return canvas;
  }

  /**
   *
   * @param nodes
   * @param nodeStyles
   * @param palette
   * @param elementType     'node' or 'edge'
   * @param legendType      'color' or 'icon'
   */
  function drawQualitativeLegend(styles, palette, elementType, legendType) {
    var canvas = document.createElement('canvas'),
        context = canvas.getContext('2d'),
        lineHeight = legendFontSize + 20,
        scheme = palette[styles[legendType].scheme],
        height = lineHeight * (Object.keys(scheme).length + 1);

    canvas.width = widgetWidth;
    canvas.height = height;

    context.fillStyle = '#dddddd';
    context.fillRect(0, 0, widgetWidth, height);

    drawWidgetTitle(canvas, getPropertyName(styles[legendType].by));

    var leftColumnWidth = widgetWidth / 3,
        offsetY = lineHeight * 1.5;

    context.fillStyle = legendColor;
    context.textAlign = 'center';
    iterate(scheme, function (value, key) {
      if (legendType === 'color') {
        drawCircle(context, leftColumnWidth / 2, offsetY, legendFontSize / 2, value);
      } else {
        context.fillStyle = value.color;
        setFont(context, value.font, legendFontSize * value.scale);
        context.fillText(value.content, leftColumnWidth / 2, offsetY);
      }
      offsetY += lineHeight;
    });

    context.textAlign = 'left';
    offsetY = lineHeight * 1.5;
    iterate(scheme, function (value, key) {
      setFont(context, legendFontFamily, legendFontSize);
      context.fillStyle = legendColor;
      context.fillText(prettyfy(key), leftColumnWidth, offsetY);
      offsetY += lineHeight;
    });

    return canvas;
  }

  function drawCircle(context, x, y, radius, color) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.closePath();
    context.fill();
  }

  function drawWidgetTitle(canvas, title) {
    var context = canvas.getContext('2d');
    context.fillStyle = legendColor;
    context.font = legendFontSize + 'px ' + legendFontFamily;
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.fillText(title, canvas.width / 2, 0.5 * legendFontSize + 5);
  }

  function prettyfy(txt) {
    return txt.charAt(0).toUpperCase() + txt.slice(1).replace('_', ' ');
  }

  function setFont(context, fontFamily, fontSize) {
    context.font = fontSize + 'px ' + fontFamily;
  }

}).call(this);