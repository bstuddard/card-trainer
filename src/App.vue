<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import PlayingCard from './components/PlayingCard.vue'
import RangeBar from './components/RangeBar.vue'
import showdownData from './data/showdowns.json'
import type { Card, PreflopAction, PreflopSpot, ShowdownPuzzle } from './types'
import {
  LANES,
  generateSpot,
  gradePreflop,
  laneById,
  type PreflopFeedback,
} from './engine/preflop'

type Mode = 'steal' | 'mid' | 'showdown'

const MODES: { id: Mode; label: string; sub: string }[] = [
  { id: 'steal', label: 'Steal seat', sub: 'Open wide' },
  { id: 'mid', label: 'Middle seat', sub: 'Open tight' },
  { id: 'showdown', label: 'Heads-up', sub: 'Turn / river' },
]

const mode = ref<Mode>('steal')

// --- session tally (in-memory only; resets on reload, by design) -----------
const tally = reactive<Record<Mode, { correct: number; total: number }>>({
  steal: { correct: 0, total: 0 },
  mid: { correct: 0, total: 0 },
  showdown: { correct: 0, total: 0 },
})
const currentTally = computed(() => tally[mode.value])

// --- preflop state ---------------------------------------------------------
const spot = ref<PreflopSpot>(generateSpot(laneById('steal')))
const preflopFb = ref<PreflopFeedback | null>(null)

function newPreflop() {
  const laneId = mode.value === 'mid' ? 'mid' : 'steal'
  spot.value = generateSpot(laneById(laneId))
  preflopFb.value = null
}

function answerPreflop(action: PreflopAction) {
  if (preflopFb.value) return
  const fb = gradePreflop(spot.value, action)
  preflopFb.value = fb
  tally[mode.value].total++
  if (fb.correct) tally[mode.value].correct++
}

// --- showdown state --------------------------------------------------------
const puzzles = showdownData.puzzles as ShowdownPuzzle[]
const puzzleIdx = ref(0)
const puzzle = computed(() => puzzles[puzzleIdx.value])
const showdownChoice = ref<string | null>(null)
const showdownCorrect = computed(
  () => showdownChoice.value !== null && showdownChoice.value === puzzle.value.correct,
)

function newShowdown() {
  let next = puzzleIdx.value
  if (puzzles.length > 1) {
    while (next === puzzleIdx.value) next = Math.floor(Math.random() * puzzles.length)
  }
  puzzleIdx.value = next
  showdownChoice.value = null
}

function answerShowdown(action: string) {
  if (showdownChoice.value) return
  showdownChoice.value = action
  tally.showdown.total++
  if (action === puzzle.value.correct) tally.showdown.correct++
}

// --- mode switching --------------------------------------------------------
function selectMode(m: Mode) {
  if (m === mode.value) return
  mode.value = m
  if (m === 'showdown') newShowdown()
  else newPreflop()
}

// --- card parsing for showdown strings like "Kh" ---------------------------
const SUIT_MAP: Record<string, Card['suit']> = { s: '♠', h: '♥', d: '♦', c: '♣' }
const RANK_MAP: Record<string, number> = {
  A: 14, K: 13, Q: 12, J: 11, T: 10,
  '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2,
}
function parseCard(s: string): Card {
  return { rank: RANK_MAP[s[0]], suit: SUIT_MAP[s[1]] }
}
const boardCards = computed(() => puzzle.value.board.map(parseCard))
const heroShowdownCards = computed(() => puzzle.value.heroHand.map(parseCard))

const lane = computed(() => spot.value.lane)
const accuracy = computed(() => {
  const t = currentTally.value
  return t.total ? Math.round((t.correct / t.total) * 100) : 0
})
</script>

