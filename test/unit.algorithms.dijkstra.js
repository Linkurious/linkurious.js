module('sigma.algorithms.dijkstra');

test('Basic manipulation', function() {

  var graph1 = {
    nodes: [
      {id: 'n0', label: 'Node 0', myNodeAttr: 123},
      {id: 'n1', label: 'Node 1'},
      {id: 'n2', label: 'Node 2'},
      {id: 'n3', label: 'Node 3'},
      {id: 'n4', label: 'Node 4'}
    ],
    edges: [
      {id: 'e0', source: 'n0', target: 'n1'},
      {id: 'e1', source: 'n0', target: 'n2'},
      {id: 'e2', source: 'n1', target: 'n4'},
      {id: 'e3', source: 'n2', target: 'n3'},
      {id: 'e4', source: 'n3', target: 'n4'},
    ]
  },
  graph2 = {
    nodes: [
      {id: 'n0', label:'Node 0'},
      {id: 'n1', label:'Node 1'},
      {id: 'n2', label:'Node 2'},
      {id: 'n3', label:'Node 3'},
      {id: 'n4', label:'Node 4'},
      {id: 'n5', label:'Node 5'},
      {id: 'n6', label:'Node 6'},
      {id: 'n7', label:'Node 7'}
    ],
    edges: [
      {id: 'e0', source: 'n0', target: 'n1', cost: 2},
      {id: 'e1', source: 'n0', target: 'n2', cost: 6},
      // {id: 'e11', source: 'n1', target: 'n0', cost: 2},
      {id: 'e2', source: 'n1', target: 'n3', cost: 3},
      {id: 'e3', source: 'n2', target: 'n3'},
      {id: 'e17', source: 'n2', target: 'n4', cost: 4},
      // {id: 'e12', source: 'n2', target: 'n0', cost: 2},
      {id: 'e4', source: 'n3', target: 'n4', cost: 2},
      {id: 'e5', source: 'n3', target: 'n6', cost: 5},
      // {id: 'e13', source: 'n3', target: 'n1', cost: 3},
      // {id: 'e14', source: 'n3', target: 'n2'},
      // {id: 'e18', source: 'n4', target: 'n2', cost: 4},
      // {id: 'e15', source: 'n4', target: 'n3', cost: 2},
      {id: 'e6', source: 'n4', target: 'n5'},
      {id: 'e7', source: 'n4', target: 'n7', cost: 7},
      // {id: 'e19', source: 'n5', target: 'n4'},
      {id: 'e8', source: 'n5', target: 'n6'},
      {id: 'e9', source: 'n5', target: 'n7', cost: 6},
      // {id: 'e16', source: 'n6', target: 'n3', cost: 5},
      // {id: 'e21', source: 'n6', target: 'n5'},
      {id: 'e10', source: 'n6', target: 'n7'},
      // {id: 'e20', source: 'n7', target: 'n4', cost: 7},
      // {id: 'e22', source: 'n7', target: 'n5', cost: 6},
      // {id: 'e23', source: 'n7', target: 'n6'}
    ]
  },
  graph1Sol = {
      n0: {distance: 0, prev: null},
      n1: {distance: 1, prev: "n0"},
      n2: {distance: 1, prev: "n0"},
      n3: {distance: 2, prev: "n2"},
      n4: {distance: 2, prev: "n1"}
  },
  graph2_1Sol = {
      n0: {distance: 0, prev: null},
      n1: {distance: 2, prev: "n0"},
      n2: {distance: 6, prev: "n0"},
      n3: {distance: 5, prev: "n1"},
      n4: {distance: 7, prev: "n3"},
      n5: {distance: 8, prev: "n4"},
      n6: {distance: 9, prev: "n5"},
      n7: {distance: 10, prev: "n6"}
  },
  graph2_2Sol = {
      n0: {distance: 7, prev: 'n1'},
      n1: {distance: 5, prev: "n3"},
      n2: {distance: 3, prev: "n3"},
      n3: {distance: 2, prev: "n4"},
      n4: {distance: 0, prev: null},
      n5: {distance: 1, prev: "n4"},
      n6: {distance: 2, prev: "n5"},
      n7: {distance: 3, prev: "n6"}
  },
  graph2_3Sol = {
      n0: {distance: 10, prev: 'n1'},
      n1: {distance: 8, prev: "n3"},
      n2: {distance: 6, prev: "n3"},
      n3: {distance: 5, prev: "n4"},
      n4: {distance: 3, prev: "n5"},
      n5: {distance: 2, prev: "n6"},
      n6: {distance: 1, prev: "n7"},
      n7: {distance: 0, prev: null}
  };
        


  var node1 = {id: 'n0', label: 'Node 0', myNodeAttr: 123};
  node2_1 = {id: 'n0', label: 'Node 0'},
  node2_2 = {id: 'n4', label: 'Node 4'},
  node2_3 = {id: 'n7', label: 'Node 7'};

  // Initialize the graph:
  var myGraph1 = new sigma.classes.graph(),
  myGraph2 = new sigma.classes.graph();
  myGraph1.read(graph1);
  myGraph2.read(graph2);
  
  deepEqual(
    myGraph1.dijkstraOpt(node1),
    graph1Sol,
    '"dijkstraOpt" returns the distance between each node and an entry node on a 5-node graph'
  );

  deepEqual(
    myGraph2.dijkstraOpt(node2_1),
    graph2_1Sol,
    '"dijkstraOpt" returns the correct distances on a 10-node graph (first entry node)'
  );

  myGraph2 = new sigma.classes.graph();
  myGraph2.read(graph2);
  deepEqual(
    myGraph2.dijkstraOpt(node2_2),
    graph2_2Sol,
    '"dijkstraOpt" returns the correct distances on a 10-node graph (second entry node)'
  );
   myGraph2 = new sigma.classes.graph();
  myGraph2.read(graph2);
  deepEqual(
    myGraph2.dijkstraOpt(node2_3),
    graph2_3Sol,
    '"dijkstraOpt" returns the correct distances on a 10-node graph (third entry node)'
  );


});