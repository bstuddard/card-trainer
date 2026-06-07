// ---------------------------------------------------------------------------
// Pure helpers over the generated strength table. No Vue here — easy to test.
// ---------------------------------------------------------------------------
import ranking from '../data/handRanking.json'
import type { Card, RankedHand } from '../types'

export const RANKED: RankedHand[] = ranking.hands as RankedHand[]

const BY_NAME = new Map(RANKED.map((h) => [h.hand, h]))

export function lookup(hand: string): RankedHand | undefined {
  return BY_NAME.get(hand)
}

// A combo-weighted pool: pairs appear 6x, suited 4x, offsuit 12x, so a random
// draw matches the true frequency a hand is actually dealt.
const POOL: RankedHand[] = RANKED.flatMap((h) => Array<RankedHand>(h.combos).fill(h))

export function randomHand(): RankedHand {
  return POOL[Math.floor(Math.random() * POOL.length)]
}

const RANK_CHARS = '23456789TJQKA'
const SUITS: Card['suit'][] = ['♠', '♥', '♦', '♣']

function charToRank(ch: string): number {
  return RANK_CHARS.indexOf(ch) + 2
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Concrete, legal hole cards (random suits) for displaying a canonical hand. */
export function dealCards(h: RankedHand): [Card, Card] {
  const r1 = charToRank(h.hand[0])
  const r2 = charToRank(h.hand[1])
  if (h.type === 'pair') {
    const [s1, s2] = shuffle(SUITS).slice(0, 2)
    return [
      { rank: r1, suit: s1 },
      { rank: r2, suit: s2 },
    ]
  }
  if (h.type === 'suited') {
    const s = pick(SUITS)
    return [
      { rank: r1, suit: s },
      { rank: r2, suit: s },
    ]
  }
  const [s1, s2] = shuffle(SUITS).slice(0, 2)
  return [
    { rank: r1, suit: s1 },
    { rank: r2, suit: s2 },
  ]
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function rankLabel(rank: number): string {
  return RANK_CHARS[rank - 2]
}

/** Human-readable hand name, e.g. "A♠K♠ — suited" for feedback context. */
export function describeType(type: RankedHand['type']): string {
  if (type === 'pair') return 'pocket pair'
  if (type === 'suited') return 'suited'
  return 'offsuit'
}
