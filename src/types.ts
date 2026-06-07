// ---------------------------------------------------------------------------
// Shared domain types. Acronyms are kept to a minimum on purpose — where a
// poker term is unavoidable it gets a plain-language label in `LANES` / the UI.
// ---------------------------------------------------------------------------

export type HandType = 'pair' | 'suited' | 'offsuit'

/** One row of the generated strength table (see scripts/computeRanking.mjs). */
export interface RankedHand {
  hand: string // canonical, e.g. "AKs", "T9o", "QQ"
  type: HandType
  combos: number // 6 (pair) / 4 (suited) / 12 (offsuit)
  equity: number // all-in equity % vs a random hand
  percentileStart: number // % of all combos that are STRONGER than this hand
}

/** A playing card for display. rank 2..14 (11=J,12=Q,13=K,14=A), suit symbol. */
export interface Card {
  rank: number
  suit: '♠' | '♥' | '♦' | '♣'
}

// ----- Preflop -------------------------------------------------------------

/** A reduced, "learn two not eight" opening lane. */
export interface Lane {
  id: 'steal' | 'mid'
  label: string // human label shown on the tab
  seatLabel: string // which seat(s) the spot represents
  blurb: string // one-line description of the lane's job
  /** Open the top X% of hands; fold the rest. */
  thresholdPct: number
}

export interface PreflopSpot {
  lane: Lane
  seat: string // concrete seat shown for this spot
  hand: RankedHand
  cards: [Card, Card]
}

export type PreflopAction = 'Open' | 'Fold'

// ----- Heads-up showdown puzzles -------------------------------------------

export interface ShowdownPuzzle {
  id: string
  title: string
  street: 'turn' | 'river'
  board: string[] // e.g. ["Kh","8d","3c","6s","2h"]
  heroHand: string[] // e.g. ["Ac","Kc"]
  /** Money already in the middle before villain's bet. */
  pot: number
  /** Size of the bet/shove hero faces. */
  bet: number
  situation: string // plain-language setup
  actions: string[] // allowed buttons, always includes "Fold"
  correct: string // the correct action
  /** The numbers behind the answer — all shown to the user. */
  math: {
    requiredEquityPct: number // pot odds: equity needed to call
    yourEquityPct: number // your hand's equity vs villain's assumed range
    reasoning: string // how the combos / outs were counted
  }
  explanation: string
}

// ----- Session (in-memory only; no persistence by design) -------------------

export interface LaneTally {
  correct: number
  total: number
}

export type Verdict = {
  correct: boolean
  chosen: string
  answer: string
}
