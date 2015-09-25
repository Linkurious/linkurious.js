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

    function createAndAppend(parentElement, typeToCreate, attributes, elementValue) {
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

      if (elementValue) {
        var textNode = document.createTextNode(elementValue);
        elt.appendChild(textNode);
      }

      parentElement.appendChild(elt);

      return elt;
    }

    function appendGraphMLAttributesDefinition(parentElem, attributeList) {
      attributeList.forEach(function (a) {
        var attributeElem = createAndAppend(parentElem, 'key', {
          'id': a.name,
          'for': a.for,
          'attr.name': a.name,
          'attr.type': a.type
        });
        if (a.defaultValue) {
          createAndAppend(attributeElem, 'default', null, a.defaultValue);
        }
      });
    }

    function appendGraphMLAttributes(parent, attributeList) {
      for (var key in attributeList) {
        if (!attributeList.hasOwnProperty(key)) {
          continue;
        }
        var value = attributeList[key];
        if (value) {
          createAndAppend(parent, 'data', {key: key}, value);
        }
      }
    }

    /* Root element */
    var rootElem = createAndAppend(doc, 'graphml', {
    'xmlns': 'http://graphml.graphdrawing.org/xmlns',
    'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
    'xsi:schemaLocation': 'http://graphml.graphdrawing.org/xmlns http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd'
  });

    var graphmlAttributeList = [
      { name:'size', for:'all', type: 'float'},
      { name:'x', for:'node', type:'float'},
      { name:'y', for:'node', type:'float'},
      { name:'type', for:'all', type:'string'},
      { name:'color', for:'all', type:'string'},
      { name:'label', for:'all', type:'string'},
      { name:'fixed', for:'node', type:'boolean'},
      { name:'hidden', for:'all', type:'boolean'},
      { name:'active', for:'all', type:'boolean'}
    ];

    /* GraphML attributes */
    appendGraphMLAttributesDefinition(rootElem, graphmlAttributeList);

    /* Graph element */
    var graphElem = createAndAppend(rootElem, 'graph', {
      'edgedefault': params.undirectedEdges ? 'undirected' : 'directed',
      'id': params.graphId,
      'parse.nodes': nodes.length,
      'parse.edges': edges.length,
      'parse.order': 'nodesfirst'
    });

    /* Nodes & edges */

    nodes.forEach(function (n) {
      var nodeElem = createAndAppend(graphElem, 'node', {
        'id': n.id
      });

      appendGraphMLAttributes(nodeElem, {
        'x': n[prefix + 'x'],
        'y': 1 - n[prefix + 'y'],
        'size': n.size,
        'type': n.type,
        'color': n.color,
        'label': n.label,
        'fixed': n.fixed,
        'hidden': n.hidden,
        'active': n.active
      });
    });

    edges.forEach(function (e) {
      var edgeElem = createAndAppend(graphElem, 'edge', {
        'id': e.id,
        'source': e.source,
        'target': e.target
      });

      appendGraphMLAttributes(edgeElem, {
        'size': e.size,
        'type': e.type,
        'color': e.color,
        'label': e.label,
        'hidden': e.hidden,
        'active': e.active
      });
    });

    sXML = '<?xml version="1.0" encoding="UTF-8"?>' + oSerializer.serializeToString(doc);

    if (params.download) {
      download(sXML, 'graphml', params.filename);
    }
  };

}.call(this));