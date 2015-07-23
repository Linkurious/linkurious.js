var nodes_def = {}

var PREV_FONT = null; 

nodes_def.just_fill_text = {
	render: function(node, context, settings) {
    var prefix = settings('prefix') || '';

    context.fillText(
      node.label,
      Math.round(node[prefix + 'x']),
      Math.round(node[prefix + 'y'])
    );
  }
}