import { describe, it, expect, beforeEach } from 'vitest'
import DijkstraManager from '~/utils/DijkstraManager'
import { JawsGraph } from '~/consts/Graph'

beforeEach(() => {
    (DijkstraManager as any).instance = undefined
})

describe('DijkstraManager.findShortestPath', () => {
    it('returns distance 1 for directly adjacent zones', () => {
        const dm = DijkstraManager.getInstance()
        const graph = dm.buildWeightedJawsGraph({})
        const result = dm.findShortestPath(graph, '1', '2')
        expect(result.distance).toBe(1)
        expect(result.path).toEqual(['1', '2'])
    })

    it('returns distance 1 from zone 1 to beach N (direct connection)', () => {
        const dm = DijkstraManager.getInstance()
        const graph = dm.buildWeightedJawsGraph({})
        const result = dm.findShortestPath(graph, '1', 'N')
        expect(result.distance).toBe(1)
        expect(result.path).toEqual(['1', 'N'])
    })

    it('finds distance 3 from zone 1 to beach S', () => {
        const dm = DijkstraManager.getInstance()
        const graph = dm.buildWeightedJawsGraph({})
        const result = dm.findShortestPath(graph, '1', 'S')
        expect(result.distance).toBe(3)
        expect(result.path[0]).toBe('1')
        expect(result.path[result.path.length - 1]).toBe('S')
        expect(result.path).toHaveLength(4)
        // Only zone 4 connects directly to S from the 1-hop neighbours
        expect(result.path).toContain('4')
    })

    it('finds distance 4 from beach N to beach S', () => {
        const dm = DijkstraManager.getInstance()
        const graph = dm.buildWeightedJawsGraph({})
        const result = dm.findShortestPath(graph, 'N', 'S')
        expect(result.distance).toBe(4)
        expect(result.path[0]).toBe('N')
        expect(result.path[result.path.length - 1]).toBe('S')
    })

    it('finds distance 4 from beach E to beach W', () => {
        const dm = DijkstraManager.getInstance()
        const graph = dm.buildWeightedJawsGraph({})
        const result = dm.findShortestPath(graph, 'E', 'W')
        expect(result.distance).toBe(4)
    })

    it('start === end returns path of length 1 and string "Infinity" distance (known edge case)', () => {
        // The algorithm skips startNode as a child, so endNode distance is never updated
        const dm = DijkstraManager.getInstance()
        const graph = dm.buildWeightedJawsGraph({})
        const result = dm.findShortestPath(graph, 'N', 'N')
        expect(result.path).toEqual(['N'])
        expect(result.distance).toBe('Infinity')
    })
})

describe('DijkstraManager.filterNodesByDistance', () => {
    it('origin is always at index 0', () => {
        const dm = DijkstraManager.getInstance()
        const result = dm.filterNodesByDistance(3, JawsGraph, 'S')
        expect(result[0]).toEqual(['S'])
    })

    it('returns direct neighbours at distance 1 from zone 1', () => {
        const dm = DijkstraManager.getInstance()
        const result = dm.filterNodesByDistance(1, JawsGraph, '1')
        expect(result[1].map(String).sort()).toEqual(['2', '3', '5', 'N'].sort())
    })

    it('returns correct zones at distance 2 from zone 1', () => {
        const dm = DijkstraManager.getInstance()
        const result = dm.filterNodesByDistance(2, JawsGraph, '1')
        const dist2 = result[2].map(String).sort()
        // From 1's neighbours (2,3,5,N), their new neighbours not yet seen:
        // 2→4,6,E; 3→4,W,7; 5→W; N→6
        expect(dist2).toContain('4')
        expect(dist2).toContain('6')
        expect(dist2).toContain('E')
        expect(dist2).toContain('W')
        expect(dist2).toContain('7')
        // S and 8 are distance 3 — should NOT be in dist2
        expect(dist2).not.toContain('S')
        expect(dist2).not.toContain('8')
    })

    it('dist=4 from N covers all 12 zones', () => {
        const dm = DijkstraManager.getInstance()
        const result = dm.filterNodesByDistance(4, JawsGraph, 'N')
        const allFound = result.flat().map(String)
        const allZones = ['1','2','3','4','5','6','7','8','N','S','E','W']
        allZones.forEach(z => expect(allFound).toContain(z))
    })
})

describe('DijkstraManager.buildWeightedJawsGraph', () => {
    it('with no barrels, all edge weights are 1', () => {
        const dm = DijkstraManager.getInstance()
        const graph = dm.buildWeightedJawsGraph({})
        for (const node in graph) {
            for (const neighbor in graph[node]) {
                expect(graph[node][neighbor]).toBe(1)
            }
        }
    })

    it('barrel at zone 2 raises all edges leading to zone 2 by BARREL_WEIGHT (5)', () => {
        const dm = DijkstraManager.getInstance()
        const graph = dm.buildWeightedJawsGraph({ barrels: ['2'] })
        // zone 1 connects to zone 2
        expect(graph['1']['2']).toBe(6)
        // zone 4 connects to zone 2
        expect(graph['4']['2']).toBe(6)
        // edges NOT leading to zone 2 stay at 1
        expect(graph['1']['3']).toBe(1)
        expect(graph['1']['N']).toBe(1)
    })

    it('multiple barrels raise weights independently', () => {
        const dm = DijkstraManager.getInstance()
        const graph = dm.buildWeightedJawsGraph({ barrels: ['2', '4'] })
        expect(graph['1']['2']).toBe(6)
        expect(graph['3']['4']).toBe(6)
        expect(graph['1']['3']).toBe(1)
    })

    it('empty config object does not throw and returns weight-1 graph', () => {
        const dm = DijkstraManager.getInstance()
        expect(() => dm.buildWeightedJawsGraph({})).not.toThrow()
        const graph = dm.buildWeightedJawsGraph({})
        expect(graph['N']['1']).toBe(1)
    })

    it('null barrels field does not throw and returns weight-1 graph', () => {
        const dm = DijkstraManager.getInstance()
        expect(() => dm.buildWeightedJawsGraph({ barrels: null })).not.toThrow()
        const graph = dm.buildWeightedJawsGraph({ barrels: null })
        expect(graph['1']['2']).toBe(1)
    })

    it('result graph has all 12 zones as keys', () => {
        const dm = DijkstraManager.getInstance()
        const graph = dm.buildWeightedJawsGraph({})
        const expectedZones = ['1','2','3','4','5','6','7','8','N','S','E','W']
        expectedZones.forEach(z => expect(graph).toHaveProperty(z))
    })
})