<template>
  <div class="app">
    <header class="head">
      <h1 class="head__title">FELT</h1>
      <p class="head__sub">Preflop &amp; heads-up trainer</p>
    </header>

    <nav class="tabs" role="tablist">
      <button
        v-for="m in MODES"
        :key="m.id"
        class="tab"
        :class="{ 'tab--on': mode === m.id }"
        role="tab"
        :aria-selected="mode === m.id"
        @click="selectMode(m.id)"
      >
        <span class="tab__label">{{ m.label }}</span>
        <span class="tab__sub">{{ m.sub }}</span>
      </button>
    </nav>

    <div class="tally">
      <span class="tally__score">{{ currentTally.correct }} / {{ currentTally.total }}</span>
      <span class="tally__pct" v-if="currentTally.total">{{ accuracy }}% this session</span>
      <span class="tally__pct" v-else>start a hand below</span>
    </div>

    <!-- ============================ PREFLOP ============================ -->
    <main v-if="mode !== 'showdown'" class="board animate-fade-in" :key="mode + spot.hand.hand">
      <div class="seat">
        <span class="seat__name">{{ spot.seat }}</span>
        <span class="seat__ctx">{{ lane.blurb }}</span>
      </div>

      <div class="hole">
        <PlayingCard :card="spot.cards[0]" />
        <PlayingCard :card="spot.cards[1]" />
      </div>
      <div class="hole__name">{{ spot.hand.hand }}</div>

      <div class="prompt">It folds to you. Your move?</div>

      <div class="actions" v-if="!preflopFb">
        <button class="act act--fold" @click="answerPreflop('Fold')">Fold</button>
        <button class="act act--go" @click="answerPreflop('Open')">Open (raise)</button>
      </div>

      <div v-else class="fb animate-pop-in">
        <div class="fb__verdict" :class="preflopFb.correct ? 'fb__verdict--ok' : 'fb__verdict--no'">
          {{ preflopFb.correct ? '✓ Correct' : '✗ Not quite' }}
          <span class="fb__answer">— best play: {{ preflopFb.answer }}</span>
        </div>

        <RangeBar
          class="fb__bar"
          :threshold-pct="preflopFb.thresholdPct"
          :hand-percentile="preflopFb.handPercentile"
        />

        <p class="fb__text">{{ preflopFb.explanation }}</p>

        <button class="next" @click="newPreflop">Next hand →</button>
      </div>
    </main>

    <!-- ============================ SHOWDOWN =========================== -->
    <main v-else class="board animate-fade-in" :key="puzzle.id">
      <div class="seat">
        <span class="seat__name">{{ puzzle.title }}</span>
        <span class="seat__ctx">Heads-up · {{ puzzle.street }} · pot {{ puzzle.pot }}, facing {{ puzzle.bet }}</span>
      </div>

      <div class="community">
        <PlayingCard v-for="(c, i) in boardCards" :key="i" :card="c" size="sm" />
      </div>

      <div class="hole hole--sd">
        <PlayingCard :card="heroShowdownCards[0]" />
        <PlayingCard :card="heroShowdownCards[1]" />
      </div>

      <p class="prompt prompt--sd">{{ puzzle.situation }}</p>

      <div class="actions" v-if="!showdownChoice">
        <button
          v-for="a in puzzle.actions"
          :key="a"
          class="act"
          :class="a === 'Fold' ? 'act--fold' : 'act--go'"
          @click="answerShowdown(a)"
        >
          {{ a }}
        </button>
      </div>

      <div v-else class="fb animate-pop-in">
        <div class="fb__verdict" :class="showdownCorrect ? 'fb__verdict--ok' : 'fb__verdict--no'">
          {{ showdownCorrect ? '✓ Correct' : '✗ Not quite' }}
          <span class="fb__answer">— best play: {{ puzzle.correct }}</span>
        </div>

        <div class="odds">
          <div class="odds__cell">
            <span class="odds__num">{{ puzzle.math.requiredEquityPct }}%</span>
            <span class="odds__lbl">equity needed (pot odds)</span>
          </div>
          <div class="odds__vs">vs</div>
          <div class="odds__cell">
            <span
              class="odds__num"
              :class="puzzle.math.yourEquityPct >= puzzle.math.requiredEquityPct ? 'odds__num--ok' : 'odds__num--no'"
            >{{ puzzle.math.yourEquityPct }}%</span>
            <span class="odds__lbl">your equity</span>
          </div>
        </div>

        <p class="fb__text fb__text--mono">{{ puzzle.math.reasoning }}</p>
        <p class="fb__text">{{ puzzle.explanation }}</p>

        <button class="next" @click="newShowdown">Next spot →</button>
      </div>
    </main>

    <footer class="foot">
      Strength = all-in equity vs a random hand · ranges are approximations for training, not a live solver.
    </footer>
  </div>
</template>

<style scoped>
.app {
  max-width: 460px;
  margin: 0 auto;
  /* Respect notches / home indicators on phones (viewport-fit=cover). */
  padding:
    calc(22px + env(safe-area-inset-top)) calc(18px + env(safe-area-inset-right))
    calc(40px + env(safe-area-inset-bottom)) calc(18px + env(safe-area-inset-left));
  min-height: 100svh;
  display: flex;
  flex-direction: column;
}

