; (function(){
'use strict';

if (typeof sigma === 'undefined')
    throw 'sigma is not declared';

//Dijkstra Algorithm
/*  FOR NON DIRECTED GRAPHS ONLY
*	Calculates the minimal distance from a node to every other node in a graph
*	@param {object}  node  	the "zero" node distances are calculated from 
*	@return {object} nodes		keys are node ids and values are objects containing the optimized distance from the "zero" node and the previous node
*								ex: {n1: {distance:"0", previous: null}, n2: {distance :"3", previous: "n1"}, ...} 
*/

if(!sigma.classes.graph.hasMethod('dijkstraOpt'))
	sigma.classes.graph.addMethod('dijkstraOpt', function(node){

		// console.log("test0");
		// console.log(node); 
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
			evalDistance = function(edge){return edge.cost || 1;},
			nodeQueue = new PriorityQueue({strategy: PriorityQueue.ArrayStrategy, comparator: function(a, b) {
				if(a.distance && b.distance){
					console.log(a.distance - b.distance);
					return a.distance - b.distance;

				}else{
					throw "objects are not marked nodes";
					return null;
				}
			}});
			
			// inserter = function(myQueue, myDistance){ // allows to store vertices in the priority queue according to their distance
			// 	return 0;
			// };

		nodeQueue.update = function(myDistanceNode){
				if (this.length == 0){
					this.queue(myDistanceNode);
				}
				else if (!myDistanceNode.distance || !myDistanceNode.id){
					throw "invalid parameters error";
				}else{
					var s = [];
					var temp = this.dequeue();
					
					//console.log("check1");

					while ((myDistanceNode.id != temp.id)&& (this.length > 0)){
						s.push(temp);
						//console.log("checke");
						temp = this.dequeue();
					}

					if(myDistanceNode.id == temp.id){
						temp.distance = myDistanceNode.distance;
					}else{
						this.queue(myDistanceNode);
					}
					// console.log("check2");
					// console.log(temp);
					// console.log(this);

					while(s.length > 0){

						this.queue(temp);
						//console.log("checko");
						temp = s.pop();
					}
						this.queue(temp);
						//console.log("checkfinal");
						return null;
				}
		};

		
		origin.dijkstra = {distance: 0, prev: null};
		delete uncheckedNodes[origin.id];

		// console.log("test1");
		// console.log(Opt.typeof);
		for(var j in uncheckedNodes){
			uncheckedNodes[j].dijkstra = {distance : Number.POSITIVE_INFINITY, prev: null};
		}
		// console.log("test2");
		// var a = {id: 'n1', distance: 10},
		// 	b = {id: 'n2', distance: 3},
		// 	c = {id: 'n3', distance: 1},
		// 	d = {id: 'n6', distance: 16};
		// nodeQueue.queue(a);nodeQueue.queue(b);nodeQueue.queue(c);nodeQueue.queue(d);	
		// nodeQueue.update({id: 'n2', distance: 11});
		// console.log(nodeQueue.dequeue());
		

		var u = origin,	
			v = {},
			tempDistance,
			myDistanceNode = {};
			//minDist;

		console.log("test3");
		console.log(u.id); 

		while (k > 0){
			
			 
			key = u.id;
			delete uncheckedNodes[key];

			Opt[key] = u.dijkstra;
			neighbors = this.allNeighborsIndex[key];

			console.log("test4");
			console.log(neighbors);

			// neighbors = Object.keys(uncheckedNodes).filter(function(id){
			// 									return !!this.allNeighborsIndex[key][id] });
			//minDist = Number.POSITIVE_INFINITY; //minimal distance between u and its neighbors
			for (var i in neighbors){
				
				if (uncheckedNodes[i]){
				//delete neighbors[i];
				//}else{
				
				v = uncheckedNodes[i];	

				console.log("test5");
				console.log(Object.keys(neighbors[i])[0]); 

				tempDistance = u.dijkstra.distance + evalDistance(neighbors[i][Object.keys(neighbors[i])[0]]);
				if (tempDistance < v.dijkstra.distance){
					v.dijkstra.distance = tempDistance;
				//if (v.dijkstra.distance < minDist) minDist = v.dijkstra.distance;
					v.dijkstra.prev = u.id;
				}
				uncheckedNodes[i] = v;
				myDistanceNode = {id: v.id, distance: v.dijkstra.distance};
				nodeQueue.update(myDistanceNode);
				//neighbors[i] = v;
				}
			}
			

			if (k>1) {
				
				// console.log("test6");
				// console.log(nodeQueue);
				myDistanceNode = nodeQueue.dequeue();

				u = uncheckedNodes[myDistanceNode.id]; 
				//u = uncheckedNodes[Object.keys(uncheckedNodes).filter(function(id){return uncheckedNodes[id].dijkstra.distance <= minDist })[0]];
			}
			
			lastNeighbors = neighbors;
			k--;//decrease counter
		}
		console.log("test7");
		console.log(Opt);

		return Opt;
	});


}).call(this);