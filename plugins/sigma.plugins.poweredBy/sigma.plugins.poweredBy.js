;(function(undefined) {

  /**
   * Sigma Renderer PoweredBy Utility
   * ================================
   *
   * The aim of this plugin is to display a clickable "powered by" text on the canvas.
   *
   * Author: Sébastien Heymann (sheymann) for Linkurious
   * Version: 0.0.1
   */

  function poweredBy(options) {
    options = options || {};
    var self = this,
        content,
        html = options.html || this.settings('poweredByHTML'),
        url = options.url || this.settings('poweredByURL'),
        pingURL = options.pingURL || this.settings('poweredByPingURL');

    if (!document.getElementsByClassName('sigma-poweredby').length) {
      if (url) {
        content = [
          '<a href="' +
          url +
          '" target="_blank" style="font-family:Lato,sans-serif;font-size:11px;color:#333;text-decoration:none;">' +
          html +
          '</a>'
        ];
      }
      else {
        content = [ html ];
      }

      if (pingURL) {
        var img = new Image();
        img.src = pingURL;
      }

      var dom = document.createElement('div');
      dom.setAttribute('class', 'sigma-poweredby');
      dom.innerHTML = content.join('');
      dom.style.position = 'absolute';
      dom.style.bottom = '2px';
      dom.style.right = '1px';
      dom.style.zIndex = '1000';
      dom.style.background = 'rgba(255, 255, 255, 0.8)';

      this.container.appendChild(dom);
    }
  }

  // Extending canvas and webl renderers
  sigma.renderers.canvas.prototype.poweredBy = poweredBy;
  sigma.renderers.webgl.prototype.poweredBy = poweredBy;

}).call(this);
