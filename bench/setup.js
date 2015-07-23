var container = document.getElementById('graph-container');

var i,
    s,
    N = 600,
    E = 1000,
    g = {
      nodes: [],
      edges: []
    };

// Generate a random graph:
for (i = 0; i < N; i++)
  g.nodes.push({
    id: 'n' + i,
    label: 'Node ' + i,
    x: Math.random()*20,
    y: Math.random()*10,
    size: Math.random(),
    color: '#666',
    glyphs: [{
     'position': 'top-left',
      'content': 'A'
    }, {
     'position': 'top-right',
      'content': 'B'
    }],
    active: [false, true][Math.random() > 0.95 ? 1: 0],
  });

for (i = 0; i < E; i++)
  g.edges.push({
    id: 'e' + i,
    source: 'n' + (Math.random() * N | 0),
    target: 'n' + (Math.random() * N | 0),
    size: Math.random(),
    color: '#ccc',
    active: [false, true][Math.random() > 0.95 ? 1: 0],
    label: 'Edge edgy '+i
  });

s = new sigma({
  graph: g,
  settings: settings
});

// Initialize camera:
s.addCamera('cam');

// Initialize the two renderers:
var renderer = s.addRenderer({
  container: container,
  type: 'canvas',
  camera: 'cam'
});

halo_defs = {}

halo = {}
halo.def = function(){
  renderer.halo({
    nodes: s.graph.nodes()
  });
}

glyphs_defs = {}

glyphs = {}
glyphs.def = function(){
  renderer.glyphs();
}

renderer.bind('render', function(e) {
  halo.def();
  glyphs.def();
});

s.refresh();