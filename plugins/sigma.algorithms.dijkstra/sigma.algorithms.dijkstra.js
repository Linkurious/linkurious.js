;(function(){
	'use strict';

	if (typeof sigma === 'undefined')
	    throw 'sigma is not declared';

//Dijkstra Algorithm
/*  FOR NON DIRECTED GRAPHS ONLY
*	Calculates the minimal distance from a node to every other node in a graph
*	@param {object}  node  		the "origin" node used to compute distances 
*	@param {string}  weight		OPTIONAL : allows to compute distances taking weights into consideration
*								If the WEIGHT parameter is specified, the edges' property matching WEIGHT's value will be parsed by dijkstra. 
*								Otherwise dijkstra will see all edges with a weight value of "1"
*	@return {object} nodes		keys are node ids and values are objects containing the optimized distance from the "zero" node and the previous node
*								ex: {n1: {distance:"0", previous: null}, n2: {distance :"3", previous: "n1"}, ...} 
*/

	if(!sigma.classes.graph.hasMethod('dijkstra')){
		sigma.classes.graph.addMethod('dijkstra', function(node, weight){

			if (weight === undefined) weight = null;
			var uncheckedNodes = this.nodesIndex,
				N = this.nodesArray.length, // total number of nodes
				k = N, // number of unvisited nodes
				edges = this.edgesIndex,
				neighbors = {},
				lastNeighbors = {},
				origin = node,
				key,
				previous,
				Opt = {},
				evalDistance = function(edge){
					if (weight == null){return 1;}
					else if(edge[weight] < 0) {throw "ERROR : Negative weight !";}
					// if(edge[weight] >= 0)
					return edge[weight] || 1;
					
				},
				nodeQueue = new PriorityQueue({strategy: PriorityQueue.ArrayStrategy, comparator: function(a, b) {
					if(a.distance && b.distance){return a.distance - b.distance;}
					throw "objects are not marked nodes";
				}});
				
				

			nodeQueue.update = function(myDistanceNode){
					if (this.length == 0){
						this.queue(myDistanceNode);
					}
					else if (!myDistanceNode.distance || !myDistanceNode.id){
						throw "invalid parameters error";
					}else{
						var s = [];
						var temp = this.dequeue();
						
				

						while ((myDistanceNode.id != temp.id)&& (this.length > 0)){
							s.push(temp);
							
							temp = this.dequeue();
						}

						if(myDistanceNode.id == temp.id){
							temp.distance = myDistanceNode.distance;
						}else{
							this.queue(myDistanceNode);
						}
						

						while(s.length > 0){

							this.queue(temp);
						
							temp = s.pop();
						}
							this.queue(temp);
							
							return null;
					}
			};

			
			origin.dijkstraData = {distance: 0, prev: null};
			delete uncheckedNodes[origin.id];

		
			for(var j in uncheckedNodes){
				uncheckedNodes[j].dijkstraData = {distance : Number.POSITIVE_INFINITY, prev: null};
			}
			

			var u = origin,	
				v = {},
				tempDistance,
				myDistanceNode = {};
				//minDist;

			

			//Algorithm starts here
			// ....
			// ....
			// ....
			// ....

			while (k > 0){
				
				 
				key = u.id;
				delete uncheckedNodes[key];

				Opt[key] = u.dijkstraData;
				neighbors = this.allNeighborsIndex[key];
				
				
				for (var i in neighbors){
					
					if (uncheckedNodes[i]){
					
					
					v = uncheckedNodes[i];	

		
					try{tempDistance = u.dijkstraData.distance + evalDistance(neighbors[i][Object.keys(neighbors[i])[0]]);}
					catch(err){throw(err);}
					if (tempDistance < v.dijkstraData.distance){
						v.dijkstraData.distance = tempDistance;
					
						v.dijkstraData.prev = [u.id];
					}else if(tempDistance == v.dijkstraData.distance){
						v.dijkstraData.prev.push(u.id);
					}
					uncheckedNodes[i] = v;
					myDistanceNode = {id: v.id, distance: v.dijkstraData.distance};
					nodeQueue.update(myDistanceNode);
					
					}
				}
				

				if (k>1) {
					
					try{ myDistanceNode = nodeQueue.dequeue();
					}catch(err){
						throw(err);
					}

					u = uncheckedNodes[myDistanceNode.id]; 
					
				}
				
				lastNeighbors = neighbors;
				k--;//decrease counter
			}

			return Opt;
		});
	}

}).call(this);