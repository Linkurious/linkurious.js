module('sigma.algorithms.dijkstra');

test('Basic manipulation', function() {

var graph = {
        nodes: [
          {
            id: 'n0',
            label: 'Node 0',
            myNodeAttr: 123
          },
          {
            id: 'n1',
            label: 'Node 1'
          },
          {
            id: 'n2',
            label: 'Node 2'
          },
          {
            id: 'n3',
            label: 'Node 3'
          },
          {
            id: 'n4',
            label: 'Node 4'
          },

        ],
        edges: [
          {
            id: 'e0',
            source: 'n0',
            target: 'n1'
          },
          {
            id: 'e1',
            source: 'n0',
            target: 'n2'
          },
          {
            id: 'e2',
            source: 'n1',
            target: 'n4'
          },
          {
            id: 'e3',
            source: 'n2',
            target: 'n3'
          },
          {
            id: 'e4',
            source: 'n3',
            target: 'n4'
          }
        ]
      };


var node = {id: 'n0',
            label: 'Node 0',
            myNodeAttr: 123}

// Initialize the graph:
  var myGraph = new sigma.classes.graph();
  myGraph.read(graph);

myGraph.dijkstraOpt(node);

});