.head { text-align: center; margin-bottom: 18px; }
.head__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 34px;
  letter-spacing: 0.32em;
  font-weight: 700;
  color: var(--color-gold);
  text-indent: 0.32em;
}
.head__sub {
  margin: 2px 0 0;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 14px;
}
.tab {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 6px;
  border-radius: 10px;
  border: 1px solid var(--color-line);
  background: var(--color-surface);
  color: var(--color-fg-soft);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, transform 0.1s;
}
.tab:active { transform: scale(0.97); }
.tab--on {
  border-color: var(--color-line-gold);
  background: var(--color-surface-2);
  box-shadow: 0 0 0 1px var(--color-line-gold) inset;
}
.tab__label {
  font-size: 13px;
  font-weight: 600;
}
.tab--on .tab__label { color: var(--color-gold-soft); }
.tab__sub {
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.05em;
  color: var(--color-muted-2);
}

.tally {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 10px;
  margin-bottom: 18px;
}
.tally__score {
  font-family: var(--font-mono);
  font-size: 18px;
  color: var(--color-gold-soft);
}
.tally__pct {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-muted);
}

.board {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 24px 18px 26px;
  border-radius: 18px;
  background:
    radial-gradient(120% 80% at 50% 0%, var(--color-felt-soft), var(--color-felt) 70%);
  border: 1px solid var(--color-line-2);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.05) inset,
    0 24px 50px -28px rgba(0, 0, 0, 0.9);
}

.seat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
}
.seat__name {
  font-family: var(--font-display);
  font-size: 19px;
  color: var(--color-fg);
}
.seat__ctx {
  font-size: 12px;
  color: var(--color-fg-soft);
  max-width: 34ch;
  line-height: 1.4;
}

.community {
  display: flex;
  gap: 6px;
  padding: 8px 0;
}

.hole {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}
.hole--sd { margin-top: 0; }
.hole__name {
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 0.12em;
  color: var(--color-gold-soft);
}

.prompt {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 16px;
  color: var(--color-fg-soft);
  text-align: center;
}
.prompt--sd {
  font-style: normal;
  font-family: var(--font-body);
  font-size: 13.5px;
  line-height: 1.5;
  max-width: 38ch;
}

.actions {
  display: flex;
  gap: 12px;
  width: 100%;
  margin-top: 6px;
}
.act {
  flex: 1;
  padding: 16px 10px;
  border-radius: 12px;
  border: 1px solid transparent;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.1s, filter 0.15s;
}
.act:active { transform: scale(0.97); }
.act--fold {
  background: var(--color-surface);
  border-color: var(--color-line-2);
  color: var(--color-fg-soft);
}
.act--go {
  background: linear-gradient(180deg, var(--color-gold-soft), var(--color-gold));
  color: #2a2008;
}
.act:hover { filter: brightness(1.06); }

.fb {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 6px;
}
.fb__verdict {
  text-align: center;
  font-size: 16px;
  font-weight: 700;
}
.fb__verdict--ok { color: var(--color-good-soft); }
.fb__verdict--no { color: var(--color-bad-soft); }
.fb__answer {
  display: block;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--color-fg-soft);
  margin-top: 2px;
}
.fb__bar { margin: 10px 0 4px; }
.fb__text {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--color-fg-soft);
}
.fb__text--mono {
  font-family: var(--font-mono);
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--color-fg);
  background: rgba(6, 13, 10, 0.5);
  border: 1px solid var(--color-line);
  border-radius: 8px;
  padding: 10px 12px;
}

.odds {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 8px 0;
}
.odds__cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.odds__num {
  font-family: var(--font-mono);
  font-size: 22px;
  color: var(--color-fg);
}
.odds__num--ok { color: var(--color-good-soft); }
.odds__num--no { color: var(--color-bad-soft); }
.odds__lbl {
  font-size: 9.5px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-muted);
  max-width: 12ch;
  text-align: center;
  line-height: 1.3;
}
.odds__vs {
  font-family: var(--font-display);
  font-style: italic;
  color: var(--color-muted);
}

.next {
  margin-top: 4px;
  padding: 13px;
  border-radius: 12px;
  border: 1px solid var(--color-line-gold);
  background: transparent;
  color: var(--color-gold-soft);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.next:hover { background: rgba(217, 178, 75, 0.08); }

.foot {
  margin-top: 20px;
  text-align: center;
  font-size: 10.5px;
  line-height: 1.5;
  color: var(--color-muted-2);
}
</style>
