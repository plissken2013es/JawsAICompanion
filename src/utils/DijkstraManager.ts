import { JawsGraph, JawsConnections } from "~/consts/Graph"

const shortestDistanceNode = (distances, visited) => {
	let shortest: string | undefined = undefined

	for (const node in distances) {
		const currentIsShortest = shortest === undefined || distances[node] < distances[shortest]
		if (currentIsShortest && !visited.includes(node)) {
			shortest = node
		}
	}
	return shortest
}

const findShortestPath = (graph: any, startNode: string, endNode: string) => {
	// establish object for recording distances from the start node
	let distances = {};
	distances[endNode] = "Infinity";
	distances = Object.assign(distances, graph[startNode])

	// track paths
	const parents = { endNode: null }
	for (const child in graph[startNode]) {
		parents[child] = startNode
	}

	// track nodes that have already been visited
	const visited: string[] = []

	// find the nearest node
	let node = shortestDistanceNode(distances, visited)

	// for that node
	while (node) {
		// find its distance from the start node & its child nodes
		const distance = distances[node]
		const children = graph[node]
		// for each of those child nodes
		for (const child in children) {
			// make sure each child node is not the start node
			if (String(child) === String(startNode)) {
				continue
			} else {
				// save the distance from the start node to the child node
				const newdistance = distance + children[child];
				// if there's no recorded distance from the start node to the child node in the distances object
				// or if the recorded distance is shorter than the previously stored distance from the start node to the child node
				// save the distance to the object
				// record the path
				if (!distances[child] || distances[child] > newdistance) {
					distances[child] = newdistance;
					parents[child] = node;
				}
			}
		}
		// move the node to the visited set
		visited.push(node);
		// move to the nearest neighbor node
		node = shortestDistanceNode(distances, visited)
	}

	// using the stored paths from start node to end node
	// record the shortest path
	const shortestPath = [endNode]
	let parent = parents[endNode]
	while (parent) {
		shortestPath.push(parent)
		parent = parents[parent]
	}
	shortestPath.reverse()

	// return the shortest path from start node to end node & its distance
	const results = {
		distance: distances[endNode],
		path: shortestPath,
	}

	return results
}

const filterNodesByDistance = (dist: number, graph: any, origin: string) => {
    const results = [[origin]]
    results.length = dist

    for (const node in graph) {
        if (node === origin) continue
        const shortestPathToNode = findShortestPath(graph, origin, node)
        if (shortestPathToNode.distance <= dist) {
            if (!results[shortestPathToNode.distance]) {
                results[shortestPathToNode.distance] = []
            }
            results[shortestPathToNode.distance].push(node)
        }
    }
    return results
}



const BARREL_WEIGHT = 5
const QUINT_WEIGHT = 3

const buildWeightedJawsGraph = (cfg) => {
    let barrels: any[] = []
    if (cfg && cfg.barrels) {
        barrels = cfg.barrels
    }
    let quintHotZones: any[] = []
    const desiredDistanceToQuint = cfg.desiredDistanceToQuint || 2
    if (cfg.quint) {
        quintHotZones = filterNodesByDistance(desiredDistanceToQuint, JawsGraph, cfg.quint)
    }

    const graph = {}
    for (const node in JawsConnections) {
        const obj = {}
        JawsConnections[node].forEach((connection) => {
            const barrelWeight = (barrels.includes(String(connection)) ? BARREL_WEIGHT : 0)
            let quintWeight = 0
            quintHotZones.forEach((quintZone, index) => {
                if (quintZone.includes(String(connection))) {
                    quintWeight = QUINT_WEIGHT - index
                }
            })
            obj[connection] = 1 + barrelWeight + quintWeight
        })
        graph[node] = obj
    }
    return graph
}

export default class DijkstraManager {

    private static instance: DijkstraManager

    private constructor() { /* singleton */ }

    public static getInstance(): DijkstraManager {
        if (!DijkstraManager.instance) {
            DijkstraManager.instance = new DijkstraManager()
        }

        return DijkstraManager.instance
    }
    
    public buildWeightedJawsGraph(cfg) {
        return buildWeightedJawsGraph(cfg)
    }

    public filterNodesByDistance(dist: number, graph: any, origin: string) {
        return filterNodesByDistance(dist, graph, origin)
    }

    public findShortestPath(graph: any, startNode: string, endNode: string) {
        return findShortestPath(graph, startNode, endNode)
    }
}