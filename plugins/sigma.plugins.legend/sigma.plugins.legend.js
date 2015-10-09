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

  function createAndAppend(parentElement, typeToCreate, attributes, elementValue, force) {
    attributes = attributes || {};

    var elt = document.createElement(typeToCreate);

    for (var key in attributes) {
      if (!attributes.hasOwnProperty(key)) {
        continue;
      }
      var value = attributes[key];
      if (value !== undefined) {
        elt.setAttribute(key, value);
      }
    }

    if (elementValue !== undefined || force) {
      if (Object.prototype.toString.call(elementValue) === '[object Object]') {
        elementValue = JSON.stringify(elementValue);
      }

      var textNode = document.createTextNode(elementValue);
      elt.appendChild(textNode);
    }

    parentElement.appendChild(elt);

    return elt;
  }

  /**
   * 'btoa' converts UTF-8 to base64. The reason we use 'unescape(encodeURIComponent(...))' is
   * to handle the special characters that are not part of Latin1.
   * http://stackoverflow.com/questions/23223718/failed-to-execute-btoa-on-window-the-string-to-be-encoded-contains-characte
   *
   * @param canvas
   * @param svg
   * @param x
   * @param y
   */
  function buildImageFromSvg(svg, fontURLs, onload) {
    var str = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="' + svg.width + 'px" height="' + svg.height + 'px">' + svg.innerHTML + '</svg>',
        src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(str))),
        img = new Image();

    if (typeof onload === 'function') {
      img.onload = onload;
    }
    img.src = src;

    return img;
  }

  var widgetWidth = 200,
      legendFontSize = 20,
      legendFontFamily = 'Arial',
      legendColor = 'black',
      leftMargin = 10,
      backgroundBorderWidth = 2,
      widgetMargin = 5;

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
  sigma.plugins.drawLegend = function (s, canvas) {
    var designPlugin = sigma.plugins.design(s);

    displaySvgOnCanvas(canvas, drawQuantitativeLegend(s.graph, designPlugin, 'node', null), 10, 10);
    displaySvgOnCanvas(canvas, drawQuantitativeLegend(s.graph, designPlugin, 'edge', '%'), 10, 160);
    displaySvgOnCanvas(canvas, drawQualitativeLegend(designPlugin, 'node', 'color'), 10, 300);
    displaySvgOnCanvas(canvas, drawQualitativeLegend(designPlugin, 'node', 'icon'), 10, 550);
    displaySvgOnCanvas(canvas, drawQualitativeLegend(designPlugin, 'edge', 'color'), 10, 800);
  };

  sigma.plugins.legend = function (s) {
    if (!s.legendPlusinInstance) {
      s.legendPlusinInstance = new LegendPlugin(s);
    }

    return s.legendPlusinInstance;
  };


  function LegendPlugin(s) {
    this.fontURLs = [];
    this.active = true;
    this.sigmaInstance = s;
    this.designPlugin = sigma.plugins.design(s);
    this.textWidgetCounter = 1;

    var d = this.designPlugin;

    this.widgets = {
      'node_size': new LegendWidget(s, d, 'quantitative', 'node'),
      'edge_size': new LegendWidget(s, d, 'quantitative', 'edge'),
      'node_color': new LegendWidget(s, d, 'qualitative', 'node', 'color'),
      'edge_color': new LegendWidget(s, d, 'qualitative', 'edge', 'color'),
      'node_icon': new LegendWidget(s, d, 'qualitative', 'node', 'icon')
    };

    this.setPlacement('bottom');
  }

  LegendPlugin.prototype.init = function (fontURLs) {
    this.fontURLs = fontURLs;
  };

  LegendPlugin.prototype.getWidget = function (widget_id) {
    return this.widgets[widget_id];
  };

  LegendPlugin.prototype.build = function (canvas) {
    iterate(this.widgets, function (value, key) {
      value.build(canvas);
    });
  };

  LegendPlugin.prototype.setPlacement = function (newPlacement, canvas) {
    if (['top', 'bottom', 'right', 'left'].indexOf(newPlacement) === -1) {
      return;
    }

    this.placement = newPlacement;
    var horizontal = newPlacement === 'top' || newPlacement === 'bottom',
        maxHeight = canvas.height,
        maxWidth = canvas.width,
        ordered = getOrderedWidgets(this.widgets);

    if (horizontal) {

    } else {
      var cols = [];
    }
  };

  function getOrderedWidgets(widgets) {
    var ordered = [];
    iterate(widgets, function (value) {
      ordered.push(value);
    });

    ordered.sort(function (w1, w2) {
      return w1.svg.height < w2.svg.height ? -1 : 1;
    });

    return ordered;
  }

  LegendPlugin.prototype.draw = function (canvas) {
    if (this.active) {
      iterate(this.widgets, function (value, key) {
        value.draw(canvas);
      });
    }
  };

  LegendPlugin.prototype.addTextWidget = function (text) {
    var widget = new LegendWidget(this.sigmaInstance, this.designPlugin, 'text');

    widget.text = text;
    widget.id = 'text' + this.textWidgetCounter++;
    widget.build();

    this.widgets[widget.id] = widget;
  };

  LegendPlugin.prototype.removeWidget = function (widget) {
    if (this.widgets[widget.id]) {
      delete this.widgets[widget.id];
    }
  };

  LegendPlugin.prototype.toggleVisibility = function () {
    this.active = !this.active;
  };

  function LegendWidget(sigmaInstance, designPlugin, legendType, elementType, visualVar) {
    this.sigmaInstance = sigmaInstance;
    this.designPlugin = designPlugin;
    this.legendType = legendType;
    this.visualVar = visualVar;
    this.elementType = elementType;
    this.x = 0;
    this.y = 0;
    this.text = '';
    this.unit = null;
    this.active = true;
    this.img = null;
  }

  LegendWidget.prototype.build = function (canvas) {
    if (this.legendType === 'quantitative') {
      this.svg = drawQuantitativeLegend(this.sigmaInstance.graph, this.designPlugin, this.elementType, null)
    } else if (this.legendType === 'qualitative') {
      this.svg = drawQualitativeLegend(this.designPlugin, this.elementType, this.visualVar);
    } else {
      this.svg = document.createElement('svg');
      drawText(this.svg, this.text, 0, 0);
    }

    var self = this;
    this.img = canvas
      ? buildImageFromSvg(this.svg, this.fontURLs, function () { self.draw(canvas); })
      : buildImageFromSvg(this.svg, this.fontURLs);
  };

  LegendWidget.prototype.draw = function (canvas) {
    if (this.active) {
      canvas.getContext('2d').drawImage(this.img, this.x, this.y);
    }
  };

  LegendWidget.prototype.toggleVisibility = function () {
    this.active = !this.active;
  };

  LegendWidget.prototype.setUnit = function (unit) {
    this.unit = unit;
  };

  LegendWidget.prototype.setText = function (text) {
    this.text = text;
  };

  /**
   *
   * @param elts
   * @param styles
   * @param eltType 'node' or 'edge'
   * @param unit
   * @returns {*}
   */
  function drawQuantitativeLegend(graph, designPluginInstance, elementType, unit) {
    var svg = document.createElement('svg'),
        elts = elementType === 'node' ? graph.nodes() : graph.edges(),
        styles = elementType === 'node' ? designPluginInstance.styles.nodes : designPluginInstance.styles.edges,
        titleMargin = legendFontSize * 2.4,
        propName = styles.size.by,
        minValue = elts.length > 0 ? strToObjectRef(elts[0], propName) : 0,
        maxValue = minValue,
        meanValue,
        ratio = styles.size.max / styles.size.min,
        bigElementSize = legendFontSize * 1.5,
        smallElementSize = bigElementSize / ratio,
        mediumElementSize = (bigElementSize + smallElementSize) / 2,
        height;

    for (var i = 1; i < elts.length; ++i) {
      var value = strToObjectRef(elts[i], propName);
      if (value < minValue) {
        minValue = value;
      } else if (value > maxValue) {
        maxValue = value;
      }
    }

    if (minValue % 1 === 0 && maxValue % 1 === 0) {
      meanValue = Math.round((minValue + maxValue) / 2);
    } else {
      meanValue = (minValue + maxValue) / 2;
    }

    if (elementType === 'node') {
      var circleBorerWidth = 2;

      height = titleMargin + bigElementSize * 2 + 10;

      draw(svg, 'rect', {x:backgroundBorderWidth, y:backgroundBorderWidth, width:widgetWidth, height:height, stroke:'black', 'stroke-width':backgroundBorderWidth, fill:'black', rx:10, ry:10, 'fill-opacity': 0.1});

      drawWidgetTitle(svg, getPropertyName(styles.size.by), unit);
      drawText(svg, maxValue, widgetWidth / 2, titleMargin + legendFontSize);
      drawText(svg, meanValue, widgetWidth / 2, titleMargin + 2 * legendFontSize);
      drawText(svg, minValue, widgetWidth / 2, titleMargin + 3 * legendFontSize);

      drawCircle(svg, bigElementSize + circleBorerWidth + leftMargin, titleMargin + bigElementSize, bigElementSize, 'white', 'black', circleBorerWidth);
      drawCircle(svg, bigElementSize + circleBorerWidth + leftMargin, titleMargin + bigElementSize * 2 - mediumElementSize, mediumElementSize, 'white', 'black', circleBorerWidth);
      drawCircle(svg, bigElementSize + circleBorerWidth + leftMargin, titleMargin + bigElementSize * 2 - smallElementSize, smallElementSize, 'white', 'black', circleBorerWidth);

    } else if (elementType === 'edge') {
      var labelOffsetY = titleMargin + bigElementSize * 1.7,
          rectWidth = (widgetWidth - leftMargin * 2) / 3;

      height = labelOffsetY + legendFontSize;


      draw(svg, 'rect', {x:backgroundBorderWidth, y:backgroundBorderWidth, width:widgetWidth, height:height, stroke:'black', 'stroke-width':backgroundBorderWidth, fill:'black', rx:10, ry:10, 'fill-opacity': 0.1});
      drawWidgetTitle(svg, getPropertyName(styles.size.by), unit);

      draw(svg, 'rect', {x:leftMargin, y:titleMargin + 5, width:rectWidth, height:bigElementSize / 2, fill:'black'});
      draw(svg, 'rect', {x:leftMargin + rectWidth, y:titleMargin + 5 + (bigElementSize - mediumElementSize) / 4, width:rectWidth, height:mediumElementSize / 2, fill:'black'});
      draw(svg, 'rect', {x:leftMargin + 2 * rectWidth, y:titleMargin + 5 + (bigElementSize - smallElementSize) / 4, width:rectWidth, height:smallElementSize / 2, fill:'black'});

      drawText(svg, maxValue, leftMargin + rectWidth * 0.5, labelOffsetY, 'middle');
      drawText(svg, meanValue, leftMargin + rectWidth * 1.5, labelOffsetY, 'middle');
      drawText(svg, minValue, leftMargin + rectWidth * 2.5, labelOffsetY, 'middle');
    }

    svg.width = widgetWidth + backgroundBorderWidth * 2;
    svg.height = height + backgroundBorderWidth * 2;

    return svg;
  }

  /**
   *
   * @param nodes
   * @param nodeStyles
   * @param palette
   * @param elementType     'node' or 'edge'
   * @param legendType      'color' or 'icon'
   */
  function drawQualitativeLegend(designPluginInstance, elementType, legendType) {
    var svg = document.createElement('svg'),
        styles = elementType === 'node' ? designPluginInstance.styles.nodes : designPluginInstance.styles.edges,
        palette = designPluginInstance.palette,
        titleMargin = legendFontSize * 3.5,
        lineHeight = legendFontSize + 20,
        scheme = palette[styles[legendType].scheme],
        height = lineHeight * Object.keys(scheme).length + titleMargin - 10,
        leftColumnWidth = widgetWidth / 3,
        offsetY = titleMargin;

    draw(svg, 'rect', {x:backgroundBorderWidth, y:backgroundBorderWidth, width:widgetWidth, height:height, stroke:'black', 'stroke-width':backgroundBorderWidth, fill:'black', rx:10, ry:10, 'fill-opacity': 0.1});
    drawWidgetTitle(svg, getPropertyName(styles[legendType].by));

    iterate(scheme, function (value, key) {
      if (legendType === 'color') {
        if (elementType === 'edge') {
          draw(svg, 'rect', {x:leftMargin, y:offsetY - lineHeight / 8, width:leftColumnWidth - leftMargin * 2, height:lineHeight / 4, fill:value});
        } else {
          drawCircle(svg, leftColumnWidth / 2, offsetY, legendFontSize / 2, value);
        }
      } else {
        drawText(svg, value.content, leftColumnWidth / 2, offsetY, 'middle', value.color, value.font, legendFontSize * value.scale);
      }
      offsetY += lineHeight;
    });

    offsetY = titleMargin;
    iterate(scheme, function (value, key) {
      drawText(svg, prettyfy(key), leftColumnWidth, offsetY, 'left', null, null, null, 'middle');
      offsetY += lineHeight;
    });

    svg.width = widgetWidth + backgroundBorderWidth * 2;
    svg.height = height + backgroundBorderWidth * 2;

    return svg;
  }

  function drawText(svg, content, x, y, textAlign, color, fontFamily, fontSize, verticalAlign) {
    createAndAppend(svg, 'text', {
      x: x,
      y: y,
      'text-anchor': textAlign ? textAlign : 'left',
      fill: color ? color : legendColor,
      'font-size': fontSize ? fontSize : legendFontSize,
      'font-family': fontFamily ? fontFamily : legendFontFamily,
      'alignment-baseline': verticalAlign ? verticalAlign : 'auto'
    }, content);
  }

  function drawCircle(svg, x, y, r, color, borderColor, borderWidth) {
    createAndAppend(svg, 'circle', {
      cx:x,
      cy:y,
      r:r,
      fill:color,
      stroke:borderColor,
      'stroke-width':borderWidth
    });
  }

  function draw(svg, type, args) {
    createAndAppend(svg, type, args);
  }

  function drawWidgetTitle(svg, title, unit) {
    drawText(svg, title + (unit ? ' (' + unit + ')' : ''), widgetWidth / 2, legendFontSize + 5, 'middle');
  }

  function prettyfy(txt) {
    return txt.charAt(0).toUpperCase() + txt.slice(1).replace('_', ' ');
  }

}).call(this);