// Computes a strength ranking for all 169 starting hands by Monte-Carlo
// estimating each hand's all-in equity versus a single uniformly random hand
// (full 5-card board runout). The ordering this produces is the standard,
// defensible notion of preflop hand strength.
//
// Output: src/data/handRanking.json — hands sorted strongest -> weakest, each
// tagged with its equity, combo weight, and cumulative "percentile start"
// (the % of all 1326 combos that are STRONGER than it). A hand is "in range"
// for a given top-X% threshold exactly when percentileStart < X.
//
// Deterministic: a fixed PRNG seed means `npm run ranking` reproduces the
// same numbers every time, so the committed JSON is auditable.

import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const SAMPLES = 120_000 // runouts per hand; ~0.15% standard error on equity
const SEED = 0x9e3779b9

// --- seeded PRNG (mulberry32) ----------------------------------------------
function makeRng(seed) {
  let a = seed >>> 0
  return function rng() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rng = makeRng(SEED)

// --- cards ------------------------------------------------------------------
// A card is an int 0..51: rank = card >> 2 (0=2 .. 12=A), suit = card & 3.
function makeCard(rank, suit) {
  return (rank << 2) | suit
}

// --- 7-card evaluator -------------------------------------------------------
// Returns a single comparable integer; higher is a better hand.
function straightHigh(present) {
  // present: boolean[15] indexed by rank value 2..14, with 14 (ace) also
  // mirrored to 1 so the wheel (A-2-3-4-5) is detected.
  for (let high = 14; high >= 5; high--) {
    if (
      present[high] &&
      present[high - 1] &&
      present[high - 2] &&
      present[high - 3] &&
      present[high - 4]
    ) {
      return high
    }
  }
  return 0
}

function evaluate7(cards) {
  const rankCount = new Array(15).fill(0)
  const suitCount = [0, 0, 0, 0]
  const suitRanksMask = [0, 0, 0, 0] // bitmask of ranks present per suit

  for (let i = 0; i < 7; i++) {
    const c = cards[i]
    const r = (c >> 2) + 2 // 2..14
    const s = c & 3
    rankCount[r]++
    suitCount[s]++
    suitRanksMask[s] |= 1 << r
  }

  // Flush / straight flush
  let flushSuit = -1
  for (let s = 0; s < 4; s++) if (suitCount[s] >= 5) flushSuit = s

  if (flushSuit >= 0) {
    const mask = suitRanksMask[flushSuit]
    const present = new Array(15).fill(false)
    for (let r = 2; r <= 14; r++) if (mask & (1 << r)) present[r] = true
    if (present[14]) present[1] = true
    const sf = straightHigh(present)
    if (sf) return encode(8, [sf, 0, 0, 0, 0])
  }

  // Straight (any suit)
  const present = new Array(15).fill(false)
  for (let r = 2; r <= 14; r++) if (rankCount[r] > 0) present[r] = true
  if (present[14]) present[1] = true
  const straight = straightHigh(present)

  // Group ranks by count
  let quad = 0
  const trips = []
  const pairs = []
  const singles = []
  for (let r = 14; r >= 2; r--) {
    const c = rankCount[r]
    if (c === 4) quad = r
    else if (c === 3) trips.push(r)
    else if (c === 2) pairs.push(r)
    else if (c === 1) singles.push(r)
  }

  if (quad) {
    let kicker = 0
    for (let r = 14; r >= 2; r--) if (r !== quad && rankCount[r] > 0) { kicker = r; break }
    return encode(7, [quad, kicker, 0, 0, 0])
  }

  // Full house: trips + (another trips or a pair)
  if (trips.length >= 1 && (trips.length >= 2 || pairs.length >= 1)) {
    const tripRank = trips[0]
    const pairRank = trips.length >= 2 ? trips[1] : pairs[0]
    return encode(6, [tripRank, pairRank, 0, 0, 0])
  }

  if (flushSuit >= 0) {
    const top = []
    for (let r = 14; r >= 2 && top.length < 5; r--) if (suitRanksMask[flushSuit] & (1 << r)) top.push(r)
    return encode(5, top)
  }

  if (straight) return encode(4, [straight, 0, 0, 0, 0])

  if (trips.length >= 1) {
    const t = trips[0]
    const k = singles.filter((r) => r !== t).slice(0, 2)
    return encode(3, [t, k[0] || 0, k[1] || 0, 0, 0])
  }

  if (pairs.length >= 2) {
    const hi = pairs[0]
    const lo = pairs[1]
    let kicker = 0
    for (let r = 14; r >= 2; r--) if (r !== hi && r !== lo && rankCount[r] > 0) { kicker = r; break }
    return encode(2, [hi, lo, kicker, 0, 0])
  }

  if (pairs.length === 1) {
    const p = pairs[0]
    const k = singles.filter((r) => r !== p).slice(0, 3)
    return encode(1, [p, k[0] || 0, k[1] || 0, k[2] || 0, 0])
  }

  return encode(0, singles.slice(0, 5))
}

function encode(cat, tb) {
  // cat 0..8, each tiebreak rank 0..14 (<16). Packs into a safe integer.
  let s = cat
  for (let i = 0; i < 5; i++) s = s * 16 + (tb[i] || 0)
  return s
}

// --- the 169 hands ----------------------------------------------------------
const RANK_CHARS = '23456789TJQKA'
function rankChar(r) {
  return RANK_CHARS[r - 2]
}

// Representative hole cards + combo weight for each canonical hand.
function buildHands() {
  const hands = []
  for (let hi = 14; hi >= 2; hi--) {
    for (let lo = 14; lo >= 2; lo--) {
      if (lo > hi) continue
      if (hi === lo) {
        hands.push({
          hand: rankChar(hi) + rankChar(lo),
          type: 'pair',
          combos: 6,
          cards: [makeCard(hi - 2, 0), makeCard(lo - 2, 1)],
        })
      } else {
        // suited
        hands.push({
          hand: rankChar(hi) + rankChar(lo) + 's',
          type: 'suited',
          combos: 4,
          cards: [makeCard(hi - 2, 0), makeCard(lo - 2, 0)],
        })
        // offsuit
        hands.push({
          hand: rankChar(hi) + rankChar(lo) + 'o',
          type: 'offsuit',
          combos: 12,
          cards: [makeCard(hi - 2, 0), makeCard(lo - 2, 1)],
        })
      }
    }
  }
  return hands
}

// --- equity vs one random hand ---------------------------------------------
function equityVsRandom(hole) {
  const [h0, h1] = hole
  // Deck without the two hero cards.
  const deck = []
  for (let c = 0; c < 52; c++) if (c !== h0 && c !== h1) deck.push(c)
  const n = deck.length // 50

  let win = 0
  let tie = 0
  const draw = new Array(7)
  for (let s = 0; s < SAMPLES; s++) {
    // Partial Fisher-Yates: pick 7 distinct cards (2 opp + 5 board).
    for (let i = 0; i < 7; i++) {
      const j = i + Math.floor(rng() * (n - i))
      const tmp = deck[i]
      deck[i] = deck[j]
      deck[j] = tmp
      draw[i] = deck[i]
    }
    const board0 = draw[2], board1 = draw[3], board2 = draw[4], board3 = draw[5], board4 = draw[6]
    const heroScore = evaluate7([h0, h1, board0, board1, board2, board3, board4])
    const villScore = evaluate7([draw[0], draw[1], board0, board1, board2, board3, board4])
    if (heroScore > villScore) win++
    else if (heroScore === villScore) tie++
  }
  return (win + tie / 2) / SAMPLES
}

// --- run --------------------------------------------------------------------
console.log(`Computing equities for 169 hands @ ${SAMPLES.toLocaleString()} runouts each...`)
const t0 = Date.now()
const hands = buildHands()
for (const h of hands) {
  h.equity = equityVsRandom(h.cards)
}
hands.sort((a, b) => b.equity - a.equity)

// Cumulative combo-weighted percentile.
let cum = 0
const TOTAL_COMBOS = 1326
const out = hands.map((h) => {
  const percentileStart = (cum / TOTAL_COMBOS) * 100
  cum += h.combos
  return {
    hand: h.hand,
    type: h.type,
    combos: h.combos,
    equity: Math.round(h.equity * 10000) / 100, // % vs random, 2dp
    percentileStart: Math.round(percentileStart * 100) / 100,
  }
})

const here = dirname(fileURLToPath(import.meta.url))
const outDir = join(here, '..', 'src', 'data')
mkdirSync(outDir, { recursive: true })
const payload = {
  note: 'Generated by scripts/computeRanking.mjs — all-in equity vs a random hand. Do not hand-edit.',
  samples: SAMPLES,
  seed: SEED,
  totalCombos: TOTAL_COMBOS,
  hands: out,
}
writeFileSync(join(outDir, 'handRanking.json'), JSON.stringify(payload, null, 2) + '\n')

const secs = ((Date.now() - t0) / 1000).toFixed(1)
console.log(`Done in ${secs}s -> src/data/handRanking.json`)
console.log('Strongest 8:', out.slice(0, 8).map((h) => `${h.hand} ${h.equity}%`).join(', '))
console.log('Weakest 5:  ', out.slice(-5).map((h) => `${h.hand} ${h.equity}%`).join(', '))
