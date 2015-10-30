;(function(undefined) {
  'use strict';

  if (typeof sigma === 'undefined')
    throw 'sigma is not declared';

  // Initialize package:
  sigma.utils.pkg('sigma.plugins');

  /* ======================== */
  /* ===== MAIN CLASSES ===== */
  /* ======================== */

  function LegendPlugin(s) {
    var self = this,
      settings = s.settings,
      pixelRatio = window.devicePixelRatio || 1;

    this._sigmaInstance = s;
    this._designPlugin = sigma.plugins.design(s);

    this._visualSettings = {
      pixelRatio: pixelRatio,
      legendWidth: settings('legendWidth'),
      legendFontFamily: settings('legendFontFamily'),
      legendFontSize: settings('legendFontSize'),
      legendFontColor: settings('legendFontColor'),
      legendTitleFontFamily: settings('legendTitleFontFamily'),
      legendTitleFontSize: settings('legendTitleFontSize'),
      legendTitleFontColor: settings('legendTitleFontColor'),
      legendShapeColor: settings('legendShapeColor'),
      legendBackgroundColor: settings('legendBackgroundColor'),
      legendBorderColor: settings('legendBorderColor'),
      legendBorderWidth: settings('legendBorderWidth'),
      legendInnerMargin: settings('legendInnerMargin'),
      legendOuterMargin: settings('legendOuterMargin'),
      legendTitleMaxLength: settings('legendTitleMaxLength'),
      legendTitleTextAlign: settings('legendTitleTextAlign'),
      legendBorderRadius: settings('legendBorderRadius')
    };

    iterate(this._visualSettings, function (value, key) {
      if (typeof value === 'number') {
        self._visualSettings[key] = value * pixelRatio;
      }
    });

    computeTotalWidth(this._visualSettings);

    var renderer = s.renderers[0]; // TODO: handle several renderers?
    this._canvas = document.createElement('canvas');
    //renderer.initDOM('canvas', 'legend');
    //this._canvas = renderer.domElements['legend'];
    this._canvas.style.position = 'absolute';
    this._canvas.style.pointerEvents = 'none';
    setupCanvas(this._canvas, renderer.container.offsetWidth, renderer.container.offsetHeight, pixelRatio);
    renderer.container.appendChild(this._canvas);

    window.addEventListener('resize', function () {
      setupCanvas(self._canvas, renderer.container.offsetWidth, renderer.container.offsetHeight, pixelRatio);
      drawLayout(self);
    });

    this.textWidgetCounter = 1;
    this.enoughSpace = true;
    this.placement = 'bottom';
    this.visible = true;
    this.widgets = { };
    this.boundingBox = {x:0, y:0, w:0, h:0};
    this.externalCSS = [];

    this.addWidget('node', 'size');
    this.addWidget('node', 'color');
    this.addWidget('node', 'icon');
    this.addWidget('node', 'type');
    this.addWidget('edge', 'size');
    this.addWidget('edge', 'color');
    this.addWidget('edge', 'type');

    this.draw();
  }


  function LegendWidget(canvas, sigmaInstance, designPlugin, legendPlugin, elementType, visualVar) {
    this._canvas = canvas;
    this._sigmaInstance = sigmaInstance;
    this._designPlugin = designPlugin;
    this._legendPlugin = legendPlugin;
    this.visualVar = visualVar;
    this.elementType = elementType;
    this.x = 0;
    this.y = 0;
    this.text = '';
    this.unit = null;
    this.img = new Image();
    this.pinned = false;
  }

  /* ============================= */
  /* ===== UTILITY FUNCTIONS ===== */
  /* ============================= */

  function setupCanvas(canvas, width, height, pixelRatio) {
    canvas.setAttribute('width', (width * pixelRatio));
    canvas.setAttribute('height', (height * pixelRatio));
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
  }

  /**
   * Example: with obj = a and str = 'qw.er.ty', returns a.qw.er.ty
   * @param {Object} obj
   * @param {string} str
   * @returns {Object}
   */
  function strToObjectRef(obj, str) {
    if (str == null) return null;
    return str.split('.').reduce(function(obj, i) { return obj[i] }, obj);
  }

  function dataURLToBlob(dataURL) {
    var BASE64_MARKER = ';base64,';
    if (dataURL.indexOf(BASE64_MARKER) == -1) {
      var parts = dataURL.split(',');
      var contentType = parts[0].split(':')[1];
      var raw = decodeURIComponent(parts[1]);

      return new Blob([raw], {type: contentType});
    }

    var parts = dataURL.split(BASE64_MARKER);
    var contentType = parts[0].split(':')[1];
    var raw = window.atob(parts[1]);
    var rawLength = raw.length;

    var uInt8Array = new Uint8Array(rawLength);

    for (var i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], {type: contentType});
  }

  function download(fileEntry, filename, isDataUrl) {
    var blob = null,
        objectUrl = null,
        dataUrl = null;

    if (window.Blob){
      // use Blob if available
      blob = isDataUrl ? dataURLToBlob(fileEntry) : new Blob([fileEntry], {type: 'text/xml'});
      objectUrl = window.URL.createObjectURL(blob);
    }
    else {
      // else use dataURI
      dataUrl = 'data:text/xml;charset=UTF-8,' +
        encodeURIComponent('<?xml version="1.0" encoding="UTF-8"?>') +
        encodeURIComponent(fileEntry);
    }

    if (navigator.msSaveBlob) { // IE11+ : (has Blob, but not a[download])
      navigator.msSaveBlob(blob, filename);
    } else if (navigator.msSaveOrOpenBlob) { // IE10+ : (has Blob, but not a[download])
      navigator.msSaveOrOpenBlob(blob, filename);
    } else {
      // A-download
      var anchor = document.createElement('a');
      anchor.setAttribute('href', (window.Blob) ? objectUrl : dataUrl);
      anchor.setAttribute('download', filename);

      // Firefox requires the link to be added to the DOM before it can be clicked.
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }

    if (objectUrl) {
      setTimeout(function() { // Firefox needs a timeout
        window.URL.revokeObjectURL(objectUrl);
      }, 0);
    }
  }

  /**
   * Iterate over an array or object and call a specified function on each value
   * @param obj {Array|Object}
   * @param func {function}   function (value, key) { ... }
   */
  function iterate(obj, func) {
    for (var k in obj) {
      if (!obj.hasOwnProperty(k) || obj[k] === undefined) {
        continue;
      }

      func(obj[k], k);
    }
  }

  /**
   * Create a DOM element and append it to another element.
   * @param parentElement   {DOMElement} Parent element
   * @param typeToCreate    {string}  Type of the element to create
   * @param attributes      {object}  Attributes of the element to create
   * @param [elementValue]  {*}       Value to put inside the element
   * @param [force]         {boolean} If true, put 'elementValue' inside the element even if it's null or undefiened
   * @returns {Element}     {DOMElement} Appended object
   */
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
   * Convert a widget's SVG to a base64 encoded image url, so it can be drawn onto a canvas.
   *
   * @param {Object}    widget        Widget
   * @param {function}  callback      Function that will be called once the image is built
   */
  function buildImageFromSvg(widget, callback) {
    if (!widget.svg) {
      callback();
      return;
    }

    var str = '';

    str += '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="' + widget.svg.width + 'px" height="' + widget.svg.height + 'px">';

    str += widget.svg.innerHTML + '</svg>';
    var src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(str)));

    if (widget.img.src !== src) {
      widget.img.onload = callback;
      widget.img.src = src;
    } else {
      callback();
    }
  }

  /**
   * Returns the sum of a widget's width + its border + its outer margin
   * @param visualSettings
   */
  function computeTotalWidth(visualSettings) {
    visualSettings.totalWidgetWidth =
      visualSettings.legendWidth + (visualSettings.legendBorderWidth + visualSettings.legendOuterMargin) * 2
  }

  /**
   *  Reconstruct the legend's svg (i.e. recreate the image representation of each widget).
   *  @param {LegendPlugin} legendPlugin
   *  @param {function}     callback
   */
  function buildLegendWidgets(legendPlugin, callback) {
    var nbWidgetsBuilt = 0,
        nbWidgets = Object.keys(legendPlugin.widgets).length;

    iterate(legendPlugin.widgets, function (value) {
      buildWidget(value, function () {
        ++nbWidgetsBuilt;
        if (callback && nbWidgetsBuilt === nbWidgets) {
          callback();
        }
      });
    });
  }

  /**
   * Apply the layout algorithm to compute the position of every widget.
   * Does not build widgets.
   * Draw the legend at the end.
   */
  function drawLayout(legendPlugin) {
    var vs = legendPlugin._visualSettings,
        placement = legendPlugin.placement,
        horizontal = placement === 'top' || placement === 'bottom',
        maxHeight = legendPlugin._canvas.height,
        maxWidth = legendPlugin._canvas.width,
        textWidgets = getUnpinnedWidgets(legendPlugin.widgets, 'text'),
        nodeWidgets = getUnpinnedWidgets(legendPlugin.widgets, 'node'),
        edgeWidgets = getUnpinnedWidgets(legendPlugin.widgets, 'edge'),
        widgetLists = [textWidgets, nodeWidgets, edgeWidgets],
        height = horizontal ? getMaxHeight(legendPlugin.widgets) + vs.legendOuterMargin * 2 : maxHeight,
        maxNbCols = Math.floor(maxWidth / vs.totalWidgetWidth),
        cols = initializeColumns(horizontal ? maxNbCols : 1, vs.legendOuterMargin * 2),
        colIndex = 0,
        tryAgain = true,
        notEnoughSpace = false;

    while (tryAgain && !notEnoughSpace) {
      tryAgain = false;
      colIndex = 0;
      iterate(widgetLists, function (list) {
        var widgetsToDisplay = [],
            desiredHeight,
            bestCombination;

        if (tryAgain || notEnoughSpace) {
          return;
        }

        list.forEach(function (w) {
          widgetsToDisplay.push(w);
        });

        while (true) {
          desiredHeight = height - (cols[colIndex] ? cols[colIndex].height : 0);
          bestCombination = getOptimalWidgetCombination(widgetsToDisplay, desiredHeight);
          bestCombination.forEach(function (index) {
            cols[colIndex].widgets.push(widgetsToDisplay[index]);
            cols[colIndex].height += widgetsToDisplay[index].svg.height;
          });
          for (var i = bestCombination.length - 1; i >= 0; --i) {
            widgetsToDisplay.splice(bestCombination[i], 1);
          }

          if (widgetsToDisplay.length > 0) {
            if (horizontal) {
             if (colIndex === maxNbCols - 1) {
               cols = initializeColumns(maxNbCols, vs.legendOuterMargin * 2);
               height += 30;
               tryAgain = true;
               if (height > maxHeight) {
                 notEnoughSpace = true;
               }
               break;
             } else {
                ++colIndex;
             }
            } else if (cols.length === maxNbCols) {
              notEnoughSpace = true;
              break;
            } else {
              cols.push({widgets: [], height: vs.legendOuterMargin * 2});
              ++colIndex;
            }
          } else {
            break;
          }
        }
      });
    }

    if (!notEnoughSpace) {
      if (placement === 'right') {
        cols.reverse();
      }

      for (var i = 0; i < cols.length; ++i) {
        var h = placement === 'bottom' ? height - cols[i].height : 0;
        for (var j = 0; j < cols[i].widgets.length; ++j) {
          cols[i].widgets[j].x = vs.totalWidgetWidth * i +
            (placement === 'right' ? (maxWidth - cols.length * vs.totalWidgetWidth) : vs.legendOuterMargin);

          if (placement === 'bottom') {
            cols[i].widgets[j].y = maxHeight - height + h + vs.legendOuterMargin * 2;
          } else {
            cols[i].widgets[j].y = h + vs.legendOuterMargin;
          }
          h += cols[i].widgets[j].svg.height;
        }
      }

      var nbCols = cols.reduce(function (prev, value) { return prev + (value.height > vs.legendOuterMargin * 2 ? 1 : 0); }, 0),
          legendWidth = nbCols * (vs.totalWidgetWidth + vs.legendOuterMargin) + vs.legendOuterMargin,
          legendHeight = cols.reduce(function (previous, value) { return ( previous > value.height ? previous : value.height ); }, 0);

      legendPlugin.boundingBox = {
        w: legendWidth,
        h: legendHeight,
        x: legendPlugin.placement === 'right' ? maxWidth - legendWidth : 0,
        y: legendPlugin.placement === 'bottom' ? maxHeight - legendHeight : 0
      };
    } else {
      legendPlugin.boundingBox = {x:0, y:0, w:0, h:0};
    }

    drawLegend(legendPlugin);
    legendPlugin.enoughSpace = !notEnoughSpace;
  }

  function initializeColumns(number, initialHeight) {
    var columns = [];
    for (var i = 0; i < number; ++i) {
      columns.push({widgets:[], height:initialHeight});
    }

    return columns;
  }

  /**
   * Returns the list of widgets of which the total height is maximal but smaller than a specified limit
   * @param widgets       {Array<LegendWidget>} Initial list of widgets
   * @param desiredHeight {number}              Maximum desired height
   * @returns {Array<Number>}                   List of indexes
   */
  function getOptimalWidgetCombination(widgets, desiredHeight) {
    var best = {indexes: [], height: 0},
        combinations = getCombinations(widgets.length, 0);

    combinations.forEach(function (c) {
      var height = computeCombinedWidgetsHeight(widgets, c);
      if (height > best.height && height <= desiredHeight) {
        best.indexes = c;
        best.height = height;
      }
    });

    return best.indexes;
  }

  /**
   * Returns the list of combinations that are possible given a length and index.
   * Warning: complexity O(2^n) (should not be a problem since we usually won't have high values)
   * Example: getCombinations(3, 0) -> [ [0], [1], [2], [0, 1], [0, 2], [1, 2], [0, 1, 2] ]
   *          getCombinations(3, 1) -> [ [1], [2], [1, 2] ]
   * @param length        {number}
   * @param startingIndex {number}
   * @returns {Array<number>}
   */
  function getCombinations(length, startingIndex) {
    if (startingIndex === length) {
      return [];
    } else {
      var combinations = [[startingIndex]],
          nextCombinations = getCombinations(length, startingIndex + 1);

      nextCombinations.forEach(function (c) {
        combinations.push([startingIndex].concat(c));
      });

      combinations = combinations.concat(nextCombinations);

      return combinations;
    }
  }

  /**
   * Returns the total height of widgets with their index contained in the specified array
   * @param {Array<LegendWidget>} widgets
   * @param {Array<number>}       indexes
   * @returns {number}
   */
  function computeCombinedWidgetsHeight(widgets, indexes) {
    var totalHeight = 0;
    indexes.forEach(function (index) {
      totalHeight += widgets[index].svg.height;
    });

    return totalHeight;
  }

  /**
   * Returns every widget that is not pinned (the widgets that are taken care of by the layout algorithm)
   * @param widgets
   * @param elementType
   * @returns {Array}
   */
  function getUnpinnedWidgets(widgets, elementType) {
    var unpinned = [];

    iterate(widgets, function (value) {
      if (value.svg && !value.pinned && value.elementType === elementType) {
        unpinned.push(value);
      }
    });

    return unpinned;
  }

  /**
   * Returns the height of the largest widget.
   * @param widgets {Array<LegendWidget>}
   * @returns {number}
   */
  function getMaxHeight(widgets) {
    var maxWidgetHeight = 0;
    iterate(widgets, function (widget) {
      if (widget.svg && widget.svg.height > maxWidgetHeight) {
        maxWidgetHeight = widget.svg.height;
      }
    });

    return maxWidgetHeight;
  }

  function makeWidgetId(elementType, visualVar) {
    return elementType + '_' + visualVar;
  }

  /**
   * Clear the canvas on which the legend is displayed.
   */
  function clearLegend(legendPlugin) {
    var context = legendPlugin._canvas.getContext('2d');
    context.clearRect(0, 0, legendPlugin._canvas.width, legendPlugin._canvas.height);
  }

  /**
   * Draw each widget (unpinned before pinned, we want the user-positioned
   * widget to be displayed on top those positioned with the layout algorithm.
   */
  function drawLegend(legendPlugin) {
    clearLegend(legendPlugin);
    iterate(legendPlugin.widgets, function (widget) {
      if (mustDisplayWidget(legendPlugin, widget)) {
        drawWidget(widget);
      }
    });
  }


  /**
   * Indicates if a widget must be displayed (typically used when a widget's image has just been loaded to
   * know if it must be displayed immediatly).
   * @param legendPlugin
   * @param widget
   * @returns {boolean}
   */
  function mustDisplayWidget(legendPlugin, widget) {
    return legendPlugin.visible && (legendPlugin.enoughSpace || widget.pinned) && legendPlugin.widgets[widget.id] !== undefined && widget.svg !== null;
  }

  /**
   * Create a widget's svg.
   */
  function buildWidget(widget, callback) {
    var vs = widget._legendPlugin._visualSettings;

    if (widget.visualVar === 'size') {
      widget.svg = drawSizeLegend(vs, widget._sigmaInstance.graph, widget._designPlugin, widget.elementType, widget.unit)
    } else if (widget.elementType !== 'text') {
      widget.svg = drawNonSizeLegend(vs, widget._sigmaInstance.graph, widget._designPlugin, widget.elementType, widget.visualVar, widget.unit);
    } else {
      var lines = getLines(vs, widget.text, vs.legendWidth - 2 * vs.legendInnerMargin),
          lineHeight = vs.legendFontSize + 1,
          height = lines.length * lineHeight + vs.legendInnerMargin * 2,
          offsetY = vs.legendInnerMargin + lineHeight;

      widget.svg = document.createElement('svg');
      drawBackground(widget.svg, vs, height);

      for (var i = 0; i < lines.length; ++i) {
        drawText(vs, widget.svg, lines[i], vs.legendInnerMargin, offsetY);
        offsetY += lineHeight;
      }

      widget.svg.width = vs.totalWidgetWidth;
      widget.svg.height = height + 2 * (vs.legendBorderWidth + vs.legendOuterMargin);
    }

     buildImageFromSvg(widget, callback);
  }

  /**
   * Build a widget a redraw the layout
   * @param widget
   */
  function buildWidgetAndDrawLayout(widget) {
    buildWidget(widget, function () { drawLayout(widget._legendPlugin); });
  }

  /**
   * Split a string into multiple lines. Each line's length (in pixels) won't be larger than 'maxWidth'.
   * Words are not splited into several lines.
   * @param vs {Object}       Visual settings
   * @param text {string}     String to split.
   * @param maxWidth {number} Maximum length (in pixels) of a string.
   * @returns {Array<string>}
   */
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
        lines.push({width:width - spaceWidth, words:[words[i] + ' ']});
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

  function getPropertyName(prop) {
    var s = prop.split('.');
    if ((s.length > 2 && s[s.length - 2] === 'categories') || (s.length >= 1 && s[1] === 'categories')) {
      return 'Category';
    } else {
      return prettyfy(s[s.length - 1]);
    }
  }

  /**
   * Draw a widget on the canvas.
   */
  function drawWidget(widget) {
    if (!widget.img) {
      return;
    }

    var ctx = widget._canvas.getContext('2d');

    ctx.drawImage(widget.img, widget.x, widget.y);
    if (widget.elementType === 'node' && widget.visualVar === 'icon') {
      ctx.textBaseline = 'middle';
      iterate(widget.svg.icons, function (value, content) {
        ctx.fillStyle = value.color;
        ctx.font = value.fontSize + 'px ' + value.font;
        ctx.fillText(content, widget.x + value.x, widget.y + value.y);
      });
    }
  }

  /**
   * Iterate over a list of elements and returns the minimum and maximum values for a specified property.
   * @param elements {Array<Object>}  List of nodes or edges
   * @param propertyName {string}     Name of the property.
   * @returns {{min: *, max: *}}
   */
  function getBoundaryValues(elements, propertyName) {
    var minValue = null,
        maxValue = null;

    for (var i = 1; i < elements.length; ++i) {
      var value = strToObjectRef(elements[i], propertyName);
      if (typeof value !== 'number') {
        continue;
      }

      if (!minValue || value < minValue) {
        minValue = value;
      }
      if (!maxValue || value > maxValue) {
        maxValue = value;
      }
    }

    return {min: minValue ? minValue : 0, max: maxValue ? maxValue : 0};
  }

  /**
   * Returns 'number' + 1 values between a specified minimum and maximum. These values are linear.
   * Example: extractValueList({min:1, max:5}, 4) -> [1, 2, 3, 4, 5]
   * @param boundaries {{min:{number}, max:{number}}}
   * @param number
   * @returns {Array}
   */
  function extractValueList(boundaries, number) {
    var list = [],
        dif = boundaries.max - boundaries.min;

    for (var i = 0; i < number + 1; ++i) {
      list.push(boundaries.min + dif * (i / number))
    }

    return list;
  }


  /**
   * Returns a map of the different values of a property.
   * @param elts      List of elements. Edges or nodes.
   * @param propName  Name of the property.
   * @returns {Object}
   */
  function getExistingPropertyValues(elts, propName) {
    var existingValues = {};
    for (var i = 0; i < elts.length; ++i) {
      var prop = strToObjectRef(elts[i], propName);
      if (prop && typeof prop === 'object') {
        iterate(prop, function (value) {
          existingValues[value] = true;
        });
      } else {
        existingValues[prop] = true;
      }
    }

    return existingValues;
  }

  /**
   * Returns the number of keys that exists in both a specified object and a scheme.
   * @param scheme
   * @param existingValues
   * @returns {number}
   */
  function getNbElements(scheme, existingValues) {
    var nb = 0;
    iterate(scheme, function (val, key) {
      if (existingValues[key]) {
        ++nb;
      }
    });

    return nb;
  }

  /* ============================= */
  /* ===== DRAWING FUNCTIONS ===== */
  /* ============================= */

  /**
   * Draw a widget representing a size (node size, edge size)
   *
   * @param visualSettings        {Object}
   * @param graph                 {Object}
   * @param designPluginInstance  {LegendPlugin}
   * @param elementType           {string}        'node' or 'edge'
   * @param unit                  {string}        Optional. Specifies a unit to display alongside the title
   * @returns {Element}
   */
  function drawSizeLegend(visualSettings, graph, designPluginInstance, elementType, unit) {
    var vs = visualSettings,
        svg = document.createElement('svg'),
        elts = elementType === 'node' ? graph.nodes() : graph.edges(),
        styles = elementType === 'node' ? designPluginInstance.styles.nodes : designPluginInstance.styles.edges,
        titleMargin = vs.legendTitleFontSize + vs.legendInnerMargin + vs.legendFontSize * 1.5;

    if (!styles.size) {
      return null;
    }

    var propName = styles.size.by,
        boundaries = getBoundaryValues(elts, propName),
        minValue = boundaries.min,
        maxValue = boundaries.max,
        isInteger = minValue % 1 === 0 && maxValue % 1 === 0,
        meanValue = isInteger ? Math.round((minValue + maxValue) / 2) : (minValue + maxValue) / 2,
        ratio = styles.size.max / styles.size.min,
        bigElementSize = vs.legendFontSize * 1.5,
        smallElementSize = bigElementSize / ratio,
        mediumElementSize = (bigElementSize + smallElementSize) / 2,
        height;

    if (elementType === 'node') {
      var circleBorderWidth = 2;

      height = titleMargin + bigElementSize * 2 + 10;

      drawBackground(svg, vs, height);
      drawWidgetTitle(vs, svg, getPropertyName(styles.size.by), unit);

      var textOffsetX = bigElementSize * 2 + circleBorderWidth + vs.legendInnerMargin * 2;
      drawText(vs, svg, numberToText(maxValue, isInteger), textOffsetX, titleMargin + vs.legendFontSize);
      drawText(vs, svg, numberToText(meanValue, isInteger), textOffsetX, titleMargin + 2 * vs.legendFontSize);
      drawText(vs, svg, numberToText(minValue, isInteger), textOffsetX, titleMargin + 3 * vs.legendFontSize);


      drawCircle(svg, bigElementSize + vs.legendInnerMargin, titleMargin + bigElementSize, bigElementSize,
                 vs.legendBackgroundColor, vs.legendShapeColor, circleBorderWidth);
      drawCircle(svg, bigElementSize + vs.legendInnerMargin, titleMargin + bigElementSize * 2 - mediumElementSize,
                 mediumElementSize, vs.legendBackgroundColor, vs.legendShapeColor, circleBorderWidth);
      drawCircle(svg, bigElementSize + vs.legendInnerMargin, titleMargin + bigElementSize * 2 - smallElementSize,
                 smallElementSize, vs.legendBackgroundColor, vs.legendShapeColor, circleBorderWidth);

    } else if (elementType === 'edge') {
      var labelOffsetY = titleMargin + bigElementSize * 1.7,
          rectWidth = (vs.legendWidth - vs.legendInnerMargin * 2) / 3;

      height = labelOffsetY + vs.legendFontSize;


      drawBackground(svg, vs, height);
      drawWidgetTitle(vs, svg, getPropertyName(styles.size.by), unit);

      draw(svg, 'rect', {x:vs.legendInnerMargin, y:titleMargin + 5, width:rectWidth, height:bigElementSize / 2,
                         fill:vs.legendShapeColor});
      draw(svg, 'rect', {x:vs.legendInnerMargin + rectWidth, y:titleMargin + 5 + (bigElementSize - mediumElementSize) / 4,
                         width:rectWidth, height:mediumElementSize / 2, fill:vs.legendShapeColor});
      draw(svg, 'rect', {x:vs.legendInnerMargin + 2 * rectWidth, y:titleMargin + 5 + (bigElementSize - smallElementSize) / 4,
                         width:rectWidth, height:smallElementSize / 2, fill:vs.legendShapeColor});

      drawText(vs, svg, numberToText(maxValue, isInteger), vs.legendInnerMargin + rectWidth * 0.5, labelOffsetY, 'middle');
      drawText(vs, svg, numberToText(meanValue, isInteger), vs.legendInnerMargin + rectWidth * 1.5, labelOffsetY, 'middle');
      drawText(vs, svg, numberToText(minValue, isInteger), vs.legendInnerMargin + rectWidth * 2.5, labelOffsetY, 'middle');
    }

    svg.width = vs.totalWidgetWidth;
    svg.height = height + (vs.legendBorderWidth + vs.legendOuterMargin) * 2;

    return svg;
  }

  /**
   * Draw a legend widget that doesn't represent a size (color, icon, etc)
   * @param visualSettings  {Object}
   * @param graph           {Object}
   * @param designPluginInstance {LegendPlugin}
   * @param elementType     {string} 'node' or 'edge'
   * @param visualVar       {string} 'color', 'icon', 'type'
   * @param unit            {string}  Optional. Unit to display alongside the title.
   *                                  in the way the icons are displayed).
   * @returns {Element}
   */
  function drawNonSizeLegend(visualSettings, graph, designPluginInstance, elementType, visualVar, unit) {
    var vs = visualSettings,
        svg = document.createElement('svg'),
        elts = elementType === 'node' ? graph.nodes() : graph.edges(),
        styles = elementType === 'node' ? designPluginInstance.styles.nodes : designPluginInstance.styles.edges;

    if (!styles[visualVar]) {
      return null;
    }

    var palette = designPluginInstance.palette,
        lineHeight = vs.legendFontSize * 1.5,
        titleMargin = vs.legendTitleFontSize + vs.legendInnerMargin + lineHeight * 0.8,
        quantitativeColor = visualVar === 'color' && styles.color.bins,
        edgeType = elementType === 'edge' && visualVar === 'type',
        scheme = quantitativeColor ? strToObjectRef(palette, styles.color.scheme)[styles.color.bins] : strToObjectRef(palette, styles[visualVar].scheme),
        existingValues = getExistingPropertyValues(elts, styles[visualVar].by),
        nbElements = quantitativeColor ?  Object.keys(scheme).length : getNbElements(scheme, existingValues),
        height = lineHeight * nbElements + titleMargin + (edgeType ? lineHeight : 0),
        leftColumnWidth = vs.legendWidth / 3,
        offsetY = titleMargin,
        textOffsetX = elementType === 'edge' ? leftColumnWidth : vs.legendFontSize * 1.5 + vs.legendInnerMargin,
        boundaries,
        valueList,
        isInteger,
        txt,
        fontSize;

    if (quantitativeColor) {
        boundaries = getBoundaryValues(elts, styles.color.by);
        valueList = extractValueList(boundaries, styles.color.bins);
        isInteger = boundaries.min % 1 == 0 && boundaries.max % 1 == 0;
    }

    svg.icons = {};

    drawBackground(svg, vs, height);
    drawWidgetTitle(vs, svg, getPropertyName(styles[visualVar].by), unit);

    /* Display additional information for the type of edge */
    if (elementType === 'edge' && visualVar === 'type') {
      txt =  'source node to target node';
      fontSize = shrinkFontSize(txt, vs.legendFontFamily, vs.legendFontSize, vs.legendWidth - vs.legendInnerMargin * 2);
      drawText(vs, svg, txt, vs.legendInnerMargin, offsetY, 'left', vs.legendFontColor, vs.legendFontFamily, fontSize);
      offsetY += lineHeight;
    }

    iterate(scheme, function (value, key) {
      if (!quantitativeColor && !existingValues[key]) {
        return;
      }

      if (visualVar === 'color') {
        if (quantitativeColor) {
          value = scheme[scheme.length - key - 1];
        }

        if (elementType === 'edge') {
          draw(svg, 'rect', {x:vs.legendInnerMargin, y:offsetY - lineHeight / 8,
                             width:leftColumnWidth - vs.legendInnerMargin * 2, height:lineHeight / 4, fill:value});
        } else {
          drawCircle(svg, vs.legendInnerMargin + vs.legendFontSize / 2, offsetY, vs.legendFontSize / 2, value);
        }
      } else if (visualVar === 'icon') {
        svg.icons[value.content] = {
          font: value.font,
          fontSize: vs.legendFontSize,
          //color: value.color,
          color: vs.legendFontColor,
          x: vs.legendInnerMargin,
          y: offsetY
        };
      } else if (visualVar === 'type') {
        if (elementType === 'edge') {
          drawEdge(vs, svg, value, vs.legendInnerMargin, leftColumnWidth - vs.legendInnerMargin, offsetY, vs.legendFontSize / 3);
        } else {
          drawShape(vs, svg, value, vs.legendInnerMargin + vs.legendFontSize / 2, offsetY, vs.legendFontSize / 2);
        }
      }

      var textYAdjustment = 2;
      if (quantitativeColor) {
        txt = numberToText(valueList[nbElements - key - 1], isInteger) + ' - ' + numberToText(valueList[nbElements - parseInt(key)], isInteger);
        drawText(vs, svg, txt, leftColumnWidth, offsetY + textYAdjustment, 'left', null, null, null, 'middle');
      } else {
        var shrinkedText = getShrinkedText(prettyfy(key), vs.legendWidth - vs.legendInnerMargin - textOffsetX,
          vs.legendFontFamily, vs.legendFontSize);

        drawText(vs, svg, shrinkedText, textOffsetX, offsetY + textYAdjustment, 'left', null, null, null, 'middle');
      }

      offsetY += lineHeight;
    });

    svg.width = vs.totalWidgetWidth;
    svg.height = height + (vs.legendBorderWidth + vs.legendOuterMargin) * 2;

    return svg;
  }

  /**
   * Remove every character of a string that are after a specified with limit. Add '...' at the end of the string if
   * at least one character is removed.
   * @param text       {string}
   * @param maxWidth   {number}
   * @param fontFamily {string}
   * @param fontSize   {number}
   * @returns {*}
   */
  function getShrinkedText(text, maxWidth, fontFamily, fontSize) {
    var textWidth = getTextWidth(text, fontFamily, fontSize, false),
        shrinked = false;

    while (textWidth > maxWidth) {
      shrinked = true;
      var ratio = maxWidth / textWidth,
          text = text.substr(0, text.length * ratio);
      textWidth = getTextWidth(text, fontFamily, fontSize, false);
    }

    if (shrinked) {
      text += '...';
    }

    return text;
  }

  /**
   * Not currently used, but may be useful in the future. The idea was to display an image in base64
   * inside a svg.
   * @param svg
   * @param base64Img
   * @param x
   * @param y
   */
  function drawImage(svg, base64Img, x, y) {
    var i = createAndAppend(svg, 'image',  {
      x:x,
      y:y,
      'xlink:href':base64Img
    });
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

  function drawBackground(svg, vs, height) {
    draw(svg, 'rect', {
      x:vs.legendBorderWidth,
      y:vs.legendBorderWidth,
      width:vs.legendWidth,
      height:height,
      stroke:vs.legendBorderColor,
      'stroke-width':vs.legendBorderWidth,
      fill:vs.legendBackgroundColor,
      rx:vs.legendBorderRadius,
      ry:vs.legendBorderRadius});
  }

  /* 'type' can be 'arrow', 'parallel', 'cuvedArrow', 'dashed', 'dotted', 'tapered' */
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
      drawPolygon(svg, [x2, y, x2 - offsetX, y - triangleSize / 2, x2 - offsetX, y + triangleSize / 2],
                  vs.legendShapeColor, {angle:angle, cx:x2, cy:y});
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
      var lineWidth = 2 * window.devicePixelRatio; // Arbitrary
      drawLine(svg, x - size, y, x + size, y, vs.legendShapeColor, lineWidth);
      drawLine(svg, x, y - size, x, y + size, vs.legendShapeColor, lineWidth);
    }
  }

  /**
   * Draw a polygon on a svg.
   * @param svg     {Object}
   * @param points  {Array<number>} Format: [x1, y1, x2, y2, ...]
   * @param color   {string}
   * @param [rotation] {Object}       Optional. Specifies a rotation to apply to the polygon.
   */
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

  /**
   * Draw the title of a widget. If the title is too large, the font size will be reduced until it fits.
   * @param vs    {Object} Visual settings.
   * @param svg   {Object}
   * @param title {string} Title of the widget.
   * @param unit  {string} Optional. The unit to be displayed alongside the title.
   */
  function drawWidgetTitle(vs, svg, title, unit) {
    var text = (title.length > vs.legendTitleMaxLength ? title.substring(0, vs.legendTitleMaxLength) : title)
             + (unit ? ' (' + unit + ')' : ''),
        fontSize = shrinkFontSize(text, vs.legendTitleFontFamily, vs.legendTitleFontSize, vs.legendWidth - vs.legendInnerMargin),
        offsetX = vs.legendTitleTextAlign === 'middle' ? vs.legendWidth / 2 : vs.legendInnerMargin;

    drawText(vs, svg, text, offsetX, vs.legendFontSize + vs.legendInnerMargin, vs.legendTitleTextAlign,
      vs.legendTitleFontColor, vs.legendTitleFontFamily, fontSize);
  }

  /**
   * Convert a property name to a nice, good looking title (e.g. 'funding_year' -> 'Funding year')
   * @param txt {string}
   * @returns {string}
   */
  function prettyfy(txt) {
    return txt.charAt(0).toUpperCase() + txt.slice(1).replace(/_/g, ' ');
  }

  /**
   * Reduce the font size of until the specified text fits a specified with.
   * @param text        {string}
   * @param fontFamily  {string}
   * @param fontSize    {number}
   * @param maxWidth    {number}
   * @returns {number}            The new size of the font.
   */
  function shrinkFontSize(text, fontFamily, fontSize, maxWidth) {
    while (getTextWidth(text, fontFamily, fontSize, false) > maxWidth) {
      fontSize -= (fontSize > 15 ? 2 : 1);
    }

    return fontSize;
  }

  var helper = document.createElement('canvas').getContext('2d');
  /**
   * Compute the width in pixels of a string, given a font family and font size.
   * @param text        {string}
   * @param fontFamily  {string}
   * @param fontSize    {number}
   * @param approximate {boolean} Optional. Specifies if the computation must be approximate (faster, but not accurate).
   * @returns {number}  Width of the text.
   */
  function getTextWidth(text, fontFamily, fontSize, approximate) {
    if (approximate) {
      return 0.45 * fontSize * text.length;
    } else {
      helper.font = fontSize + 'px ' + fontFamily;
      return helper.measureText(text).width;
    }
  }

  /**
   * Convert a number N to a formatted string.
   * If N > 9999 -> 3 most significant digits + unit (K, M, G, ...)
   * If N <= 9999 -> 4 most significant digits (including digits after the comma)
   * @param number {number}
   * @param isInteger {boolean} Indicates if the number is an integer (if so, no digit after the comma will be displayed).
   * @returns {string} The formatted number/
   */
  function numberToText(number, isInteger) {
    var units = ['K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];

    if (number > 9999) {
      var i = 0;
      while (i < units.length && number > 999) {
        number /= 1000;
        ++i;
      }
      return Math.ceil(number) + units[i-1];
    } else if (isInteger) {
      return Math.round(number).toString();
    } else if (number < 10) {
      return (Math.round(number * 1000) / 1000).toString();
    } else if (number < 100) {
      return (Math.round(number * 100) / 100).toString();
    } else if (number < 1000) {
      return (Math.round(number * 10) / 10).toString();
    } else {
      return (Math.round(number)).toString();
    }
  }

  /* ============================ */
  /* ===== PUBLIC FUNCTIONS ===== */
  /* ============================ */

  var _legendInstances = {};

  /**
   * Returns the instance of a specified sigma instance's legend plugin. Create it if it does not exist yet.
   * @param s {Object}        Sigma instance.
   * @returns {LegendPlugin}
   */
  sigma.plugins.legend = function (s) {
    if (!_legendInstances[s.id]) {
      _legendInstances[s.id] = new LegendPlugin(s);

      s.bind('kill', function() {
        sigma.plugins.killLegend(s);
      });
    }

    return _legendInstances[s.id];
  };

  /**
   * Destroy a sigma instance's associated legend plugin instance.
   * @param s {Object} Sigma instance.
   */
  sigma.plugins.killLegend = function (s) {
    var legendInstance = _legendInstances[s.id];
    if (legendInstance) {
      iterate(legendInstance.widgets, function (value, key) {
        legendInstance.widgets[key] = undefined;
      });
      _legendInstances[s.id] = undefined;
    }
  };

  /**
   * Build the widgets, compute the layout and draw the legend.
   * Must be called whenever the graph's design changes.
   */
  LegendPlugin.prototype.draw = function (callback) {
    var self = this,
        pixelRatio = this._visualSettings.pixelRatio;

    //setupCanvas(this._canvas, this._canvas.width / pixelRatio, this._canvas.height / pixelRatio, this._visualSettings.pixelRatio);
    buildLegendWidgets(this, function () {
      drawLayout(self);
      if (callback) {
        callback();
      }
    });
  };

  /**
   * Set the visibility of the legend.
   * @param visible {boolean}
   */
  LegendPlugin.prototype.setVisibility = function (visible) {
    this.visible = visible;
    drawLayout(this);
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
    drawLayout(this);
  };


  /**
   * Add a widget to the legend. Draw the legend.
   * Note: if a widget is not used (no corresponding design mapping), it won't be displayed.
   * @param elementType 'node' or 'edge'
   * @param visualVar   'size', 'color', 'icon'
   * @param unit        Optional. The unit to be displayed beside the widget's title
   * @returns {*}       The added widget.
   */
  LegendPlugin.prototype.addWidget = function (elementType, visualVar, unit) {
    var widget = this.widgets[makeWidgetId(elementType, visualVar)];

    if (!widget) {
      widget = new LegendWidget(this._canvas, this._sigmaInstance, this._designPlugin, this, elementType, visualVar);
      widget.id = makeWidgetId(elementType, visualVar);
      this.widgets[widget.id] = widget;
    }
    widget.unit = unit;
    buildWidgetAndDrawLayout(widget);

    return widget;
  };

  /**
   * @param elementType {string} 'node' or 'edge'
   * @param visualVar   {string} 'color', 'icon', 'size', 'type'
   * @returns {LegendWidget}
   */
  LegendPlugin.prototype.getWidget = function (elementType, visualVar) {
    return this.widgets[makeWidgetId(elementType, visualVar)];
  };

  /**
   * Add a widget that only contains text.  Draw the legend.
   * @param text              The text to be displayed inside the widget.
   * @returns {LegendWidget}  The added widget
   */
  LegendPlugin.prototype.addTextWidget = function (text) {
    var widget = new LegendWidget(this._canvas, this._sigmaInstance, this._designPlugin, this, 'text');

    widget.text = text;
    widget.id = 'text' + this.textWidgetCounter++;
    this.widgets[widget.id] = widget;

    buildWidgetAndDrawLayout(widget);

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
      drawLayout(this);
    }
  };

  /**
   * Remove all widgets from the legend.
   */
  LegendPlugin.prototype.removeAllWidgets = function () {
    this.widgets = {};
    drawLayout(this);
  };

  /**
   * Unpin the widget. An pinned widget is not taken into account when it is positioned through
   * automatic layout.
   */
  LegendWidget.prototype.unpin = function () {
    this.pinned = false;
    drawLayout(this._legendPlugin);
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
    drawLayout(this._legendPlugin);
  };

  /**
   * Set the text of a widget. The widget must be a text widget.
   * @param text The text to be displayed by the widget.
   */
  LegendWidget.prototype.setText = function (text) {
    this.text = text;
    buildWidgetAndDrawLayout(this);
  };

  /**
   * Set the unit of a widget. The widget must represent a size.
   * @param unit The unit to be displayed alongside the widget's title.
   */
  LegendWidget.prototype.setUnit = function (unit) {
    this.unit = unit;
    buildWidgetAndDrawLayout(this);
  };

  /**
   * Specify the list of external css files that must be included within the svg.
   * @param externalCSSList {Array<string>}
   */
  LegendPlugin.prototype.setExternalCSS = function (externalCSSList) {
    this.externalCSS = externalCSSList;
  };

  /**
   * Download the legend (PNG format).
   * @param [filename] {string} Optional. Default: 'legend.png'
   */
  LegendPlugin.prototype.exportPng = function (filename) {
    var visibility = this.visible,
        self = this;

    // We set the legend to visible so it draws the legend in the canvas
    self.visible = true;
    self.draw(function () {
      var tmpCanvas = document.createElement('canvas'),
        ctx = tmpCanvas.getContext('2d'),
        box = self.boundingBox;

      tmpCanvas.width = box.w;
      tmpCanvas.height = box.h;

      ctx.drawImage(self._canvas, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
      self.setVisibility(visibility);

      download(tmpCanvas.toDataURL(), filename ? filename : 'legend.png', true);
    });
  };

  /**
   * Download the legend (SVG format).
   * 'setExternalCSS' needs to be called before (if there is any external CSS file needed).
   * @param [filename] {string} Optional. Default: 'legend.svg'
   */
  LegendPlugin.prototype.exportSvg = function (filename) {
    var self = this;
    this.draw(function () {
      var vs = self._visualSettings,
        box = self.boundingBox,
        str = '';

      (self.externalCSS || []).forEach(function (url) {
        str += '<?xml-stylesheet type="text/css" href="' + url + '" ?>\n';
      });

      str += '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="' + box.w + 'px" height="' + box.h + 'px">';
      iterate(self.widgets, function (widget) {
        if (widget.svg === null) {
          return;
        }

        str += '<g transform="translate(' + (widget.x + - box.x) + ' ' + (widget.y - box.y) + ')">';
        str += widget.svg.innerHTML;
        if (widget.visualVar === 'icon') {
          var tmpSvg = document.createElement('svg');
          iterate(widget.svg.icons, function (value, content) {
            drawText(vs, tmpSvg, content, value.x, value.y, 'left', vs.legendFontColor, value.font,
              vs.legendFontSize, 'central');
          });
          str += tmpSvg.innerHTML;
        }
        str += '</g>';
      });
      str += '</svg>';

      download(str, filename ? filename : 'legend.svg');
    });
  };

}).call(this);