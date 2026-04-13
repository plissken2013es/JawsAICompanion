import { describe, it, expect } from 'vitest'
import { JawsGraph, JawsConnections } from '~/consts/Graph'

const EXPECTED_ZONES = ['1', '2', '3', '4', '5', '6', '7', '8', 'N', 'S', 'E', 'W']

describe('Graph integrity', () => {
    it('has exactly 12 zones in JawsGraph', () => {
        expect(Object.keys(JawsGraph)).toHaveLength(12)
    })

    it('has exactly 12 zones in JawsConnections', () => {
        expect(Object.keys(JawsConnections)).toHaveLength(12)
    })

    it('JawsGraph contains all expected zone keys', () => {
        EXPECTED_ZONES.forEach(zone => {
            expect(JawsGraph).toHaveProperty(zone)
        })
    })

    it('JawsConnections contains all expected zone keys', () => {
        EXPECTED_ZONES.forEach(zone => {
            expect(JawsConnections).toHaveProperty(zone)
        })
    })

    it('JawsGraph is symmetric — if A connects to B then B connects to A', () => {
        for (const nodeA in JawsGraph) {
            for (const nodeB in JawsGraph[nodeA]) {
                expect(JawsGraph[nodeB]).toHaveProperty(nodeA),
                `expected ${nodeB} → ${nodeA} to exist because ${nodeA} → ${nodeB} does`
            }
        }
    })

    it('all JawsGraph edge weights are 1', () => {
        for (const node in JawsGraph) {
            for (const neighbor in JawsGraph[node]) {
                expect(JawsGraph[node][neighbor]).toBe(1)
            }
        }
    })

    it('JawsConnections and JawsGraph agree on neighbors', () => {
        for (const node in JawsConnections) {
            const connNeighbors = JawsConnections[node].map(String).sort()
            const graphNeighbors = Object.keys(JawsGraph[node]).sort()
            expect(connNeighbors).toEqual(graphNeighbors)
        }
    })
})
