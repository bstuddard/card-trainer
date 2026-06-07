<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import PreflopDrill from './components/PreflopDrill.vue'
import ShowdownDrill from './components/ShowdownDrill.vue'
import OddsDrill from './components/OddsDrill.vue'
import EquityDrill from './components/EquityDrill.vue'
import RangeChart from './components/RangeChart.vue'

type Mode = 'steal' | 'mid' | 'showdown' | 'odds' | 'equity' | 'ranges'

// Row 1 — classic drills; Row 2 — new tools (3-col grid auto-creates 2 rows)
const MODES: { id: Mode; label: string; sub: string }[] = [
  { id: 'steal',    label: 'Steal seat',  sub: 'Open wide'    },
  { id: 'mid',      label: 'Middle seat', sub: 'Open tight'   },
  { id: 'showdown', label: 'Heads-up',    sub: 'Turn/river'   },
  { id: 'odds',     label: 'Pot odds',    sub: 'Break-even %' },
  { id: 'equity',   label: 'Equity',      sub: 'Count outs'   },
  { id: 'ranges',   label: 'Ranges',      sub: 'By position'  },
]

const QUIZ_MODES: Mode[] = ['steal', 'mid', 'showdown', 'odds']

const mode = ref<Mode>('steal')

const tally = reactive<Record<Mode, { correct: number; total: number }>>({
  steal:    { correct: 0, total: 0 },
  mid:      { correct: 0, total: 0 },
  showdown: { correct: 0, total: 0 },
  odds:     { correct: 0, total: 0 },
  equity:   { correct: 0, total: 0 },
  ranges:   { correct: 0, total: 0 },
})

const isQuiz = computed(() => QUIZ_MODES.includes(mode.value))
const currentTally = computed(() => tally[mode.value])
const accuracy = computed(() => {
  const t = currentTally.value
  return t.total ? Math.round((t.correct / t.total) * 100) : 0
})

function selectMode(m: Mode) {
  if (m === mode.value) return
  mode.value = m
}

function handleScore(correct: boolean) {
  tally[mode.value].total++
  if (correct) tally[mode.value].correct++
}
</script>

<template>
  <div class="app">
    <header class="head">
      <h1 class="head__title">FELT</h1>
      <p class="head__sub">Preflop &amp; heads-up trainer</p>
    </header>

    <!-- 3-column tab grid — 6 modes create 2 rows automatically -->
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

    <!-- Tally row: score for quiz modes, descriptive label for reference modes -->
    <div class="tally">
      <template v-if="isQuiz">
        <span class="tally__score">{{ currentTally.correct }} / {{ currentTally.total }}</span>
        <span class="tally__pct" v-if="currentTally.total">{{ accuracy }}% this session</span>
        <span class="tally__pct" v-else>start a hand below</span>
      </template>
      <template v-else-if="mode === 'equity'">
        <span class="tally__pct">mental drill — no score</span>
      </template>
      <template v-else>
        <span class="tally__pct">visual reference</span>
      </template>
    </div>

    <!-- Drill panels -->
    <PreflopDrill
      v-if="mode === 'steal' || mode === 'mid'"
      :lane-id="mode"
      @score="handleScore"
    />
    <ShowdownDrill v-else-if="mode === 'showdown'" @score="handleScore" />
    <OddsDrill     v-else-if="mode === 'odds'"     @score="handleScore" />
    <EquityDrill   v-else-if="mode === 'equity'" />
    <RangeChart    v-else-if="mode === 'ranges'" />

    <footer class="foot">
      Strength = all-in equity vs a random hand · ranges are approximations for training, not a live solver.
    </footer>
  </div>
</template>

<style scoped>
.app {
  max-width: 460px;
  margin: 0 auto;
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
  padding: 9px 6px;
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
  font-size: 12px;
  font-weight: 600;
}
.tab--on .tab__label { color: var(--color-gold-soft); }
.tab__sub {
  font-family: var(--font-mono);
  font-size: 9px;
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

.foot {
  margin-top: 20px;
  text-align: center;
  font-size: 10.5px;
  line-height: 1.5;
  color: var(--color-muted-2);
}
</style>
