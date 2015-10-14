/*
  API:
  * [legend] addWidget(elementType, visualVar)
  * [legend] removeWidget(widget)/(elementType, visualVar, ?unit)
  * [legend] setPlacement(top|bottom|right|left)
  * [legend] refresh()
  * [widget] addTextWidget(text)
  * [widget] setPosition(x, y)
  * [widget] setText(text)
 */

/*
  Settings:
  * fontSize
  *
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
   * @param fontURLs
   * @param onload
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

  var legendWidth = 200,
      legendFontFamily = 'Arial',
      legendFontSize = 15,
      legendFontColor = 'black',
      legendTitleFontFamily = 'Arial',
      legendTitleFontSize = 20,
      legendTitleFontColor = 'black',
      legendShapeColor = 'orange',
      legendBackgroundColor = 'white',
      legendBorderColor =  'black',
      legendBorderWidth = 1,
      legendInnerMargin = 15,
      legendOuterMargin = 5,
      totalWidgetWidth = legendWidth + (legendBorderWidth + legendOuterMargin) * 2;

  var _legendInstances = {};

  sigma.plugins.legend = function (s) {
    if (!_legendInstances[s.id]) {
      _legendInstances[s.id] = new LegendPlugin(s);
    }

    return _legendInstances[s.id];
  };


  function LegendPlugin(s) {
    var self = this;

    this.fontURLs = [];
    this.active = true;
    this.sigmaInstance = s;
    this.designPlugin = sigma.plugins.design(s);
    this.textWidgetCounter = 1;
    this.enoughSpace = false;
    this.placement = 'bottom';

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

  LegendPlugin.prototype.init = function (fontURLs) {
    this.fontURLs = fontURLs;
  };

  LegendPlugin.prototype.redraw = function () {
    this.buildWidgets();
    this.drawLayout();
  };

  LegendPlugin.prototype.buildWidgets = function () {
    var self = this;
    iterate(this.widgets, function (value) {
      value.build(function () {
        return self.enoughSpace && self.active;
      });
    });
  };

  LegendPlugin.prototype.setPlacement = function (newPlacement) {
    if (['top', 'bottom', 'right', 'left'].indexOf(newPlacement) === -1) {
      return;
    }

    this.placement = newPlacement;
    this.drawLayout();
  };

  LegendPlugin.prototype.drawLayout = function () {
    var horizontal = this.placement === 'top' || this.placement === 'bottom',
        maxHeight = this.canvas.height,
        maxWidth = this.canvas.width,
        widgetList = getUnpinnedWidgets(this.widgets),
        cols,
        height = horizontal ? getMaxHeight(this.widgets) + legendOuterMargin * 2 : maxHeight,
        maxNbCols = horizontal ? Math.floor(maxWidth / totalWidgetWidth) : 1,
        layoutOk = false,
        notEnoughSpace = false;

    while (!layoutOk) {
      layoutOk = true;
      if (height > maxHeight || maxNbCols * totalWidgetWidth > maxWidth) {
        notEnoughSpace = true;
        break;
      }

      cols = [];
      for (var i = 0; i < maxNbCols; ++i) {
        cols.push({widgets: [], height: legendOuterMargin * 2});
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
          cols[i].widgets[j].x = totalWidgetWidth * i + (this.placement === 'right' ? (maxWidth - cols.length * totalWidgetWidth) : legendInnerMargin);
          cols[i].widgets[j].y = h + (this.placement === 'bottom' ? (maxHeight - height - legendInnerMargin) : legendInnerMargin);
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

  LegendPlugin.prototype.clear = function () {
    var context = this.canvas.getContext('2d');

    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  };

  LegendPlugin.prototype.draw = function () {
    this.clear();
    if (this.active && this.enoughSpace) {
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

  LegendPlugin.prototype.addWidget = function (elementType, visualVar, unit) {
    var self = this,
        widget = this.widgets[elementType + '_' + visualVar];

    if (!widget) {
      widget = new LegendWidget(this.canvas, this.sigmaInstance, this.designPlugin, this, elementType, visualVar);
      widget.id = elementType + '_' + visualVar;
      this.widgets[elementType + '_' + visualVar] = widget;
    }
    if (visualVar === 'size' && unit !== undefined) {
      widget.unit = unit;
    }

    widget.build();

    return widget;
  };

  LegendPlugin.prototype.mustDisplayWidget = function (widget) {
    return this.active && (this.enoughSpace || widget.pinned) && this.widgets[widget.id] !== undefined;
  };

  LegendPlugin.prototype.addTextWidget = function (text) {
    var widget = new LegendWidget(this.canvas, this.sigmaInstance, this.designPlugin, this, null, 'text');

    widget.text = text;
    widget.id = 'text' + this.textWidgetCounter++;
    widget.build();

    this.widgets[widget.id] = widget;

    return widget;
  };

  LegendPlugin.prototype.removeWidget = function (widget) {
    if (this.widgets[widget.id]) {
      this.widgets[widget.id] = undefined;
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

  LegendWidget.prototype.unpin = function () {
    this.pinned = false;
    this.legendPlugin.drawLayout();
  };

  LegendWidget.prototype.build = function () {
    var self = this;

    if (this.visualVar === 'size') {
      this.svg = drawSizeLegend(this.sigmaInstance.graph, this.designPlugin, this.elementType, this.unit)
    } else if (this.visualVar !== 'text') {
      this.svg = drawNonSizeLegend(this.designPlugin, this.elementType, this.visualVar);
    } else {

      var lines = getLines(this.text, legendWidth - 2 * legendInnerMargin),
          lineHeight = legendFontSize + 2,
          height = lines.length * lineHeight + legendInnerMargin * 2,
          offsetY = legendInnerMargin;

      this.svg = document.createElement('svg');
      draw(this.svg, 'rect', {x:legendBorderWidth, y:legendBorderWidth, width:legendWidth, height:height, stroke:legendBorderColor, 'stroke-width':legendBorderWidth, fill:legendBackgroundColor, rx:10, ry:10});

      for (var i = 0; i < lines.length; ++i) {
        drawText(this.svg, lines[i], legendInnerMargin, offsetY, null, null, null, null, 'text-before-edge');
        offsetY += lineHeight;
      }

      this.svg.width = totalWidgetWidth;
      this.svg.height = height + 2 * legendOuterMargin;
    }

    this.img = buildImageFromSvg(this.svg, this.fontURLs, function () {
      if (self.legendPlugin.mustDisplayWidget(self)) {
        self.legendPlugin.drawLayout();
      }
    });
  };

  function getLines(text, maxWidth) {
    var spaceWidth = getTextWidth(' ', legendFontFamily, legendFontSize, true),
        words = text.split(' '),
        lines = [{width:-spaceWidth, words:[]}],
        lineIndex = 0,
        lineList = [];

    for (var i = 0; i < words.length; ++i) {
      var width = getTextWidth(words[i] + ' ', legendFontFamily, legendFontSize, true);
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

  function getTextWidth(text, fontFamily, fontSize, approximate) {
    if (approximate) {
      return 0.45 * fontSize * text.length;
    } else {

    }
  }

  LegendWidget.prototype.draw = function () {
    this.canvas.getContext('2d').drawImage(this.img, this.x, this.y);
  };

  LegendWidget.prototype.setPosition = function (x, y) {
    this.pinned = true;
    this.x = x;
    this.y = y;
    this.legendPlugin.drawLayout();
  };

  function drawSizeLegend(graph, designPluginInstance, elementType, unit) {
    var svg = document.createElement('svg'),
        elts = elementType === 'node' ? graph.nodes() : graph.edges(),
        styles = elementType === 'node' ? designPluginInstance.styles.nodes : designPluginInstance.styles.edges,
        titleMargin = legendTitleFontSize + legendInnerMargin * 2,
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

      draw(svg, 'rect', {x:legendBorderWidth, y:legendBorderWidth, width:legendWidth, height:height, stroke:legendBorderColor, 'stroke-width':legendBorderWidth, fill:legendBackgroundColor, rx:10, ry:10});

      drawWidgetTitle(svg, getPropertyName(styles.size.by), unit);
      drawText(svg, maxValue, legendWidth / 2, titleMargin + legendFontSize);
      drawText(svg, meanValue, legendWidth / 2, titleMargin + 2 * legendFontSize);
      drawText(svg, minValue, legendWidth / 2, titleMargin + 3 * legendFontSize);

      drawCircle(svg, bigElementSize + circleBorerWidth + legendInnerMargin, titleMargin + bigElementSize, bigElementSize, legendBackgroundColor, legendShapeColor, circleBorerWidth);
      drawCircle(svg, bigElementSize + circleBorerWidth + legendInnerMargin, titleMargin + bigElementSize * 2 - mediumElementSize, mediumElementSize, legendBackgroundColor, legendShapeColor, circleBorerWidth);
      drawCircle(svg, bigElementSize + circleBorerWidth + legendInnerMargin, titleMargin + bigElementSize * 2 - smallElementSize, smallElementSize, legendBackgroundColor, legendShapeColor, circleBorerWidth);

    } else if (elementType === 'edge') {
      var labelOffsetY = titleMargin + bigElementSize * 1.7,
          rectWidth = (legendWidth - legendInnerMargin * 2) / 3;

      height = labelOffsetY + legendFontSize;


      draw(svg, 'rect', {x:legendBorderWidth, y:legendBorderWidth, width:legendWidth, height:height, stroke:legendBorderColor, 'stroke-width':legendBorderWidth, fill:legendBackgroundColor, rx:10, ry:10});
      drawWidgetTitle(svg, getPropertyName(styles.size.by), unit);

      draw(svg, 'rect', {x:legendInnerMargin, y:titleMargin + 5, width:rectWidth, height:bigElementSize / 2, fill:legendShapeColor});
      draw(svg, 'rect', {x:legendInnerMargin + rectWidth, y:titleMargin + 5 + (bigElementSize - mediumElementSize) / 4, width:rectWidth, height:mediumElementSize / 2, fill:legendShapeColor});
      draw(svg, 'rect', {x:legendInnerMargin + 2 * rectWidth, y:titleMargin + 5 + (bigElementSize - smallElementSize) / 4, width:rectWidth, height:smallElementSize / 2, fill:legendShapeColor});

      drawText(svg, maxValue, legendInnerMargin + rectWidth * 0.5, labelOffsetY, 'middle');
      drawText(svg, meanValue, legendInnerMargin + rectWidth * 1.5, labelOffsetY, 'middle');
      drawText(svg, minValue, legendInnerMargin + rectWidth * 2.5, labelOffsetY, 'middle');
    }

    svg.width = totalWidgetWidth;
    svg.height = height + (legendBorderWidth + legendOuterMargin) * 2;

    return svg;
  }

  function drawNonSizeLegend(designPluginInstance, elementType, visualVar) {
    var svg = document.createElement('svg'),
        styles = elementType === 'node' ? designPluginInstance.styles.nodes : designPluginInstance.styles.edges,
        palette = designPluginInstance.palette,
        titleMargin = legendTitleFontSize + legendInnerMargin * 2.8,
        lineHeight = legendFontSize + 20,
        scheme = palette[styles[visualVar].scheme],
        height = lineHeight * Object.keys(scheme).length + titleMargin - 10,
        leftColumnWidth = legendWidth / 3,
        offsetY = titleMargin;

    draw(svg, 'rect', {x:legendBorderWidth, y:legendBorderWidth, width:legendWidth, height:height, stroke:legendBorderColor, 'stroke-width':legendBorderWidth, fill:legendBackgroundColor, rx:10, ry:10});
    drawWidgetTitle(svg, getPropertyName(styles[visualVar].by));

    iterate(scheme, function (value) {
      if (visualVar === 'color') {
        if (elementType === 'edge') {
          draw(svg, 'rect', {x:legendInnerMargin, y:offsetY - lineHeight / 8, width:leftColumnWidth - legendInnerMargin * 2, height:lineHeight / 4, fill:value});
        } else {
          drawCircle(svg, leftColumnWidth / 2, offsetY, legendFontSize / 2, value);
        }
      } else if (visualVar === 'icon') {
        drawText(svg, value.content, leftColumnWidth / 2, offsetY, 'middle', value.color, value.font, legendFontSize * value.scale);
      } else if (visualVar === 'type') {
        if (elementType === 'edge') {
          drawEdge(svg, value, legendInnerMargin, leftColumnWidth - legendInnerMargin, offsetY, legendFontSize / 3);
        } else {
          drawShape(svg, value, leftColumnWidth / 2, offsetY, legendFontSize / 2);
        }
      }
      offsetY += lineHeight;
    });

    offsetY = titleMargin;
    iterate(scheme, function (value, key) {
      drawText(svg, prettyfy(key), leftColumnWidth, offsetY, 'left', null, null, null, 'middle');
      offsetY += lineHeight;
    });

    svg.width = totalWidgetWidth;
    svg.height = height + (legendBorderWidth + legendOuterMargin) * 2;

    return svg;
  }

  function drawText(svg, content, x, y, textAlign, color, fontFamily, fontSize, verticalAlign) {
    createAndAppend(svg, 'text', {
      x: x,
      y: y,
      'text-anchor': textAlign ? textAlign : 'left',
      fill: color ? color : legendFontColor,
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

  function drawEdge(svg, type, x1, x2, y, size) {
    var triangleSize = size * 2.5,
        curveHeight = size * 3,
        offsetX = Math.sqrt(3) / 2 * triangleSize;

    if (type === 'arrow') {
      drawLine(svg, x1, y, x2 - offsetX + 1, y, legendShapeColor, size);
      drawPolygon(svg, [x2, y, x2 - offsetX, y - triangleSize / 2, x2 - offsetX, y + triangleSize / 2]);
    } else if (type === 'parallel') {
      size *= 0.8;
      drawLine(svg, x1, y - size, x2, y - size, legendShapeColor, size);
      drawLine(svg, x1, y + size, x2, y + size, legendShapeColor, size);
    } else if (type === 'curve') {
      drawCurve(svg, x1, y, (x1 + x2) / 2, y - curveHeight, x2, y, legendShapeColor, size);
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

      drawCurve(svg, x1, y, (x1 + x2) / 2, y - curveHeight, x2 - triangleSize / 2, y - size, legendShapeColor, size);
      drawPolygon(svg, [x2, y, x2 - offsetX, y - triangleSize / 2, x2 - offsetX, y + triangleSize / 2], {angle:angle, cx:x2, cy:y});
    } else if (type === 'dashed') {
      var dashArray = '8 3';  // Same values as in sigma.renderers.linkurious/canvas/sigma.canvas.edges.dashed
      drawLine(svg, x1, y, x2, y, legendShapeColor, size, dashArray);
    } else if (type === 'dotted') {
      var dotDashArray = '2'; // Same values as in sigma.renderers.linkurious/canvas/sigma.canvas.edges.dotted
      drawLine(svg, x1, y, x2, y, legendShapeColor, size, dotDashArray);
    } else if (type === 'tapered') {
      drawPolygon(svg, [x1, y + size, x1, y - size, x2, y]);
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

  function drawShape(svg, shape, x, y, size) {
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
      drawPolygon(svg, points);
    } else {
      size *= 1.2;
      var lineWidth = 2; // Arbitrary
      drawLine(svg, x - size, y, x + size, y, legendShapeColor, lineWidth);
      drawLine(svg, x, y - size, x, y + size, legendShapeColor, lineWidth);
    }
  }

  function drawPolygon(svg, points, rotation) {
    var attrPoints = points[0] + ',' + points[1];
    for (var i = 2; i < points.length; i += 2) {
      attrPoints += ' ' + points[i] + ',' + points[i+1];
    }

    var attributes = {points:attrPoints, fill:legendShapeColor};
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

  function drawWidgetTitle(svg, title, unit) {
    drawText(svg, title + (unit ? ' (' + unit + ')' : ''), legendWidth / 2, legendFontSize + legendInnerMargin, 'middle', legendTitleFontColor, legendTitleFontFamily, legendTitleFontSize);
  }

  function prettyfy(txt) {
    return txt.charAt(0).toUpperCase() + txt.slice(1).replace('_', ' ');
  }

}).call(this);