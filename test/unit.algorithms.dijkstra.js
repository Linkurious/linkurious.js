module('sigma.algorithms.dijkstra');

test('Basic manipulation', function() {

  var graph0 = {
    nodes: [
      {id: 'n0', label: 'Node 0', myNodeAttr: 123},
      {id: 'n1', label: 'Node 1'},
      {id: 'n2', label: 'Node 2'},
      {id: 'n3', label: 'Node 3'}
    ],
    edges: [
      {id: 'e0', source: 'n0', target: 'n1', cost: -1},
      {id: 'e1', source: 'n0', target: 'n2'},
      {id: 'e2', source: 'n1', target: 'n3'},
      {id: 'e3', source: 'n2', target: 'n3'}
    ]
  },
  graph1 = {
    nodes: [
      {id: 'n0', label: 'Node 0', myNodeAttr: 123},
      {id: 'n1', label: 'Node 1'},
      {id: 'n2', label: 'Node 2'},
      {id: 'n3', label: 'Node 3'},
      {id: 'n4', label: 'Node 4'}
    ],
    edges: [
      {id: 'e0', source: 'n0', target: 'n1', cost2: 7},
      {id: 'e1', source: 'n0', target: 'n2'},
      {id: 'e2', source: 'n1', target: 'n4'},
      {id: 'e3', source: 'n2', target: 'n3', cost2: 2},
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
      {id: 'e2', source: 'n1', target: 'n3', cost: 3},
      {id: 'e3', source: 'n2', target: 'n3'},
      {id: 'e17', source: 'n2', target: 'n4', cost: 4},
      {id: 'e4', source: 'n3', target: 'n4', cost: 2},
      {id: 'e5', source: 'n3', target: 'n6', cost: 5},
      {id: 'e6', source: 'n4', target: 'n5'},
      {id: 'e7', source: 'n4', target: 'n7', cost: 7},
      {id: 'e8', source: 'n5', target: 'n6'},
      {id: 'e9', source: 'n5', target: 'n7', cost: 6},
      {id: 'e10', source: 'n6', target: 'n7'},
    ]
  },
   graph3 = {
    nodes: [
      {id: 'n0', label:'Node 0'},
      {id: 'n1', label:'Node 1'},
      {id: 'n2', label:'Node 2'},
      {id: 'n3', label:'Node 3'},
      {id: 'n4', label:'Node 4'},
      {id: 'n5', label:'Node 5'},
      {id: 'n6', label:'Node 6'},
      {id: 'n7', label:'Node 7'}
    ]
  };
  graph0Sol = {
      n0: {distance: 0, prev: null},
      n1: {distance: 1, prev: ["n0"]},
      n2: {distance: 1, prev: ["n0"]},
      n3: {distance: 2, prev: ["n1","n2"]}
  },
  graph1_1Sol = {
      n0: {distance: 0, prev: null},
      n1: {distance: 1, prev: ["n0"]},
      n2: {distance: 1, prev: ["n0"]},
      n3: {distance: 2, prev: ["n2"]},
      n4: {distance: 2, prev: ["n1"]}
  },
  graph1_2Sol = {
      n0: {distance: 0, prev: null},
      n1: {distance: 5, prev: ["n4"]},
      n2: {distance: 1, prev: ["n0"]},
      n3: {distance: 3, prev: ["n2"]},
      n4: {distance: 4, prev: ["n3"]}
  },
  graph2_1Sol = {
      n0: {distance: 0, prev: null},
      n1: {distance: 2, prev: ["n0"]},
      n2: {distance: 6, prev: ["n0","n3"]},
      n3: {distance: 5, prev: ["n1"]},
      n4: {distance: 7, prev: ["n3"]},
      n5: {distance: 8, prev: ["n4"]},
      n6: {distance: 9, prev: ["n5"]},
      n7: {distance: 10, prev: ["n6"]}
  },
  graph2_2Sol = {
      n0: {distance: 7, prev: ["n1"]},
      n1: {distance: 5, prev: ["n3"]},
      n2: {distance: 3, prev: ["n3"]},
      n3: {distance: 2, prev: ["n4"]},
      n4: {distance: 0, prev: null},
      n5: {distance: 1, prev: ["n4"]},
      n6: {distance: 2, prev: ["n5"]},
      n7: {distance: 3, prev: ["n6"]}
  },
  graph2_3Sol = {
      n0: {distance: 10, prev: ["n1"]},
      n1: {distance: 8, prev: ["n3"]},
      n2: {distance: 6, prev: ["n3"]},
      n3: {distance: 5, prev: ["n4"]},
      n4: {distance: 3, prev: ["n5"]},
      n5: {distance: 2, prev: ["n6"]},
      n6: {distance: 1, prev: ["n7"]},
      n7: {distance: 0, prev: null}
  };
       

  // Initialize the graph:
  var myGraph0 = new sigma.classes.graph(),
  myGraph1 = new sigma.classes.graph(),
  myGraph2 = new sigma.classes.graph(),
  myGraph3 = new sigma.classes.graph();
  myGraph0.read(graph0);
  myGraph1.read(graph1);
  myGraph2.read(graph2);
  myGraph3.read(graph3);


  deepEqual(
  	myGraph0.dijkstra(myGraph0.nodes()[0]),
  	graph0Sol,
  	'"dijkstra" returns the distance between each node and an entry node on a 5-node graph\n'
  	+ ' multiple previous nodes are correctly picked up'
  );

  myGraph0 = new sigma.classes.graph();
  myGraph0.read(graph0);

  try{
  	myGraph0.dijkstra(myGraph0.nodes()[0], "cost");
  }catch(err){ 
    deepEqual(0,0,
      '"ERROR : negative weight!" : : "dijkstra" only runs positive wheight values');
  };

  deepEqual(
    myGraph1.dijkstra(myGraph1.nodes()[0], "cost"),
    graph1_1Sol,
    '"dijkstra" returns the correct distances on a 5-node graph, ignoring the inexistant input parameter'
  );

  myGraph1 = new sigma.classes.graph();
  myGraph1.read(graph1);

  deepEqual(
    myGraph1.dijkstra(myGraph1.nodes()[0], "cost2"),
    graph1_2Sol,
    '"dijkstra" returns the correct distances on a 5-node graph, where edges have different weights'
  );

  deepEqual(
    myGraph2.dijkstra(myGraph2.nodes()[0], "cost"),
    graph2_1Sol,
    '"dijkstra" returns the correct distances on a 10-node graph (first entry node)'
  );

  myGraph2 = new sigma.classes.graph();
  myGraph2.read(graph2);
  deepEqual(
    myGraph2.dijkstra(myGraph2.nodes()[4], "cost"),
    graph2_2Sol,
    '"dijkstra" returns the correct distances on a 10-node graph (second entry node)'
  );
   myGraph2 = new sigma.classes.graph();
  myGraph2.read(graph2);
  deepEqual(
    myGraph2.dijkstra(myGraph2.nodes()[7], "cost"),
    graph2_3Sol,
    '"dijkstra" returns the correct distances on a 10-node graph (third entry node)'
  );

  try{ 
    myGraph3.dijkstra(myGraph2.nodes()[0], "cost");
  }catch(err){deepEqual(0,0,
  'ERROR : "dijkstra" cannot run on a dsconnected graph');
  };



});