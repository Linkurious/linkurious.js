module('sigma.plugins.generators');

test('API', function(assert) {
  var sigmaGraph = new sigma.classes.graph();

  //////////////////////////
  //        RANDOM
  //////////////////////////

  var randomGraphSettings = {
    nbNodes: 10,
    nbEdges: 10
  };
  var randomGraph = sigma.plugins.generators.random(randomGraphSettings);

  sigmaGraph.read(randomGraph);

  equal(
    sigmaGraph.nodes().length,
    randomGraphSettings.nbNodes,
    '"generator.random()" generates a graph of a specified number of nodes.'
  );

  equal(
    sigmaGraph.edges().length,
    randomGraphSettings.nbEdges,
    '"generator.random()" generates a graph of a specified number of edges.'
  );

  throws(
    function() {
      sigma.plugins.generators.random();
    },
    /Missing argument: options/,
    '"generator.random()" throws an error on missing "options".'
  );

  throws(
    function() {
      sigma.plugins.generators.random(3);
    },
    /Invalid argument: options is not an object, was 3/,
    '"generator.random()" throws an error on invalid "options".'
  );

  throws(
    function() {
      sigma.plugins.generators.random({});
    },
    /Invalid argument: options.nbNodes is not a positive number, was undefined/,
    '"generator.random()" throws an error on invalid "options.nbNodes".'
  );

  throws(
    function() {
      sigma.plugins.generators.random({ nbNodes: -5 });
    },
    /Invalid argument: options.nbNodes is not a positive number, was -5/,
    '"generator.random()" throws an error on negative "options.nbNodes".'
  );

  sigmaGraph.clear();

  //////////////////////////
  //     BALANCED TREE
  //////////////////////////

  var balancedTreeSettings = {
    nbChildren: 2,
    height: 2
  };
  var balancedTree = sigma.plugins.generators.balancedTree(balancedTreeSettings);

  sigmaGraph.read(balancedTree);

  sigmaGraph.clear();


  //////////////////////////
  //     ERDOS-RENYI
  //////////////////////////

  var erdosRenyinMSettings = {
    nbNodes: 3,
    nbEdges: 3
  };
  var erdosRenyiGraphnM = sigma.plugins.generators.erdosRenyi(erdosRenyinMSettings);

  sigmaGraph.read(erdosRenyiGraphnM);

  equal(
    sigmaGraph.nodes().length,
    erdosRenyinMSettings.nbNodes,
    '"generator.erdosRenyi()" nM generates a graph of a specified number of nodes.'
  );

  sigmaGraph.clear();

  var erdosRenyinPSettings = {
    nbNodes: 3,
    p: 0.5
  };
  var erdosRenyiGraphnP = sigma.plugins.generators.erdosRenyi(erdosRenyinPSettings);

  sigmaGraph.read(erdosRenyiGraphnP);

  equal(
    sigmaGraph.nodes().length,
    erdosRenyinPSettings.nbNodes,
    '"generator.erdosRenyi()" nP generates a graph of a specified number of nodes.'
  );

  sigmaGraph.clear();


  //////////////////////////
  //   BARABASI-ALBERT
  //////////////////////////

  var baSettings = {
    nbNodes: 10,
    m0: 1,
    m: 1,
  };
  var barabasiAlbertGraph = sigma.plugins.generators.barabasiAlbert(baSettings);

  sigmaGraph.read(barabasiAlbertGraph);

  equal(
    sigmaGraph.nodes().length,
    baSettings.nbNodes,
    '"generator.barabasiAlbert()" generates a graph of a specified number of nodes.'
  );

  sigmaGraph.clear();

  //////////////////////////
  //    WATTS-STROGATZ
  //////////////////////////

  var wsAlphaSettings = {
    nbNodes: 10,
    k: 2,
    alpha: 1,
  };
  var wattsStrogatzAlphaGraph = sigma.plugins.generators.wattsStrogatz(wsAlphaSettings);

  sigmaGraph.read(wattsStrogatzAlphaGraph);

  equal(
    sigmaGraph.nodes().length,
    wsAlphaSettings.nbNodes,
    '"generator.wattsStrogatz()" alpha model generates a graph of a specified number of nodes.'
  );

  sigmaGraph.clear();

  var wsBetaSettings = {
    nbNodes: 10,
    k: 2,
    beta: 1,
  };
  var wattsStrogatzBetaGraph = sigma.plugins.generators.wattsStrogatz(wsBetaSettings);

  sigmaGraph.read(wattsStrogatzBetaGraph);

  equal(
    sigmaGraph.nodes().length,
    wsBetaSettings.nbNodes,
    '"generator.wattsStrogatz()" beta model generates a graph of a specified number of nodes.'
  );

  sigmaGraph.clear();

  //////////////////////////
  //        PATH
  //////////////////////////

  var nbNodes = 10;
  var path = sigma.plugins.generators.path(nbNodes);

  sigmaGraph.read(path);

  equal(
    sigmaGraph.nodes().length,
    nbNodes,
    '"generator.path()" generates a graph of a specified number of nodes.'
  );

  equal(
    sigmaGraph.edges().length,
    nbNodes - 1,
    '"generator.path()" generates a graph of the correct number of edges.'
  );

  sigmaGraph.clear();

  //////////////////////////
  //        GRID
  //////////////////////////

  var rows = 10;
  var columns = 10;
  var grid = sigma.plugins.generators.grid(rows, columns);

  sigmaGraph.read(grid);

  equal(
    sigmaGraph.nodes().length,
    rows * columns,
    '"generator.grid()" generates a graph of a correct number of nodes.'
  );

  equal(
    sigmaGraph.edges().length,
    (rows - 1) * columns + rows * (columns - 1),
    '"generator.grid()" generates a graph of the correct number of edges.'
  );

  sigmaGraph.clear();

});
