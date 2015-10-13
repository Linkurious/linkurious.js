/*
  API:
  * setText (widget)
  * addWidget(elementType, visualVar)
  * removeWidget(widget)/(elementType, visualVar, ?unit)
  * addTextWidget(text)
  * buildWidgets (legend)
  * setPosition(x, y) (widget)
  * setPlacement(top|bottom|right|left)
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

  var legendWidth = 200,
      legendFontSize = 15,
      legendFontFamily = 'Arial',
      legendColor = 'black',
      legendTitleFontFamily = 'Arial',
      legendTitleFontSize = 25,
      legendTitleFontColor = 'black',
      legendBackgroundColor = 'white',
      legendBorderColor =  'black',
      legendBorderWidth = 2,
      legendInnerMargin = 15,
      legendOuterMargin = 5,
      totalWidgetWidth = legendWidth + (legendBorderWidth + legendOuterMargin) * 2;

  sigma.plugins.legend = function (s) {
    if (!s.legendPlusinInstance) {
      s.legendPlusinInstance = new LegendPlugin(s);
    }

    return s.legendPlusinInstance;
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
    renderer.container.appendChild(this.canvas);

    window.addEventListener('resize', function () {
      self.canvas.width = renderer.container.offsetWidth;
      self.canvas.height = renderer.container.offsetHeight;
      self.build();
      self.setupLayout();
    });

    var d = this.designPlugin;

    this.widgets = {
      'node_size': new LegendWidget(this.canvas, s, d, 'quantitative', 'node'),
      'edge_size': new LegendWidget(this.canvas, s, d, 'quantitative', 'edge'),
      'node_color': new LegendWidget(this.canvas, s, d, 'qualitative', 'node', 'color'),
      'edge_color': new LegendWidget(this.canvas, s, d, 'qualitative', 'edge', 'color'),
      'node_icon': new LegendWidget(this.canvas, s, d, 'qualitative', 'node', 'icon')
    };
  }

  LegendPlugin.prototype.init = function (fontURLs) {
    this.fontURLs = fontURLs;
  };

  LegendPlugin.prototype.getWidget = function (widget_id) {
    return this.widgets[widget_id];
  };

  LegendPlugin.prototype.build = function () {
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
    this.setupLayout();
  };

  LegendPlugin.prototype.setupLayout = function () {
    var horizontal = this.placement === 'top' || this.placement === 'bottom',
        maxHeight = this.canvas.height,
        maxWidth = this.canvas.width,
        ordered = getOrderedWidgets(this.widgets),
        cols,
        height = horizontal ? ordered[0].svg.height : maxHeight,
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
        cols.push({widgets: [], height: 0});
      }

      for (var i = 0; i < ordered.length; ++i) {
        var colFound = false;
        for (var j = 0; j < cols.length; ++j) {
          if (ordered[i].svg.height + cols[j].height <= height) {
            cols[j].widgets.push(ordered[i]);
            cols[j].height += ordered[i].svg.height;
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

  function getOrderedWidgets(widgets) {
    var ordered = [];
    iterate(widgets, function (value) {
      if (value.active) {
        ordered.push(value);
      }
    });

    ordered.sort(function (w1, w2) {
      return w1.svg.height > w2.svg.height ? -1 : 1;
    });

    return ordered;
  }

  LegendPlugin.prototype.clear = function () {
    var context = this.canvas.getContext('2d');

    context.fillStyle = 'white';
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  };

  LegendPlugin.prototype.draw = function () {
    this.clear();
    if (this.active && this.enoughSpace) {
      iterate(this.widgets, function (value) {
        value.draw();
      });
    }
  };

  LegendPlugin.prototype.addTextWidget = function (text) {
    var widget = new LegendWidget(this.canvas, this.sigmaInstance, this.designPlugin, 'text');

    widget.text = text;
    widget.id = 'text' + this.textWidgetCounter++;
    widget.build();

    this.widgets[widget.id] = widget;

    return widget;
  };

  LegendPlugin.prototype.removeWidget = function (widget) {
    if (this.widgets[widget.id]) {
      this.widgets[widget.id] = undefined;
    }
  };

  LegendPlugin.prototype.toggleVisibility = function () {
    this.active = !this.active;
  };

  function LegendWidget(canvas, sigmaInstance, designPlugin, legendType, elementType, visualVar) {
    this.canvas = canvas;
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

  LegendWidget.prototype.build = function (displayWhenBuilt) {
    var self = this;

    if (this.legendType === 'quantitative') {
      this.svg = drawSizeLegend(this.sigmaInstance.graph, this.designPlugin, this.elementType, null)
    } else if (this.legendType === 'qualitative') {
      this.svg = drawNonSizeLegend(this.designPlugin, this.elementType, this.visualVar);
    } else {
      this.svg = document.createElement('svg');
      drawText(this.svg, this.text, 0, 0, null, null, null, null, 'text-before-edge');
      this.svg.width = totalWidgetWidth;
      this.svg.height = 300;
    }

    this.img = buildImageFromSvg(this.svg, this.fontURLs, function () {
      if (displayWhenBuilt() && self.active) {
        self.draw();
      }
    });
  };

  LegendWidget.prototype.draw = function () {
    if (this.active) {
      this.canvas.getContext('2d').drawImage(this.img, this.x, this.y);
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

      drawCircle(svg, bigElementSize + circleBorerWidth + legendInnerMargin, titleMargin + bigElementSize, bigElementSize, 'white', 'black', circleBorerWidth);
      drawCircle(svg, bigElementSize + circleBorerWidth + legendInnerMargin, titleMargin + bigElementSize * 2 - mediumElementSize, mediumElementSize, 'white', 'black', circleBorerWidth);
      drawCircle(svg, bigElementSize + circleBorerWidth + legendInnerMargin, titleMargin + bigElementSize * 2 - smallElementSize, smallElementSize, 'white', 'black', circleBorerWidth);

    } else if (elementType === 'edge') {
      var labelOffsetY = titleMargin + bigElementSize * 1.7,
          rectWidth = (legendWidth - legendInnerMargin * 2) / 3;

      height = labelOffsetY + legendFontSize;


      draw(svg, 'rect', {x:legendBorderWidth, y:legendBorderWidth, width:legendWidth, height:height, stroke:legendBorderColor, 'stroke-width':legendBorderWidth, fill:legendBackgroundColor, rx:10, ry:10});
      drawWidgetTitle(svg, getPropertyName(styles.size.by), unit);

      draw(svg, 'rect', {x:legendInnerMargin, y:titleMargin + 5, width:rectWidth, height:bigElementSize / 2, fill:'black'});
      draw(svg, 'rect', {x:legendInnerMargin + rectWidth, y:titleMargin + 5 + (bigElementSize - mediumElementSize) / 4, width:rectWidth, height:mediumElementSize / 2, fill:'black'});
      draw(svg, 'rect', {x:legendInnerMargin + 2 * rectWidth, y:titleMargin + 5 + (bigElementSize - smallElementSize) / 4, width:rectWidth, height:smallElementSize / 2, fill:'black'});

      drawText(svg, maxValue, legendInnerMargin + rectWidth * 0.5, labelOffsetY, 'middle');
      drawText(svg, meanValue, legendInnerMargin + rectWidth * 1.5, labelOffsetY, 'middle');
      drawText(svg, minValue, legendInnerMargin + rectWidth * 2.5, labelOffsetY, 'middle');
    }

    svg.width = totalWidgetWidth;
    svg.height = height + (legendBorderWidth + legendOuterMargin) * 2;

    return svg;
  }

  function drawNonSizeLegend(designPluginInstance, elementType, legendType) {
    var svg = document.createElement('svg'),
        styles = elementType === 'node' ? designPluginInstance.styles.nodes : designPluginInstance.styles.edges,
        palette = designPluginInstance.palette,
        titleMargin = legendTitleFontSize + legendInnerMargin * 2.5,
        lineHeight = legendFontSize + 20,
        scheme = palette[styles[legendType].scheme],
        height = lineHeight * Object.keys(scheme).length + titleMargin - 10,
        leftColumnWidth = legendWidth / 3,
        offsetY = titleMargin;

    draw(svg, 'rect', {x:legendBorderWidth, y:legendBorderWidth, width:legendWidth, height:height, stroke:legendBorderColor, 'stroke-width':legendBorderWidth, fill:legendBackgroundColor, rx:10, ry:10});
    drawWidgetTitle(svg, getPropertyName(styles[legendType].by));

    iterate(scheme, function (value, key) {
      if (legendType === 'color') {
        if (elementType === 'edge') {
          draw(svg, 'rect', {x:legendInnerMargin, y:offsetY - lineHeight / 8, width:leftColumnWidth - legendInnerMargin * 2, height:lineHeight / 4, fill:value});
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

    svg.width = totalWidgetWidth;
    svg.height = height + (legendBorderWidth + legendOuterMargin) * 2;

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
    drawText(svg, title + (unit ? ' (' + unit + ')' : ''), legendWidth / 2, legendFontSize + legendInnerMargin, 'middle', legendTitleFontColor, legendTitleFontFamily, legendTitleFontSize);
  }

  function prettyfy(txt) {
    return txt.charAt(0).toUpperCase() + txt.slice(1).replace('_', ' ');
  }

}).call(this);