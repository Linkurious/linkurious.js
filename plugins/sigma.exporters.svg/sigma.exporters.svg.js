;(function(undefined) {
  'use strict';

  /**
   * Sigma SVG Exporter
   * ===================
   *
   * This plugin is designed to export a graph to a svg file that can be
   * downloaded or just used elsewhere.
   *
   * Author: Guillaume Plique (Yomguithereal)
   * Version: 0.0.1
   */

  // Terminating if sigma were not to be found
  if (typeof sigma === 'undefined')
    throw 'sigma.renderers.snapshot: sigma not in scope.';


  /**
   * Polyfills
   */
  var URL = this.URL || this.webkitURL || this;


  /**
   * Utilities
   */
  function createBlob(data) {
    return new Blob(
      [data],
      {type: 'image/svg+xml;charset=utf-8'}
    );
  }

  function download(string, filename) {

    // Creating blob href
    var blob = createBlob(string);

    // Anchor
    var o = {};
    o.anchor = document.createElement('a');
    o.anchor.setAttribute('href', URL.createObjectURL(blob));
    o.anchor.setAttribute('download', filename);

    // Click event
    var event = document.createEvent('MouseEvent');
    event.initMouseEvent('click', true, false, window, 0, 0, 0 ,0, 0,
      false, false, false, false, 0, null);

    URL.revokeObjectURL(blob);

    o.anchor.dispatchEvent(event);
    delete o.anchor;
  }


  /**
   * Defaults
   */
  var DEFAULTS = {
    size: '1000',
    width: '1000',
    height: '1000',
    classes: true,
    labels: true,
    data: false,
    download: false,
    filename: 'graph.svg'
  };

  var XMLNS = 'http://www.w3.org/2000/svg';


  /**
   * Subprocesses
   */
  function optimize(svg, prefix, params) {
    var nodeColorIndex = {},
        edgeColorIndex = {},
        count = 0,
        color,
        style,
        styleText = '',
        f,
        i,
        l;

    // Creating style tag if needed
    if (params.classes) {
      style = document.createElementNS(XMLNS, 'style');
      svg.insertBefore(style, svg.firstChild);
    }

    // Iterating over nodes
    var nodes = svg.querySelectorAll('[id="' + prefix + '-group-nodes"] > [class="' + prefix + '-node"]');

    for (i = 0, l = nodes.length, f = true; i < l; i++) {
      color = nodes[i].getAttribute('fill');

      if (!params.data)
        nodes[i].removeAttribute('data-node-id');

      if (params.classes) {

        if (!(color in nodeColorIndex)) {
          nodeColorIndex[color] = (f ? prefix + '-node' : 'c-' + (count++));
          styleText += '.' + nodeColorIndex[color] + '{fill: ' + color + '}';
        }

        if (nodeColorIndex[color] !== prefix + '-node')
          nodes[i].setAttribute('class', nodes[i].getAttribute('class') + ' ' + nodeColorIndex[color]);
        nodes[i].removeAttribute('fill');
      }

      f = false;
    }

    // Iterating over edges
    var edges = svg.querySelectorAll('[id="' + prefix + '-group-edges"] > [class="' + prefix + '-edge"]');

    for (i = 0, l = edges.length, f = true; i < l; i++) {
      color = edges[i].getAttribute('stroke');

      if (!params.data)
        edges[i].removeAttribute('data-edge-id');

      if (params.classes) {

        if (!(color in edgeColorIndex)) {
          edgeColorIndex[color] = (f ? prefix + '-edge' : 'c-' + (count++));
          styleText += '.' + edgeColorIndex[color] + '{stroke: ' + color + '}';
        }

        if (edgeColorIndex[color] !== prefix + '-edge')
          edges[i].setAttribute('class', edges[i].getAttribute('class') + ' ' + edgeColorIndex[color]);
        edges[i].removeAttribute('stroke');
      }

      f = false;
    }

    if (params.classes)
      style.appendChild(document.createTextNode(styleText));
  }


  /**
   * Extending prototype
   */
  sigma.prototype.toSVG = function(params) {
    params = params || {};

    var prefix = this.settings('classPrefix'),
        w = params.size || params.width || DEFAULTS.size,
        h = params.size || params.height || DEFAULTS.size;

    // Creating a dummy container
    var container = document.createElement('div');
    container.setAttribute('width', w);
    container.setAttribute('height', h);
    container.setAttribute('style', 'position:absolute; top: 0px; left:0px; width: ' + w + 'px; height: ' + h + 'px;');

    // Creating a camera
    var camera = this.addCamera();

    // Creating a svg renderer
    var renderer = this.addRenderer({
      camera: camera,
      container: container,
      type: 'svg',
      forceLabels: !!params.labels
    });

    // Refreshing
    renderer.resize(w, h);
    this.refresh();

    // Dropping camera and renderers before something nasty happens
    this.killRenderer(renderer);
    this.killCamera(camera);

    // Retrieving svg
    var svg = container.querySelector('svg');
    svg.removeAttribute('style');
    svg.setAttribute('width', w + 'px');
    svg.setAttribute('height', h + 'px');
    svg.setAttribute('x', '0px');
    svg.setAttribute('y', '0px');
    // svg.setAttribute('viewBox', '0 0 1000 1000');

    // Dropping labels
    if (!params.labels) {
      var labelGroup = svg.querySelector('[id="' + prefix + '-group-labels"]');
      svg.removeChild(labelGroup);
    }

    // Dropping hovers
    var hoverGroup = svg.querySelector('[id="' + prefix + '-group-hovers"]');
    svg.removeChild(hoverGroup);

    // Optims?
    params.classes = (params.classes !== false);
    if (!params.data || params.classes)
      optimize(svg, prefix, params);

    // Retrieving svg string
    var svgString = svg.outerHTML;

    // Paranoid cleanup
    container = null;

    // Output string
    var output = '<?xml version="1.0" encoding="utf-8"?>\n';
    output += '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n';
    output += svgString;

    if (params.download)
      download(output, params.filename || DEFAULTS.filename);

    return output;
  };
}).call(this);
