var edges_def = {}

edges_def.just_text =
  function(edge, source, target, context, settings) {

  if (typeof edge.label !== 'string' || source == target)
    return;

  var prefix = settings('prefix') || '',
      size = edge[prefix + 'size'] || 1;

  if (size < settings('edgeLabelThreshold') && !edge.hover)
    return;

  var fontSize,
      angle = 0,
      x = (source[prefix + 'x'] + target[prefix + 'x']) / 2,
      y = (source[prefix + 'y'] + target[prefix + 'y']) / 2;

  context.fillText(
    edge.label,
    x,
    (-size / 2) - 3 + y
  );
};


edges_def.text_angle =
  function(edge, source, target, context, settings) {

  if (typeof edge.label !== 'string' || source == target)
    return;

  var prefix = settings('prefix') || '',
      size = edge[prefix + 'size'] || 1;

  if (size < settings('edgeLabelThreshold') && !edge.hover)
    return;

  var fontSize,
      angle = 0,
      x = (source[prefix + 'x'] + target[prefix + 'x']) / 2,
      y = (source[prefix + 'y'] + target[prefix + 'y']) / 2,
      dX = target[prefix + 'x'] - source[prefix + 'x'],
      dY = target[prefix + 'y'] - source[prefix + 'y'],
      sign = (source[prefix + 'x'] < target[prefix + 'x']) ? 1 : -1;

  angle = Math.atan2(dY * sign, dX * sign);
  context.translate(x,y);
  context.rotate(angle);
  context.fillText(
    edge.label,
    0,
    (-size / 2) - 3
  );
  context.rotate(-angle);
  context.translate(-x,-y);
};