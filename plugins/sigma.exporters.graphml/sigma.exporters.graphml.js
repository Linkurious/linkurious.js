;(function(undefined) {
  'use strict';

  /**
   * Sigma GraphML File Exporter
   * ================================
   *
   * The aim of this plugin is to enable users to retrieve a GraphML file of the
   * graph.
   *
   * Author: Sylvain Milan
   * Date created: 25/09/2015
   */

  if (typeof sigma === 'undefined')
    throw 'sigma.exporters.graphML: sigma is not declared';

  // Utilities
  function download(fileEntry, extension, filename) {
    var blob = null,
      objectUrl = null,
      dataUrl = null;

    if(window.Blob){
      // use Blob if available
      blob = new Blob([fileEntry], {type: 'text/xml'});
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
      anchor.setAttribute('download', filename || 'graph.' + extension);

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

  function iterate(obj, func) {
    for (var k in obj) {
      if (!obj.hasOwnProperty(k)) {
        continue;
      }

      func(obj[k], k);
    }
  }

  /**
   * Convert Javascript string in dot notation into an object reference.
   *
   * @param  {object} obj The object.
   * @param  {string} str The string to convert, e.g. 'a.b.etc'.
   * @return {?}          The object reference.
   */
  function strToObjectRef(obj, str) {
    // http://stackoverflow.com/a/6393943
    if (str == null) return null;
    return str.split('.').reduce(function(obj, i) { return obj[i] }, obj);
  }

  function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
      return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null;
  }

  sigma.prototype.toGraphML = function (params) {
    params = params || {};

    var doc = document.implementation.createDocument('', '', null),
        oSerializer = new XMLSerializer(),
        sXML,
        webgl = true,
        prefix,
        nodes = this.graph.nodes(),
        edges = this.graph.edges();

    if (params.renderer) {
      webgl = params.renderer instanceof sigma.renderers.webgl;
      prefix = webgl ?
        params.renderer.camera.prefix:
        params.renderer.camera.readPrefix;
    } else {
      prefix = '';
    }

    function setRGB(obj, color) {
      var rgb;
      if (color[0] === '#') {
        rgb = hexToRgb(color);
      } else {
        rgb = color.match(/\d+(\.\d+)?/g);
      }

      obj.r = rgb[0];
      obj.g = rgb[1];
      obj.b = rgb[2];
      if (obj.a) {
        obj.a = rgb[3];
      }
    }

    function createAndAppend(parentElement, typeToCreate, attributes, elementValue, force) {
      attributes = attributes || {};

      var elt = doc.createElement(typeToCreate);

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

    var builtinAttributes = [
      'id', 'source', 'target'
    ];

    var reservedAttributes = [
      'size', 'x', 'y', 'type', 'color', 'label', 'fixed', 'hidden', 'active'
    ];

    var keyElements = {
        'size': {for: 'all', type: 'double'},
        'x': {for: 'node', type: 'double'},
        'y': {for: 'node', type: 'double'},
        'type': {for: 'all', type: 'string'},
        'color': {for: 'all', type: 'string'},
        'r': {for:'all', type:'int'},
        'g': {for:'all', type:'int'},
        'b': {for:'all', type:'int'},
        'a': {for:'all', type:'double'},
        'label': {for: 'all', type: 'string'},
        'fixed': {for: 'node', type: 'boolean'},
        'hidden': {for: 'all', type: 'boolean'},
        'active': {for: 'all', type: 'boolean'}
      },
        nodeElements = [],
        edgeElements = [];

    function processItem(item, itemType, itemAttributesName) {
      var dataAttributes = strToObjectRef(item, itemAttributesName);
      var elt = {id:item.id};

      reservedAttributes.forEach(function (attr) {
        var value = (attr === 'x' || attr === 'y') ? item[prefix + attr] : item[attr];
        if (attr === 'y' && value) {
          value = -parseFloat(value);
        }

        if (value !== undefined) {
          elt[(itemType === 'edge' ? 'edge_' : '') + attr] = value;
          if (attr === 'color') {
            setRGB(elt, value);
          }
        }
      });

      iterate(dataAttributes, function (value, key) {
        if (reservedAttributes.indexOf(key) !== -1 || builtinAttributes.indexOf(key) !== -1) {
          return;
        }

        if (!keyElements[key]) {
          keyElements[key] = {for:itemType, type:'string'};
        } else if (keyElements[key].for !== itemType) {
          keyElements[key].for = 'all';
        }

        elt[key] = value;
      });

      if (itemType === 'edge') {
        elt.source = item.source;
        elt.target = item.target;
        edgeElements.push(elt);
      } else {
        nodeElements.push(elt);
      }
    }

    nodes.forEach(function (n) {
      processItem(n, 'node', params.nodesAttributes);
    });

    edges.forEach(function (e) {
      processItem(e, 'edge', params.edgesAttributes);
    });

    /* Root element */
    var rootElem = createAndAppend(doc, 'graphml', {
    'xmlns': 'http://graphml.graphdrawing.org/xmlns',
    'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
    'xsi:schemaLocation': 'http://graphml.graphdrawing.org/xmlns http://www.yworks.com/xml/schema/graphml/1.1/ygraphml.xsd',
    'xmlns:y': 'http://www.yworks.com/xml/graphml',
    'xmlns:java': 'http://www.yworks.com/xml/yfiles-common/1.0/java',
    'xmlns:sys': 'http://www.yworks.com/xml/yfiles-common/markup/primitives/2.0',
    'xmlns:x': 'http://ww.yworks.com/xml/yfiles-common/markup/2.0'
  });

    /* GraphML attributes */
    iterate(keyElements, function (value, key) {
      if (value.for === 'node' || value.for === 'all') {
        createAndAppend(rootElem, 'key', {
          'attr.name': key,
          'attr.type': value.type,
          'for': 'node',
          'id': key
        });
      }

      if (value.for === 'edge' || value.for === 'all') {
        createAndAppend(rootElem, 'key', {
          'attr.name': key,
          'attr.type': value.type,
          'for': 'edge',
          'id': 'edge_' + key
        });
      }
    });

    /* yFiles extension */
    createAndAppend(rootElem, 'key', {
      'id':'nodegraphics',
      'for':'node',
      'yfiles.type':'nodegraphics',
      'attr.type': 'string'
    });

    createAndAppend(rootElem, 'key', {
      'id':'edgegraphics',
      'for':'edge',
      'yfiles.type':'edgegraphics',
      'attr.type': 'string'
    });

    /* Graph element */
    var graphElem = createAndAppend(rootElem, 'graph', {
      'edgedefault': params.undirectedEdges ? 'undirected' : 'directed',
      'id': params.graphId ? params.graphId : 'G',
      'parse.nodes': nodes.length,
      'parse.edges': edges.length,
      'parse.order': 'nodesfirst'
    });

    function appendShapeNode(nodeElem, node) {
      var dataElem = createAndAppend(nodeElem, 'data', { key:'nodegraphics'});
      var shapeNodeElem = createAndAppend(dataElem, 'y:ShapeNode');

      createAndAppend(shapeNodeElem, 'y:Geometry', { x:node.x, y:node.y, width:node.size, height:node.size});
      createAndAppend(shapeNodeElem, 'y:Fill', { color: node.color ? node.color : '#000000', transparent: false });
      createAndAppend(shapeNodeElem, 'y:NodeLabel', null, node.label ? node.label : '');
      createAndAppend(shapeNodeElem, 'y:Shape', {type:node.type ? node.type : 'circle'});
    }

    function appendPolyLineEdge(edgeElem, edge) {
      var dataElem = createAndAppend(edgeElem, 'data', { key:'edgegraphics'});
      var shapeEdgeElem = createAndAppend(dataElem, 'y:PolyLineEdge');

      createAndAppend(shapeEdgeElem, 'y:LineStyle', {
        type:edge.edge_type ? edge.edge_type : 'line',
        color:edge.edge_color ? edge.edge_color : '#0000FF',
        width:edge.edge_size ? edge.edge_size : 1
      });

      createAndAppend(shapeEdgeElem, 'y:EdgeLabel', null, edge.edge_label ? edge.edge_label : '');
    }

    /* Node elements */
    nodeElements.forEach(function (elt) {
      var nodeElem = createAndAppend(graphElem, 'node', { id:elt.id });

      appendShapeNode(nodeElem, elt);

      iterate(elt, function (value, key) {
        if (builtinAttributes.indexOf(key) !== -1) {
          return;
        }

        createAndAppend(nodeElem, 'data', {key: key}, value, true);
      });
    });

    /* Edge elements */
    edgeElements.forEach(function (elt) {
      var edgeElem = createAndAppend(graphElem, 'edge', { id:elt.id, source:elt.source, target:elt.target });

      appendPolyLineEdge(edgeElem, elt);

      iterate(elt, function (value, key) {
        if (builtinAttributes.indexOf(key) !== -1) {
          return;
        }

        createAndAppend(edgeElem, 'data', {key:key}, value, true);
      });
    });

    sXML = '<?xml version="1.0" encoding="UTF-8"?>' + oSerializer.serializeToString(doc);

    if (params.download) {
      download(sXML, 'graphml', params.filename);
    }
  };

}.call(this));