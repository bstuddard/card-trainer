import type { Card } from '../types'

const SUIT_NAMES: Record<string, string> = {
  '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs',
}

function rankStr(r: number): string {
  const m: Record<number, string> = { 1: 'A', 10: 'T', 11: 'J', 12: 'Q', 13: 'K', 14: 'A' }
  return m[r] ?? String(r)
}

export function shuffledDeck(): Card[] {
  const suits: Card['suit'][] = ['♠', '♥', '♦', '♣']
  const deck: Card[] = []
  for (const suit of suits)
    for (let rank = 2; rank <= 14; rank++) deck.push({ rank, suit })
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

export interface EquityAnalysis {
  handSummary: string
  outs: number
  equityPct: number
  rule: string
  outsDetail: string
  recommendation: string
}

export function analyzeHand(hero: Card[], board: Card[]): EquityAnalysis {
  if (hero.length < 2) return placeholder()

  const all = [...hero, ...board]
  const heroRanks = new Set(hero.map(c => c.rank))
  const heroSuits = new Set(hero.map(c => c.suit))

  const suitTotals: Record<string, number> = {}
  const rankTotals: Record<number, number> = {}
  for (const c of all) {
    suitTotals[c.suit] = (suitTotals[c.suit] || 0) + 1
    rankTotals[c.rank] = (rankTotals[c.rank] || 0) + 1
  }

  // ---- Made hands (strongest first) ----

  const quadsRank = Object.entries(rankTotals)
    .find(([r, n]) => n >= 4 && heroRanks.has(+r))
  if (quadsRank) return madeHand('four of a kind',
    `Your ${rankStr(+quadsRank[0])}s give you four of a kind — essentially unbeatable.`,
    'Bet all streets for value. Slow-play only if opponent seems very strong.')

  const flushSuit = Object.entries(suitTotals)
    .find(([s, n]) => n >= 5 && heroSuits.has(s as Card['suit']))
  if (flushSuit) return madeHand('made flush',
    `You have a ${SUIT_NAMES[flushSuit[0]]} flush. Only a full house or quads beats it.`,
    'Bet for value. Exercise caution if the board pairs on a later street.')

  const tripRank = Object.entries(rankTotals)
    .find(([r, n]) => n >= 3 && heroRanks.has(+r))
  const pairsWithHero = Object.entries(rankTotals)
    .filter(([r, n]) => n >= 2 && heroRanks.has(+r))
  if (tripRank && pairsWithHero.length >= 2) return madeHand('full house',
    'You have a full house — only quads or a higher full house beats you.',
    'Bet every street for value.')

  if (tripRank) return madeHand('three of a kind',
    `You have three ${rankStr(+tripRank[0])}s. Dominant against any pair or draw.`,
    'Bet for value. Watch for straights and flushes on connected/wet boards.')

  // Made straight
  const allSorted = [...new Set(all.map(c => c.rank))].sort((a, b) => a - b)
  if (allSorted.includes(14)) allSorted.unshift(1)
  for (let i = 0; i <= allSorted.length - 5; i++) {
    let run = true
    for (let k = 1; k < 5; k++) {
      if (allSorted[i + k] - allSorted[i + k - 1] !== 1) { run = false; break }
    }
    if (run) {
      const runSet = new Set(allSorted.slice(i, i + 5))
      if (hero.some(c => runSet.has(c.rank) || (c.rank === 14 && runSet.has(1)))) {
        const hi = allSorted[i + 4]
        return madeHand(`${rankStr(hi)}-high straight`,
          'You have a made straight. Only a flush or better beats it.',
          'Bet for value. Two-suited boards deserve extra caution — flush beats a straight.')
      }
    }
  }

  if (pairsWithHero.length >= 2) return madeHand('two pair',
    'You have two pair. Beats all single-pair hands and draws.',
    'Bet for value. Be alert to the board completing straights or flushes.')

  if (pairsWithHero.length === 1) return madeHand('one pair',
    `One pair of ${rankStr(+pairsWithHero[0][0])}s. Decent, but beaten by two pair, sets, or completed draws.`,
    board.length <= 3
      ? 'Small value bet on dry boards; check-call or check-fold on wet boards.'
      : 'Check-call small bets; fold to large bets on dangerous boards.')

  // ---- Draws ----
  // Board lengths: 3 = flop (2 cards left), 4 = turn (1 card left), 5 = river (0 left)
  // Anything else (0, 1, 2) is pre-community — treat as no-board placeholder.
  if (board.length === 5) {
    return {
      outs: 0,
      equityPct: 0,
      rule: 'river',
      handSummary: 'no made hand',
      outsDetail: 'All 5 board cards are dealt — no cards left to come. Your draws missed.',
      recommendation: 'No made hand on the river. Check-fold to any significant bet unless you have a strong read that villain is over-bluffing.',
    }
  }
  if (board.length < 3) return placeholder()

  const cardsLeft = board.length === 3 ? 2 : 1  // flop = 2, turn = 1
  const ruleN = cardsLeft * 2                    // Rule of 4 on flop, Rule of 2 on turn

  // Flush draw: exactly 4 of one suit total, hero contributing at least one
  const fdSuit = Object.entries(suitTotals)
    .find(([s, n]) => n === 4 && heroSuits.has(s as Card['suit']))

  // Straight draws: scan all 5-card windows
  const uRanks = [...new Set(all.map(c => c.rank))].sort((a, b) => a - b)
  if (uRanks.includes(14)) uRanks.unshift(1)

  let oesdWindow: number[] | null = null
  let oesdLo: number | null = null
  let oesdHi: number | null = null
  let gutshotMissing: number | null = null

  for (let base = 2; base <= 10; base++) {
    const win = [base, base + 1, base + 2, base + 3, base + 4]
    const present = win.filter(r => uRanks.includes(r))
    if (present.length === 4) {
      const heroNeeded = hero.some(c =>
        present.includes(c.rank) || (c.rank === 14 && present.includes(1))
      )
      if (heroNeeded) {
        const missing = win.find(r => !present.includes(r))!
        if ((missing === base || missing === base + 4) && !oesdWindow) {
          oesdWindow = win
          // completing ranks: one below the present range, one above
          // when high end is missing: lo = win[0]-1, hi = win[4] (the missing card)
          // when low end is missing:  lo = win[0] (the missing card), hi = win[4]+1
          oesdLo = missing === base + 4 ? win[0] - 1 : win[0]
          oesdHi = missing === base + 4 ? win[4] : win[4] + 1
        } else if (!gutshotMissing) {
          gutshotMissing = missing
        }
      }
    }
  }

  // Overcards: hero cards above all board ranks (only meaningful without other draws)
  const maxBoard = board.length > 0 ? Math.max(...board.map(c => c.rank)) : 0
  const overcards = hero.filter(c => c.rank > maxBoard)

  let outs = 0
  const parts: string[] = []
  const completors: string[] = []

  if (fdSuit) {
    outs += 9
    parts.push('flush draw')
    completors.push(`any ${SUIT_NAMES[fdSuit[0]]} — 9 remaining in the deck`)
  }
  if (oesdWindow) {
    const sdOuts = fdSuit ? 6 : 8 // avoid double-counting cards completing both draws
    outs += sdOuts
    parts.push('open-ended straight draw')
    completors.push(`a ${rankStr(oesdLo!)} or ${rankStr(oesdHi!)} for the straight (${sdOuts} outs)`)
  } else if (gutshotMissing !== null) {
    outs += 4
    parts.push('gutshot straight draw')
    completors.push(`a ${rankStr(gutshotMissing)} to fill the gut (4 outs)`)
  }
  if (overcards.length > 0 && outs < 6) {
    const ocOuts = overcards.length * 3
    outs += ocOuts
    parts.push(`${overcards.length} overcard${overcards.length > 1 ? 's' : ''}`)
    completors.push(`pairing your ${overcards.map(c => rankStr(c.rank)).join(' or ')} on the board (${ocOuts} outs)`)
  }

  if (outs === 0) {
    const backdoorEquity = cardsLeft === 2 ? 18 : 8
    return {
      outs: 0, equityPct: backdoorEquity, rule: 'estimate',
      handSummary: 'no hand, no draw',
      outsDetail: cardsLeft === 2
        ? 'No pair and no direct draw. Equity comes from backdoor runner-runner draws only (~18%).'
        : 'No pair and no draw on the turn. Minimal equity — only a perfect river card saves you (~8%).',
      recommendation: 'Check and fold to any significant bet. Look for cheap calls only if stack sizes justify a bluff-catcher.',
    }
  }

  const equityPct = Math.min(outs * ruleN, 93)
  return {
    outs,
    equityPct,
    rule: `Rule of ${ruleN}`,
    handSummary: parts.join(' + '),
    outsDetail: `${parts.join(' + ')} — ${outs} total outs. Rule of ${ruleN}: ${outs} × ${ruleN} = ~${equityPct}% equity. Completing cards: ${completors.join('; ')}.`,
    recommendation: outs >= 15
      ? `Monster draw (~${equityPct}%): semi-bluff aggressively or raise. You have more equity than most made hands.`
      : outs >= 9
        ? `~${equityPct}% equity: call bets up to ~${equityPct}% of the pot. Semi-bluffing in position is profitable.`
        : outs >= 6
          ? `~${equityPct}% equity: call only at 4:1 pot odds or better. From UTG, lean toward folding without position.`
          : `Only ${outs} outs (~${equityPct}%): fold to most bets. UTG especially — you'll rarely get the right price.`,
  }
}

function madeHand(name: string, outsDetail: string, recommendation: string): EquityAnalysis {
  return { outs: 0, equityPct: 70, rule: 'made hand', handSummary: name, outsDetail, recommendation }
}

function placeholder(): EquityAnalysis {
  return { outs: 0, equityPct: 0, rule: '', handSummary: '', outsDetail: '', recommendation: '' }
}
