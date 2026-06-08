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
    id: 'utg',
    label: 'UTG',
    seatLabel: 'Under the Gun',
    blurb: 'First to act — 6 players behind. Only open premium hands.',
    thresholdPct: 14,
  },
  {
    id: 'hj',
    label: 'HJ',
    seatLabel: 'Hijack',
    blurb: 'Three players behind. Widen slightly from UTG but stay selective.',
    thresholdPct: 20,
  },
  {
    id: 'co',
    label: 'CO',
    seatLabel: 'Cutoff',
    blurb: 'Two players behind. Good position — open a fairly wide range.',
    thresholdPct: 28,
  },
  {
    id: 'btn',
    label: 'BTN',
    seatLabel: 'Button',
    blurb: 'Last to act postflop — the best seat. Steal wide and apply pressure.',
    thresholdPct: 45,
  },
  {
    id: 'sb',
    label: 'SB',
    seatLabel: 'Small Blind',
    blurb: 'Posted half the blind. Open reasonably wide but play out of position.',
    thresholdPct: 35,
  },
]

export function generateSpot(): PreflopSpot {
  const lane = LANES[Math.floor(Math.random() * LANES.length)]
  const hand = randomHand()
  return { lane, hand, cards: dealCards(hand) }
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
    `From the ${spot.lane.seatLabel} you open the top ~${t}%, ` +
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
