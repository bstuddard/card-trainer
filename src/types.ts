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

// ----- Scenarios (GTO spots) -----------------------------------------------

export interface ShowdownPuzzle {
  id: string
  title: string
  street: 'turn' | 'river'
  board: string[] // e.g. ["Kh","8d","3c","6s","2h"]
  heroHand: string[] // e.g. ["Ac","Kc"]
  pot: number
  bet: number
  situation: string
  actions: string[]
  correct: string
  math: {
    requiredEquityPct: number
    yourEquityPct: number
    reasoning: string
  }
  explanation: string
  /** GTO analysis — bluff ratios, concept label, key insight for this spot. */
  gto: {
    villainValuePct: number   // % of villain's range that beats hero
    villainBluffPct: number   // % that hero beats (should sum to 100 with above)
    conceptTag: string        // short category pill label
    keyInsight: string        // one key GTO lesson from this spot
  }
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
