/**
 * npm run sim:act2 -- [--games 5000] [--level normal|easy|hard|all] [--seed 1] [--variant] [--swimmers b]
 *                      [--set key=value ...]   (override AI parameters, for tuning)
 * Plays simulated games and prints, per level: shark wins, rounds, stalls, ability use and the
 * wounds the shark took by source (BLUEPRINT P-20, SPECS §7 M3).
 */
import { runGame, GameReport } from './runGame'
import { AiParams, Level, LEVELS, paramsFor } from '../../src/act2/core/ai/params'

// Node globals, declared here so the strict Act II typecheck needs no @types/node.
declare const process: { argv: string[]; stdout: { write(s: string): void }; hrtime(t?: [number, number]): [number, number] }

interface Args { games: number; levels: Level[]; seed: number; variant: boolean; swimmers: number | null; set: Record<string, number> }

function parse(argv: readonly string[]): Args {
    const get = (name: string): string | undefined => {
        const i = argv.indexOf(`--${name}`)
        return i >= 0 ? argv[i + 1] : undefined
    }
    const level = get('level') || 'all'
    const set: Record<string, number> = {}
    argv.forEach((a, i) => {
        if (a !== '--set') return
        const [k, v] = argv[i + 1].split('=')
        set[k] = Number(v)
    })
    return {
        set,
        games: Number(get('games') || 5000),
        levels: level === 'all' ? LEVELS.slice() : [level as Level],
        seed: Number(get('seed') || 1),
        variant: argv.indexOf('--variant') >= 0,
        swimmers: get('swimmers') === undefined ? null : Number(get('swimmers')),
    }
}

const pct = (x: number, n: number): string => `${((100 * x) / n).toFixed(1)} %`

function summary(level: Level, reports: readonly GameReport[]): string {
    const n = reports.length
    const shark = reports.filter(r => r.winner === 'shark').length
    const none = reports.filter(r => r.winner === 'none').length
    const rounds = reports.map(r => r.rounds).sort((a, b) => a - b)
    const stallOk = reports.filter(r => r.maxStall <= 3).length
    const abilities: Record<string, number> = {}
    const wounds: Record<string, number> = {}
    for (const r of reports) {
        for (const k of Object.keys(r.abilitiesPlayed)) abilities[k] = (abilities[k] || 0) + (r.abilitiesPlayed as Record<string, number>)[k]
        for (const k of Object.keys(r.sharkWoundsBy)) wounds[k] = (wounds[k] || 0) + r.sharkWoundsBy[k]
    }
    const byShark = reports.filter(r => r.winner === 'shark')
    const boatWins = byShark.filter(r => Object.keys(r.state.tiles).every(z => (r.state.tiles as Record<string, string>)[z] === 'gone')).length
    const fmt = (o: Record<string, number>) => Object.keys(o).sort((a, b) => o[b] - o[a]).map(k => `${k} ${(o[k] / n).toFixed(2)}`).join(', ')
    return [
        `== ${level} (${n} partidas)`,
        `Tiburón gana ${pct(shark, n)} (por barco ${pct(boatWins, Math.max(1, shark))} de sus victorias) · sin final ${none}`,
        `Rondas: media ${(rounds.reduce((s, x) => s + x, 0) / n).toFixed(1)}, mediana ${rounds[Math.floor(n / 2)]}, p95 ${rounds[Math.floor(n * 0.95)]}`,
        `Bloqueo ≤ 3 rondas seguidas sin atacar: ${pct(stallOk, n)}`,
        `Habilidades por partida: ${fmt(abilities)}`,
        `Heridas al Tiburón por partida: ${fmt(wounds)}`,
    ].join('\n')
}

const args = parse(process.argv.slice(2))
for (const level of args.levels) {
    const reports: GameReport[] = []
    const t0 = process.hrtime()
    for (let i = 0; i < args.games; i++) {
        const shark: AiParams = Object.assign({}, paramsFor(level), args.set)
        reports.push(runGame(args.seed + i, { shark, variant: args.variant, swimmersEaten: args.swimmers }))
    }
    const [sec] = process.hrtime(t0)
    const tweaks = Object.keys(args.set).map(k => `${k}=${args.set[k]}`).join(' ')
    process.stdout.write(summary(level, reports) + `\n(${sec} s${tweaks ? ', ' + tweaks : ''})\n\n`)
}
