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
    if (str === null) return null;
    return str.split('.').reduce(function(obj, i) { return obj[i] }, obj);
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
        'size': {for: 'all', type: 'float'},
        'x': {for: 'node', type: 'float'},
        'y': {for: 'node', type: 'float'},
        'type': {for: 'all', type: 'string'},
        'color': {for: 'all', type: 'string'},
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

      iterate(dataAttributes, function (value, key) {
        if (reservedAttributes.indexOf(key) !== -1 || builtinAttributes.indexOf(key) !== -1) {
          return;
        }

        if (!keyElements[key]) {
          keyElements[key] = {for:itemType, type:'string'};
        } else if (keyElements[key].for !== itemType) {
          keyElements[key] = 'all';
        }

        elt[key] = value;
      });

      reservedAttributes.forEach(function (attr) {
        var value = (attr === 'x' || attr === 'y') ? item[prefix + attr] : item[attr];
        if (value !== undefined) {
          elt[attr] = value;
        }
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
    'xsi:schemaLocation': 'http://graphml.graphdrawing.org/xmlns http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd'
  });

    /* GraphML attributes */
    iterate(keyElements, function (value, key) {
      createAndAppend(rootElem, 'key', {
        'id': key,
        'for': value.for,
        'attr.name': key,
        'attr.type': value.type
      });
    });

    /* Graph element */
    var graphElem = createAndAppend(rootElem, 'graph', {
      'edgedefault': params.undirectedEdges ? 'undirected' : 'directed',
      'id': params.graphId ? params.graphId : 'G',
      'parse.nodes': nodes.length,
      'parse.edges': edges.length,
      'parse.order': 'nodesfirst'
    });

    /* Node elements */
    nodeElements.forEach(function (elt) {
      var nodeElem = createAndAppend(graphElem, 'node', { id:elt.id });
      iterate(elt, function (value, key) {
        if (builtinAttributes.indexOf(key) !== -1) {
          return;
        }

        createAndAppend(nodeElem, 'data', {key: key}, value, true);
      });
    });

    /* Edge elements */
    edgeElements.forEach(function (elt) {
      var edgeElem = createAndAppend(graphElem, 'edge', { id:elt.id });
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