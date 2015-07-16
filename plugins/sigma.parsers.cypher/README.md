sigma.parsers.cypher
====================

Plugin developed by [Benoît Simard](https://github.com/sim51).

---

This plugin provides a simple function, `sigma.parsers.cypher()`, that will run a cypher query on a neo4j instance, parse the response, eventually instantiate sigma and fill the graph with the `graph.read()` method.

Nodes are created with the following structure :
 * id -> Neo4j node id
 * label -> Neo4j node id
 * neo4j_labels -> Labels of Neo4j node
 * neo4j_data -> All the properties of the neo4j node

Edges are created with the following structure :
 * id -> Neo4j edge id
 * label -> Neo4j edge type
 * neo4j_type -> Neo4j edge type
 * neo4j_data -> All the properties of Neo4j relationship

The most basic way to use this helper is to call it with a neo4j server url, a cypher query, and a sigma instance.

For neo4j < 2.2
````javascript
// Instantiate sigma:
var sigmaInstance = new sigma({
  graph: g,
  container: 'graph-container'
});

// Run Cypher query:
sigma.parsers.cypher(
  'http://localhost:7474',
  'MATCH (n) OPTIONAL MATCH (n)-[r]->(m) RETURN n,r,m LIMIT 100',
  sigmaInstance,
  function() {
    sigmaInstance.refresh();
  }
);
````

For neo4j >= 2.2, you must pass a neo4j user with its password. So instead of the neo4j url, you have to pass a neo4j server object like this :  
````javascript
// Instantiate sigma:
var sigmaInstance = new sigma({
  graph: g,
  container: 'graph-container'
});

// Run Cypher query:
sigma.parsers.cypher(
  { url: 'http://localhost:7474', user:'neo4j', password:'admin' },
  'MATCH (n) OPTIONAL MATCH (n)-[r]->(m) RETURN n,r,m LIMIT 100',
  sigmaInstance,
  function() {
    sigmaInstance.refresh();
  }
);
````

There is two additional functions provided by the plugin :

 * ```sigma.neo4j.getTypes({ url: 'http://localhost:7474', user:'neo4j', password:'admin' }, callback)``` : Return all relationship type of the database
 * ```sigma.neo4j.getLabels({ url: 'http://localhost:7474', user:'neo4j', password:'admin' }, callback)``` : Return all node label of the database 
