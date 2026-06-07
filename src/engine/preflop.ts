// ---------------------------------------------------------------------------
// Preflop lanes + spot generation + grading. Pure functions.
//
// Strength model: a hand is ranked by its all-in equity versus a random hand
// (see scripts/computeRanking.mjs). "Open the top X%" means open every hand
// whose percentileStart < X. This is an approximation of real opening ranges
// (it ignores postflop playability, which nudges suited connectors up a touch)
// but it is mathematically grounded and right for a beginner/intermediate drill.
// ---------------------------------------------------------------------------
import type { Lane, PreflopAction, PreflopSpot } from '../types'
import { dealCards, randomHand } from './hands'

export const LANES: Lane[] = [
  {
    id: 'steal',
    label: 'Steal seat',
    seatLabel: 'Button / Small Blind',
    blurb: 'Late position, few players left — open wide and apply pressure.',
    thresholdPct: 45,
  },
  {
    id: 'mid',
    label: 'Middle seat',
    seatLabel: 'Middle position',
    blurb: 'Players still behind you — open tight, fold the marginal stuff.',
    thresholdPct: 20,
  },
]

export function laneById(id: Lane['id']): Lane {
  return LANES.find((l) => l.id === id) ?? LANES[0]
}

// Concrete seat shown for a spot (the steal lane randomly shows BTN or SB).
function seatFor(lane: Lane): string {
  if (lane.id === 'steal') return Math.random() < 0.5 ? 'Button' : 'Small Blind'
  return 'Middle position'
}

export function generateSpot(lane: Lane): PreflopSpot {
  const hand = randomHand()
  return {
    lane,
    seat: seatFor(lane),
    hand,
    cards: dealCards(hand),
  }
}

/** The textbook-correct action for a spot. */
export function correctAction(spot: PreflopSpot): PreflopAction {
  return spot.hand.percentileStart < spot.lane.thresholdPct ? 'Open' : 'Fold'
}

/** 0 (a coin-flip-close spot) .. 1 (a trivially clear spot). */
export function clarity(spot: PreflopSpot): number {
  const dist = Math.abs(spot.hand.percentileStart - spot.lane.thresholdPct)
  return Math.min(1, dist / 25)
}

export interface PreflopFeedback {
  correct: boolean
  answer: PreflopAction
  thresholdPct: number
  handPercentile: number
  /** "AKs sits in the top 3% — well inside a top-45% opening range." */
  explanation: string
}

export function gradePreflop(spot: PreflopSpot, chosen: PreflopAction): PreflopFeedback {
  const answer = correctAction(spot)
  const p = spot.hand.percentileStart
  const t = spot.lane.thresholdPct
  const inside = p < t
  const margin = Math.abs(p - t).toFixed(0)

  const where =
    `${spot.hand.hand} sits in the top ${p.toFixed(0)}% of all hands. ` +
    `From the ${spot.seat.toLowerCase()} you open the top ~${t}%, ` +
    (inside
      ? `so this is comfortably an open (${margin}% inside the line).`
      : `so this folds (${margin}% past the line).`)

  return {
    correct: chosen === answer,
    answer,
    thresholdPct: t,
    handPercentile: p,
    explanation: where,
  }
}
