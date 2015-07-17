;(function(undefined) {
  'use strict';

  /**
   * Sigma Spreadsheet File Exporter
   * ================================
   *
   * The aim of this plugin is to enable users to retrieve a Spreadsheet file
   * for nodes or edges of the graph.
   *
   * Author: Sébastien Heymann <seb@linkurio.us> (Linkurious)
   * Version: 0.0.1
   */

  if (typeof sigma === 'undefined')
    throw new Error('sigma is not declared');

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
      dataUrl = 'data:text/csv;charset=UTF-8,' + encodeURIComponent(fileEntry);
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

  function escape(x, separator) {
    if (x === null || x === undefined)
      return separator + separator;

    if (typeof x === 'function')
      return x.toString();

    x = (typeof x === 'string') ? x : JSON.stringify(x);
    x = x.replace(/\s+/g, ' ');

    if (separator && separator.length) {
      return separator +
        x.replace(
          separator,
          (separator === '"') ? "'" : '"'
        ) +
        separator;
    }
    return x;
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
    if (str === null || str === undefined) return null;
    return str.split('.').reduce(function(obj, i) { return obj[i] }, obj);
  }

  /**
   * Transform the graph memory structure into a Spreadsheet file.
   *
   * @param  {object} params The options.
   * @return {string}        The Spreadsheet string.
   */
  sigma.prototype.toSpreadsheet = function(params) {
      params = params || {};
      params.separator = params.separator || ',';
      params.textSeparator = params.textSeparator || '';

      if (params.textSeparator && params.textSeparator !== '"' && params.textSeparator !== "'")
        throw new TypeError(
          'Invalid argument :"textSeparator" is not single-quote or double-quote, was ' +
          params.textSeparator);

      var rows = [],
          index = {},
          attributesArr = [],
          cpt = 0,
          data,
          attributes,
          categories,
          categoriesColName = params.categoriesName || 'categories',
          o,
          arr,
          extraCol;

      if (!params.what)
        throw new TypeError('Missing argument: "what".');

      if (params.what === 'nodes') {
        if (params.which)
          data = this.graph.nodes(params.which)
        else
          data = this.graph.nodes();
      }
      else if (params.what === 'edges') {
        if (params.which)
          data = this.graph.edges(params.which)
        else
          data = this.graph.edges();
      }
      else
        throw new TypeError('Invalid argument: "what" is not "nodes" or "edges", was ' + params.what);

      // Find all attributes keys to provide fixed row length to deal with
      // missing attributes
      index['id'] = cpt++;
      attributesArr.push(escape('id', params.textSeparator));

      if (params.what === 'edges') {
        index['source'] = cpt++;
        attributesArr.push(escape('source', params.textSeparator));
        index['target'] = cpt++;
        attributesArr.push(escape('target', params.textSeparator));
      }

      extraCol = params.categories && params.categories.length;
      if (extraCol) {
        index['categories'] = cpt++;
        attributesArr.push(escape(categoriesColName, params.textSeparator));
      }

      for (var i = 0 ; i < data.length ; i++) {
        o = data[i];
        attributes = strToObjectRef(o, params.attributes) || {};
        Object.keys(attributes).forEach(function (k) {
          if (!(k in index)) {
            index[k] = cpt++;
            attributesArr.push(
              escape(k, params.textSeparator)
            );
          }
        });
      }
      rows.push(attributesArr);

      // Get attribute values
      for (var i = 0 ; i < data.length ; i++) {
        o = data[i];
        arr = [];
        arr.length = cpt;

        arr[0] = escape(o.id, params.textSeparator);

        if (params.what === 'edges') {
          arr[1] = escape(o.source, params.textSeparator);
          arr[2] = escape(o.target, params.textSeparator);
        }

        if (extraCol) {
          categories = strToObjectRef(o, params.categories);
          if (Array.isArray(categories)) {
            categories = categories.join(',');
          }

          arr[index['categories']] = escape(categories, params.textSeparator);
        }

        attributes = strToObjectRef(o, params.attributes) || {};
        Object.keys(attributes).forEach(function (k) {
          arr[index[k]] = escape(attributes[k], params.textSeparator);
        });
        rows.push(arr);
      }

      var serialized = rows.map(function(arr) {
        return arr.join(params.separator);
      }).join('\n');

      if (params.download) {
        download(serialized, 'csv', params.filename);
      }

      return serialized;
  };
}).call(this);
