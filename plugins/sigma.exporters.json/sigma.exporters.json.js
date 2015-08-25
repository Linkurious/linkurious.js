;(function(undefined) {
  'use strict';

  /**
   * Sigma JSON File Exporter
   * ================================
   *
   * The aim of this plugin is to enable users to retrieve a JSON file of the
   * graph.
   *
   * Author: Sébastien Heymann <seb@linkurio.us> (Linkurious)
   * Version: 0.0.1
   */

  if (typeof sigma === 'undefined')
    throw 'sigma.exporters.json: sigma is not declared';

  // Utilities
  function download(fileEntry, extension, filename) {
    var blob = null,
        objectUrl = null,
        dataUrl = null;

    if(window.Blob){
      // use Blob if available
      blob = new Blob([fileEntry], {type: 'text/json'});
      objectUrl = window.URL.createObjectURL(blob);
    }
    else {
      // else use dataURI
      dataUrl = 'data:text/json;charset=UTF-8,' + encodeURIComponent(fileEntry);
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
   * Fast deep copy function.
   *
   * @param  {object} o The object.
   * @return {object}   The object copy.
   */
  function deepCopy(o) {
    var copy = Object.create(null);
    for (var i in o) {
      if (typeof o[i] === "object" && o[i] !== null) {
        copy[i] = deepCopy(o[i]);
      }
      else if (typeof o[i] === "function" && o[i] !== null) {
        // clone function:
        eval(" copy[i] = " +  o[i].toString());
        //copy[i] = o[i].bind(_g);
      }

      else
        copy[i] = o[i];
    }
    return copy;
  };

  /**
   * Returns true if the string "str" starts with the string "start".
   *
   * @param {string} start
   * @param {string} str
   * @return {boolean}
   */
  function startsWith(start, str) {
    return str.slice(0, start.length) == start;
  };

  /**
   * Remove attributes added by the cameras and renderers. The node/edge
   * object should be a clone of the original.
   *
   * @param  {object} o The node or edge object.
   * @return {object}   The cleaned object.
   */
  function cleanup(o) {
    for (var prop in o) {
      if (
        startsWith('read_cam', prop) ||
        startsWith('cam', prop) ||
        startsWith('renderer', ''+prop)
      ) {
        o[prop] = undefined;
      }
    }

    return o;
  }

  /**
   * Transform the graph memory structure into a JSON representation.
   *
   * @param  {object} params The options.
   * @return {string}        The JSON string.
   */
  sigma.prototype.toJSON = function(params) {
      params = params || {};

      var graph = {
        nodes: this.graph.nodes().map(deepCopy).map(cleanup),
        edges: this.graph.edges().map(deepCopy).map(cleanup)
      };

      if (params.pretty) {
        var jsonString = JSON.stringify(graph, null, ' ');
      }
      else {
        var jsonString = JSON.stringify(graph);
      }

      if (params.download) {
        download(jsonString, 'json', params.filename);
      }

      return jsonString;
  };
}).call(this);
