/*
  API:
  * [legend] addWidget(elementType, visualVar, ?unit)
  * [legend] removeWidget(widget)/(elementType, visualVar)
  * [legend] setPlacement(top|bottom|right|left)
  * [legend] redraw()
  * [legend] toggleVisibility()
  * [widget] addTextWidget(text)
  * [widget] setPosition(x, y)
  * [widget] unpin()
  * [widget] setText(text)
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
      if (!obj.hasOwnProperty(k) || obj[k] === undefined) {
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
   * @param svg
   * @param externalCSS
   * @param onload
   */
  function buildImageFromSvg(svg, externalCSS, onload) {
    var str =
      '<?xml-stylesheet type="text/css" href="http://maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css" ?>' +
      '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="' + svg.width + 'px" height="' + svg.height + 'px">';
        //+ '<defs><style type="text/css"><![CDATA[' + externalCSS + ']]></style></defs>'

    //for (var i = 0; i < externalCSS.length; ++i) {
    //  str += '<use xlink:href="' + externalCSS[i] + '"></use>';
    //}

    str += svg.innerHTML + '</svg>';
    var src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(str))),
        img = new Image();

    if (typeof onload === 'function') {
      img.onload = onload;
    }
    img.src = src;

    return img;
  }

  var _legendInstances = {};

  sigma.plugins.legend = function (s) {
    if (!_legendInstances[s.id]) {
      _legendInstances[s.id] = new LegendPlugin(s);
    }

    return _legendInstances[s.id];
  };

  sigma.plugins.killLegend = function (s) {
    var legendInstance = _legendInstances[s.id];
    if (legendInstance) {
      iterate(legendInstance.widgets, function (value, key) {
        legendInstance.widgets[key] = undefined;
      });
      _legendInstances[s.id] = undefined;
    }
  };

  function computeTotalWidth(visualSettings) {
    visualSettings.totalWidgetWidth = visualSettings.legendWidth + (visualSettings.legendBorderWidth + visualSettings.legendOuterMargin) * 2
  }


  function LegendPlugin(s) {
    var self = this,
        settings = s.settings;

    this.visible = true;
    this.sigmaInstance = s;
    this.designPlugin = sigma.plugins.design(s);
    this.textWidgetCounter = 1;
    this.enoughSpace = false;
    this.placement = 'bottom';
    this.externalCSS = [];

    this.visualSettings = {
      legendWidth: settings('legendWidth') || 150,
      legendFontFamily: settings('legendFontFamily') || 'Arial',
      legendFontSize: settings('legendFontSize') || 10,
      legendFontColor: settings('legendFontColor') || 'black',
      legendTitleFontFamily: settings('legendTitleFontFamily') || 'Arial',
      legendTitleFontSize: settings('legendTitleFontSize') || 15,
      legendTitleFontColor: settings('legendTitleFontColor') || 'black',
      legendShapeColor: settings('legendShapeColor') || 'orange',
      legendBackgroundColor: settings('legendBackgroundColor') || 'white',
      legendBorderColor: settings('legendBorderColor') || 'black',
      legendBorderWidth: settings('legendBorderWidth') || 1,
      legendInnerMargin: settings('legendInnerMargin') || 8,
      legendOuterMargin: settings('legendOuterMargin') || 5
    };

    computeTotalWidth(this.visualSettings);

    var renderer = s.renderers[0]; // TODO: handle several renderers?
    this.canvas = document.createElement('canvas');
    this.canvas.width = renderer.container.offsetWidth;
    this.canvas.height = renderer.container.offsetHeight;
    this.canvas.style.position = 'absolute';
    this.canvas.style.pointerEvents = 'none';
    renderer.container.appendChild(this.canvas);

    window.addEventListener('resize', function () {
      self.canvas.width = renderer.container.offsetWidth;
      self.canvas.height = renderer.container.offsetHeight;
      self.drawLayout();
    });

    this.widgets = { };
  }

  LegendPlugin.prototype.setExternalCSS = function (externalCSSList) {
    var self = this;
    this.externalCSS = externalCSSList;
  };

  /**
   * Build the widgets and redraw the legend.
   * Must be called whenever the graph's design changes
   */
  LegendPlugin.prototype.redraw = function () {
    this.buildWidgets();
    this.drawLayout();
  };

  LegendPlugin.prototype.buildWidgets = function () {
    var self = this;
    iterate(this.widgets, function (value) {
      value.build(function () {
        return self.enoughSpace && self.visible;
      });
    });
  };

  /**
   * Toggle the visibility of the legend.
   */
  LegendPlugin.prototype.toggleVisibility = function () {
    this.visible = !this.visible;
    this.draw();
  };

  /**
   * Change the position of the legend.
   * @param newPlacement 'top', 'bottom', 'left' or 'right'
   */
  LegendPlugin.prototype.setPlacement = function (newPlacement) {
    if (['top', 'bottom', 'right', 'left'].indexOf(newPlacement) === -1) {
      return;
    }

    this.placement = newPlacement;
    this.drawLayout();
  };

  LegendPlugin.prototype.drawLayout = function () {
    var vs = this.visualSettings,
        horizontal = this.placement === 'top' || this.placement === 'bottom',
        maxHeight = this.canvas.height,
        maxWidth = this.canvas.width,
        widgetList = getUnpinnedWidgets(this.widgets),
        cols,
        height = horizontal ? getMaxHeight(this.widgets) + vs.legendOuterMargin * 2 : maxHeight,
        maxNbCols = horizontal ? Math.floor(maxWidth / vs.totalWidgetWidth) : 1,
        layoutOk = false,
        notEnoughSpace = false;

    while (!layoutOk) {
      layoutOk = true;
      if (height > maxHeight || maxNbCols * vs.totalWidgetWidth > maxWidth) {
        notEnoughSpace = true;
        break;
      }

      cols = [];
      for (var i = 0; i < maxNbCols; ++i) {
        cols.push({widgets: [], height: vs.legendOuterMargin * 2});
      }

      for (var i = 0; i < widgetList.length; ++i) {
        var colFound = false;
        for (var j = 0; j < cols.length; ++j) {
          if (widgetList[i].svg.height + cols[j].height <= height) {
            cols[j].widgets.push(widgetList[i]);
            cols[j].height += widgetList[i].svg.height;
            colFound = true;
            break;
          }
        }

        if (!colFound) {
          if (horizontal) {
            height *= 1.2;
          } else {
            maxNbCols += 1;
          }
          layoutOk = false;
          break;
        }
      }
    }

    if (!notEnoughSpace) {
        cols.sort(this.placement === 'right'
          ? function (c1, c2) { return c1.height < c2.height ?  -1 : 1; }
          : function (c1, c2) { return c1.height > c2.height ? -1 : 1; }
        );

      for (var i = 0; i < cols.length; ++i) {
        var h = this.placement === 'bottom' ? height - cols[i].height : 0;
        for (var j = 0; j < cols[i].widgets.length; ++j) {
          cols[i].widgets[j].x = vs.totalWidgetWidth * i + (this.placement === 'right' ? (maxWidth - cols.length * vs.totalWidgetWidth) : vs.legendInnerMargin);
          cols[i].widgets[j].y = h + (this.placement === 'bottom' ? (maxHeight - height - vs.legendInnerMargin) : vs.legendInnerMargin);
          h += cols[i].widgets[j].svg.height;
        }
      }
    }

    this.draw();
    this.enoughSpace = !notEnoughSpace;
  };

  function getUnpinnedWidgets(widgets) {
    var ordered = [];
    iterate(widgets, function (value) {
      if (!value.pinned) {
        ordered.push(value);
      }
    });

    return ordered;
  }

  function getMaxHeight(widgets) {
    var maxWidgetHeight = undefined;
    iterate(widgets, function (widget) {
      if (maxWidgetHeight === undefined || widget.svg.height > maxWidgetHeight) {
        maxWidgetHeight = widget.svg.height;
      }
    });

    return maxWidgetHeight;
  }

  function makeWidgetId(elementType, visualVar) {
    return elementType + '_' + visualVar;
  }

  LegendPlugin.prototype.clear = function () {
    var context = this.canvas.getContext('2d');

    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  };

  LegendPlugin.prototype.draw = function () {
    this.clear();
    if (this.visible && this.enoughSpace) {
      iterate(this.widgets, function (value) {
        if (!value.pinned) {
          value.draw();
        }
      });
      iterate(this.widgets, function (value) {
        if (value.pinned) {
          value.draw();
        }
      });
    }
  };

  /**
   * Add a widget to the legend. Redraw the legend.
   * @param elementType 'node' or 'edge'
   * @param visualVar   'size', 'color', 'icon'
   * @param ?unit       Optional. The unit to be displayed beside the widget's title
   * @returns {*}       The added widget.
   */
  LegendPlugin.prototype.addWidget = function (elementType, visualVar, unit) {
    var widget = this.widgets[makeWidgetId(elementType, visualVar)];

    if (!widget) {
      widget = new LegendWidget(this.canvas, this.sigmaInstance, this.designPlugin, this, elementType, visualVar);
      widget.id = makeWidgetId(elementType, visualVar);
      this.widgets[widget.id] = widget;
    }
    widget.unit = unit;
    widget.build();

    return widget;
  };

  LegendPlugin.prototype.mustDisplayWidget = function (widget) {
    return this.visible && (this.enoughSpace || widget.pinned) && this.widgets[widget.id] !== undefined;
  };

  /**
   * Add a widget that only contains text. Redraw the legend.
   * @param text              The text to be displayed inside the widget.
   * @returns {LegendWidget}  The added widget
   */
  LegendPlugin.prototype.addTextWidget = function (text) {
    var widget = new LegendWidget(this.canvas, this.sigmaInstance, this.designPlugin, this, null, 'text');

    widget.text = text;
    widget.id = 'text' + this.textWidgetCounter++;
    this.widgets[widget.id] = widget;

    widget.build();

    return widget;
  };

  /**
   * Remove a widget.
   * @param arg1  The widget to remove, or the type of element ('node' or 'edge')
   * @param arg2  If the first argument was the type of element, it represents the visual variable
   *              of the widget to remove
   */
  LegendPlugin.prototype.removeWidget = function (arg1, arg2) {
    var id = arg1 instanceof LegendWidget ? arg1.id : makeWidgetId(arg1, arg2);
    if (this.widgets[id]) {
      this.widgets[id] = undefined;
      this.drawLayout();
    }
  };

  function LegendWidget(canvas, sigmaInstance, designPlugin, legendPlugin, elementType, visualVar) {
    this.canvas = canvas;
    this.sigmaInstance = sigmaInstance;
    this.designPlugin = designPlugin;
    this.legendPlugin = legendPlugin;
    this.visualVar = visualVar;
    this.elementType = elementType;
    this.x = 0;
    this.y = 0;
    this.text = '';
    this.unit = null;
    this.img = null;
    this.pinned = false;
  }

  /**
   * Unpin the widget. An pinned widget is not taken into account when it is positioned through
   * automatic layout.
   */
  LegendWidget.prototype.unpin = function () {
    this.pinned = false;
    this.legendPlugin.drawLayout();
  };

  LegendWidget.prototype.build = function () {
    var self = this,
        vs = this.legendPlugin.visualSettings;

    if (this.visualVar === 'size') {
      this.svg = drawSizeLegend(vs, this.sigmaInstance.graph, this.designPlugin, this.elementType, this.unit)
    } else if (this.visualVar !== 'text') {
      this.svg = drawNonSizeLegend(vs, this.sigmaInstance.graph, this.designPlugin, this.elementType, this.visualVar, this.unit);
    } else {
      var lines = getLines(vs, this.text, vs.legendWidth - 2 * vs.legendInnerMargin),
          lineHeight = vs.legendFontSize + 2,
          height = lines.length * lineHeight + vs.legendInnerMargin * 2,
          offsetY = vs.legendInnerMargin;

      this.svg = document.createElement('svg');
      draw(this.svg, 'rect', {x:vs.legendBorderWidth, y:vs.legendBorderWidth, width:vs.legendWidth, height:height, stroke:vs.legendBorderColor, 'stroke-width':vs.legendBorderWidth, fill:vs.legendBackgroundColor, rx:10, ry:10});

      for (var i = 0; i < lines.length; ++i) {
        drawText(vs, this.svg, lines[i], vs.legendInnerMargin, offsetY, null, null, null, null, 'text-before-edge');
        offsetY += lineHeight;
      }

      this.svg.width = vs.totalWidgetWidth;
      this.svg.height = height + 2 * vs.legendOuterMargin;
    }

    this.img = buildImageFromSvg(this.svg, this.legendPlugin.externalCSS, function () {
      if (self.legendPlugin.mustDisplayWidget(self)) {
        self.legendPlugin.drawLayout();
      }
    });
  };

  function getLines(vs, text, maxWidth) {
    var approximateWidthMeasuring = false,
        spaceWidth = getTextWidth(' ', vs.legendFontFamily, vs.legendFontSize, approximateWidthMeasuring),
        words = text.split(' '),
        lines = [{width:-spaceWidth, words:[]}],
        lineIndex = 0,
        lineList = [];

    for (var i = 0; i < words.length; ++i) {
      var width = getTextWidth(words[i] + ' ', vs.legendFontFamily, vs.legendFontSize, approximateWidthMeasuring);
      if (lines[lineIndex].width + width <= maxWidth) {
        lines[lineIndex].words.push(words[i] + ' ');
        lines[lineIndex].width += width;
      } else {
        lines.push({width:width-spaceWidth, words:[words[i] + ' ']});
        lineIndex++;
      }
    }

    for (i = 0; i < lines.length; ++i) {
      var str = '';
      for (var j = 0; j < lines[i].words.length; ++j) {
        str += lines[i].words[j];
      }
      lineList.push(str);
    }

    return lineList;
  }

  LegendWidget.prototype.draw = function () {
    this.canvas.getContext('2d').drawImage(this.img, this.x, this.y);
  };

  /**
   * Change the position of a widget and pin it. An pinned widget is not taken into account when
   * it is positioned through automatic layout.
   * @param x
   * @param y
   */
  LegendWidget.prototype.setPosition = function (x, y) {
    this.pinned = true;
    this.x = x;
    this.y = y;
    this.legendPlugin.drawLayout();
  };

  /**
   * Set the text of a widget. The widget must be a text widget.
   * @param text The text to be displayed by the widget.
   */
  LegendWidget.prototype.setText = function (text) {
    this.text = text;
    this.build();
  };

  function getBoundaryValues(elements, propertyName) {
    var minValue = elements.length > 0 ? strToObjectRef(elements[0], propertyName) : 0,
        maxValue = minValue;

    for (var i = 1; i < elements.length; ++i) {
      var value = strToObjectRef(elements[i], propertyName);
      if (value < minValue) {
        minValue = value;
      } else if (value > maxValue) {
        maxValue = value;
      }
    }

    return {min:minValue, max:maxValue};
  }

  function extractValueList(boundaries, number) {
    var list = [],
        dif = boundaries.max - boundaries.min;

    for (var i = 0; i < number + 1; ++i) {
      list.push(boundaries.min + dif * (i / number))
    }

    return list;
  }

  function drawSizeLegend(visualSettings, graph, designPluginInstance, elementType, unit) {
    var vs = visualSettings,
        svg = document.createElement('svg'),
        elts = elementType === 'node' ? graph.nodes() : graph.edges(),
        styles = elementType === 'node' ? designPluginInstance.styles.nodes : designPluginInstance.styles.edges,
        titleMargin = vs.legendTitleFontSize + vs.legendInnerMargin + vs.legendFontSize * 1.5,
        propName = styles.size.by,
        boundaries = getBoundaryValues(elts, propName),
        minValue = boundaries.min,
        maxValue = boundaries.max,
        meanValue,
        ratio = styles.size.max / styles.size.min,
        bigElementSize = vs.legendFontSize * 1.5,
        smallElementSize = bigElementSize / ratio,
        mediumElementSize = (bigElementSize + smallElementSize) / 2,
        height;

    if (minValue % 1 === 0 && maxValue % 1 === 0) {
      meanValue = Math.round((minValue + maxValue) / 2);
    } else {
      meanValue = (minValue + maxValue) / 2;
    }

    if (elementType === 'node') {
      var circleBorderWidth = 2;

      height = titleMargin + bigElementSize * 2 + 10;

      draw(svg, 'rect', {x:vs.legendBorderWidth, y:vs.legendBorderWidth, width:vs.legendWidth, height:height, stroke:vs.legendBorderColor, 'stroke-width':vs.legendBorderWidth, fill:vs.legendBackgroundColor, rx:10, ry:10});

      drawWidgetTitle(vs, svg, getPropertyName(styles.size.by), unit);
      drawText(vs, svg, maxValue, vs.legendWidth / 2, titleMargin + vs.legendFontSize);
      drawText(vs, svg, meanValue, vs.legendWidth / 2, titleMargin + 2 * vs.legendFontSize);
      drawText(vs, svg, minValue, vs.legendWidth / 2, titleMargin + 3 * vs.legendFontSize);

      drawCircle(svg, bigElementSize + circleBorderWidth + vs.legendInnerMargin, titleMargin + bigElementSize, bigElementSize, vs.legendBackgroundColor, vs.legendShapeColor, circleBorderWidth);
      drawCircle(svg, bigElementSize + circleBorderWidth + vs.legendInnerMargin, titleMargin + bigElementSize * 2 - mediumElementSize, mediumElementSize, vs.legendBackgroundColor, vs.legendShapeColor, circleBorderWidth);
      drawCircle(svg, bigElementSize + circleBorderWidth + vs.legendInnerMargin, titleMargin + bigElementSize * 2 - smallElementSize, smallElementSize, vs.legendBackgroundColor, vs.legendShapeColor, circleBorderWidth);

    } else if (elementType === 'edge') {
      var labelOffsetY = titleMargin + bigElementSize * 1.7,
          rectWidth = (vs.legendWidth - vs.legendInnerMargin * 2) / 3;

      height = labelOffsetY + vs.legendFontSize;


      draw(svg, 'rect', {x:vs.legendBorderWidth, y:vs.legendBorderWidth, width:vs.legendWidth, height:height, stroke:vs.legendBorderColor, 'stroke-width':vs.legendBorderWidth, fill:vs.legendBackgroundColor, rx:10, ry:10});
      drawWidgetTitle(vs, svg, getPropertyName(styles.size.by), unit);

      draw(svg, 'rect', {x:vs.legendInnerMargin, y:titleMargin + 5, width:rectWidth, height:bigElementSize / 2, fill:vs.legendShapeColor});
      draw(svg, 'rect', {x:vs.legendInnerMargin + rectWidth, y:titleMargin + 5 + (bigElementSize - mediumElementSize) / 4, width:rectWidth, height:mediumElementSize / 2, fill:vs.legendShapeColor});
      draw(svg, 'rect', {x:vs.legendInnerMargin + 2 * rectWidth, y:titleMargin + 5 + (bigElementSize - smallElementSize) / 4, width:rectWidth, height:smallElementSize / 2, fill:vs.legendShapeColor});

      drawText(vs, svg, maxValue, vs.legendInnerMargin + rectWidth * 0.5, labelOffsetY, 'middle');
      drawText(vs, svg, meanValue, vs.legendInnerMargin + rectWidth * 1.5, labelOffsetY, 'middle');
      drawText(vs, svg, minValue, vs.legendInnerMargin + rectWidth * 2.5, labelOffsetY, 'middle');
    }

    svg.width = vs.totalWidgetWidth;
    svg.height = height + (vs.legendBorderWidth + vs.legendOuterMargin) * 2;

    return svg;
  }

  function drawNonSizeLegend(visualSettings, graph, designPluginInstance, elementType, visualVar, unit) {
    var vs = visualSettings,
        svg = document.createElement('svg'),
        elts = elementType === 'node' ? graph.nodes() : graph.edges(),
        styles = elementType === 'node' ? designPluginInstance.styles.nodes : designPluginInstance.styles.edges,
        palette = designPluginInstance.palette,
        lineHeight = vs.legendFontSize * 1.5,
        titleMargin = vs.legendTitleFontSize + vs.legendInnerMargin + lineHeight,
        quantitativeColorEdge = elementType === 'edge' && visualVar === 'color' && styles.color.bins,
        scheme = quantitativeColorEdge ? palette[styles.color.scheme][styles.color.bins] : palette[styles[visualVar].scheme],
        height = lineHeight * Object.keys(scheme).length + titleMargin + (elementType === 'edge' && visualVar === 'type' ? lineHeight : 0),
        leftColumnWidth = vs.legendWidth / 3,
        offsetY = titleMargin;

    draw(svg, 'rect', {x:vs.legendBorderWidth, y:vs.legendBorderWidth, width:vs.legendWidth, height:height, stroke:vs.legendBorderColor, 'stroke-width':vs.legendBorderWidth, fill:vs.legendBackgroundColor, rx:10, ry:10});
    drawWidgetTitle(vs, svg, getPropertyName(styles[visualVar].by), unit);

    /* Display additional information for the type of edge */
    if (elementType === 'edge' && visualVar === 'type') {
      var txt =  '(source node to target node)',
          fontSize = shrinkFontSize(txt, vs.legendFontFamily, vs.legendFontSize, vs.legendWidth - vs.legendInnerMargin);
      drawText(vs, svg, txt, vs.legendWidth / 2, offsetY, 'middle', vs.legendFontColor, vs.legendFontFamily, fontSize);
      offsetY += lineHeight;
    }

    iterate(scheme, function (value) {
      if (visualVar === 'color') {
        if (elementType === 'edge') {
          draw(svg, 'rect', {x:vs.legendInnerMargin, y:offsetY - lineHeight / 8, width:leftColumnWidth - vs.legendInnerMargin * 2, height:lineHeight / 4, fill:value});
        } else {
          drawCircle(svg, leftColumnWidth / 2, offsetY, vs.legendFontSize / 2, value);
        }
      } else if (visualVar === 'icon') {
        drawText(vs, svg, value.content, leftColumnWidth / 2, offsetY, 'middle', value.color, value.font, vs.legendFontSize * value.scale);
      } else if (visualVar === 'type') {
        if (elementType === 'edge') {
          drawEdge(vs, svg, value, vs.legendInnerMargin, leftColumnWidth - vs.legendInnerMargin, offsetY, vs.legendFontSize / 3);
        } else {
          drawShape(vs, svg, value, leftColumnWidth / 2, offsetY, vs.legendFontSize / 2);
        }
      }
      offsetY += lineHeight;
    });

    offsetY = titleMargin + (elementType === 'edge' && visualVar === 'type' ? lineHeight : 0);
    if (quantitativeColorEdge) {
      var boundaries = getBoundaryValues(elts, styles.color.by),
          valueList = extractValueList(boundaries, styles.color.bins),
          isInteger = boundaries.min % 1 == 0 && boundaries.max % 1 == 0;

      for (var i = 0; i < scheme.length; ++i) {
        var txt = round(valueList[i] + (isInteger && i !== 0 ? 1 : 0), isInteger) + ' - ' + round(valueList[i+1], isInteger);
        drawText(vs, svg, txt, leftColumnWidth * 1.2, offsetY, 'left', null, null, null, 'middle');
        offsetY += lineHeight;
      }
    } else {
      iterate(scheme, function (value, key) {
        drawText(vs, svg, prettyfy(key), leftColumnWidth * 1.2, offsetY, 'left', null, null, null, 'middle');
        offsetY += lineHeight;
      });
    }

    svg.width = vs.totalWidgetWidth;
    svg.height = height + (vs.legendBorderWidth + vs.legendOuterMargin) * 2;

    return svg;
  }

  function drawText(vs, svg, content, x, y, textAlign, color, fontFamily, fontSize, verticalAlign) {
    createAndAppend(svg, 'text', {
      x: x,
      y: y,
      'text-anchor': textAlign ? textAlign : 'left',
      fill: color ? color : vs.legendFontColor,
      'font-size': fontSize ? fontSize : vs.legendFontSize,
      'font-family': fontFamily ? fontFamily : vs.legendFontFamily,
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

  function drawEdge(vs, svg, type, x1, x2, y, size) {
    var triangleSize = size * 2.5,
        curveHeight = size * 3,
        offsetX = Math.sqrt(3) / 2 * triangleSize;

    if (type === 'arrow') {
      drawLine(svg, x1, y, x2 - offsetX + 1, y, vs.legendShapeColor, size);
      drawPolygon(svg, [x2, y, x2 - offsetX, y - triangleSize / 2, x2 - offsetX, y + triangleSize / 2], vs.legendShapeColor);
    } else if (type === 'parallel') {
      size *= 0.8;
      drawLine(svg, x1, y - size, x2, y - size, vs.legendShapeColor, size);
      drawLine(svg, x1, y + size, x2, y + size, vs.legendShapeColor, size);
    } else if (type === 'curve') {
      drawCurve(svg, x1, y, (x1 + x2) / 2, y - curveHeight, x2, y, vs.legendShapeColor, size);
    } else if (type === 'curvedArrow') {
      var angle,
          len = x2 - x1;

      /* Warning: this is totally arbitrary. It's only an approximation, it should be replaced by proper values */
      if (len < 40) {
        angle = 35;
      } else if (len < 60) {
        angle = 33;
      } else {
        angle = 30;
      }

      drawCurve(svg, x1, y, (x1 + x2) / 2, y - curveHeight, x2 - triangleSize / 2, y - size, vs.legendShapeColor, size);
      drawPolygon(svg, [x2, y, x2 - offsetX, y - triangleSize / 2, x2 - offsetX, y + triangleSize / 2], vs.legendShapeColor, {angle:angle, cx:x2, cy:y});
    } else if (type === 'dashed') {
      var dashArray = '8 3';  // Same values as in sigma.renderers.linkurious/canvas/sigma.canvas.edges.dashed
      drawLine(svg, x1, y, x2, y, vs.legendShapeColor, size, dashArray);
    } else if (type === 'dotted') {
      var dotDashArray = '2'; // Same values as in sigma.renderers.linkurious/canvas/sigma.canvas.edges.dotted
      drawLine(svg, x1, y, x2, y, vs.legendShapeColor, size, dotDashArray);
    } else if (type === 'tapered') {
      drawPolygon(svg, [x1, y + size, x1, y - size, x2, y], vs.legendShapeColor);
    }
  }

  function drawCurve(svg, x1, y1, x2, y2, x3, y3, color, width) {
    var d = 'M ' + x1 + ' ' + y1 + ' Q ' + x2 + ' ' + y2 + ' ' + x3 + ' ' + y3;

    createAndAppend(svg, 'path', {
      d:d,
      stroke:color,
      'stroke-width':width,
      fill:'none'
    });
  }

  function drawShape(vs, svg, shape, x, y, size) {
    var points = [],
        angle;

    if (shape === 'diamond') {
      size *= 1.3;
      points = [ x - size,  y, x, y - size, x + size, y, x, y + size ];
    } else if (shape === 'star') {
      size *= 1.7;
      angle = -Math.PI / 2;

      for (var i = 0; i < 5; ++i) {
        points[i*2] = Math.cos(angle);
        points[i*2+1] = Math.sin(angle);
        angle += Math.PI * 4 / 5;
      }
    } else if (shape === 'equilateral') {
      size *= 1.3;
      var nbPoints = 5; // Default value like in sigma.renderers.linkurious/canvas/sigma.canvas.nodes.equilateral

      angle = -Math.PI / 2;

      for (var i = 0; i < nbPoints; ++i) {
        points[i*2] = Math.cos(angle);
        points[i*2+1] = Math.sin(angle);
        angle += Math.PI * 2 / nbPoints;
      }
    } else if (shape === 'square') {
      points = [x - size, y - size, x + size, y - size, x + size, y + size, x - size, y + size];
    }

    if (shape === 'star' || shape === 'equilateral') {
      for (var i = 0; i < points.length; i += 2) {
        points[i] = x + points[i] * size;
        points[i+1] = y + points[i+1] * size;
      }
    }

    if (shape !== 'cross') {
      drawPolygon(svg, points, vs.legendShapeColor);
    } else {
      size *= 1.2;
      var lineWidth = 2; // Arbitrary
      drawLine(svg, x - size, y, x + size, y, vs.legendShapeColor, lineWidth);
      drawLine(svg, x, y - size, x, y + size, vs.legendShapeColor, lineWidth);
    }
  }

  function drawPolygon(svg, points, color, rotation) {
    var attrPoints = points[0] + ',' + points[1];
    for (var i = 2; i < points.length; i += 2) {
      attrPoints += ' ' + points[i] + ',' + points[i+1];
    }

    var attributes = {points:attrPoints, fill:color};
    if (rotation) {
      attributes.transform = 'rotate(' + rotation.angle + ', ' + rotation.cx + ', ' + rotation.cy + ')';
    }

    createAndAppend(svg, 'polygon', attributes);
  }

  function drawLine(svg, x1, y1, x2, y2, color, width, dashArray) {
    createAndAppend(svg, 'line', {
      x1:x1,
      y1:y1,
      x2:x2,
      y2:y2,
      stroke:color,
      'stroke-width':width,
      'stroke-dasharray':dashArray
    });
  }

  function draw(svg, type, args) {
    createAndAppend(svg, type, args);
  }

  function drawWidgetTitle(vs, svg, title, unit) {
    var text = title + (unit ? ' (' + unit + ')' : ''),
        fontSize = shrinkFontSize(text, vs.legendTitleFontFamily, vs.legendTitleFontSize, vs.legendWidth - vs.legendInnerMargin);

    drawText(vs, svg, text, vs.legendWidth / 2, vs.legendFontSize + vs.legendInnerMargin, 'middle', vs.legendTitleFontColor, vs.legendTitleFontFamily, fontSize);
  }

  function prettyfy(txt) {
    return txt.charAt(0).toUpperCase() + txt.slice(1).replace('_', ' ');
  }

  function shrinkFontSize(text, fontFamily, fontSize, maxWidth) {
    while (getTextWidth(text, fontFamily, fontSize, false) > maxWidth) {
      fontSize -= (fontSize > 15 ? 2 : 1);
    }

    return fontSize;
  }

  var helper = document.createElement('canvas').getContext('2d');
  function getTextWidth(text, fontFamily, fontSize, approximate) {
    if (approximate) {
      return 0.45 * fontSize * text.length;
    } else {
      helper.font = fontSize + 'px ' + fontFamily;
      return helper.measureText(text).width;
    }
  }

  function round(number, isInteger) {
    if (isInteger) {
      return Math.round(number);
    } else {
      return Math.round(number * 1000) / 1000;
    }
  }

}).call(this);