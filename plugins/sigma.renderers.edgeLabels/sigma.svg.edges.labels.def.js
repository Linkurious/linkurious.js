;(function() {
  'use strict';

  sigma.utils.pkg('sigma.svg.edges.labels');

  sigma.svg.edges.labels.def = {
    create: function(edge, source, target, settings) {
      console.log('Create');
    },

    update: function(edge, text, source, target, settings) {
      console.log('Update');
    }
  };
})();

