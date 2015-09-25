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
    throw 'sigma.exporters.gexf: sigma is not declared';

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

  
}.call(this));