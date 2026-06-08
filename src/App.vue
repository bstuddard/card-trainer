<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import PreflopDrill from './components/PreflopDrill.vue'
import ScenariosDrill from './components/ScenariosDrill.vue'
import OddsDrill from './components/OddsDrill.vue'
import EquityDrill from './components/EquityDrill.vue'
import LearnView from './components/LearnView.vue'

type Mode = 'preflop' | 'showdown' | 'odds' | 'equity' | 'learn'

const MODES: { id: Mode; label: string; sub: string }[] = [
  { id: 'preflop',  label: 'Preflop',   sub: 'All seats'    },
  { id: 'showdown', label: 'Scenarios', sub: 'GTO spots'    },
  { id: 'odds',     label: 'Pot odds',  sub: 'Break-even %' },
  { id: 'equity',   label: 'Equity',    sub: 'Count outs'   },
  { id: 'learn',    label: 'Learn',     sub: 'Guides & charts' },
]

const QUIZ_MODES: Mode[] = ['preflop', 'showdown', 'odds']

const mode = ref<Mode>('preflop')

const tally = reactive<Record<Mode, { correct: number; total: number }>>({
  preflop:  { correct: 0, total: 0 },
  showdown: { correct: 0, total: 0 },
  odds:     { correct: 0, total: 0 },
  equity:   { correct: 0, total: 0 },
  learn:    { correct: 0, total: 0 },
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
  <div class="max-w-[460px] mx-auto flex flex-col min-h-[100svh]"
    style="padding: calc(22px + env(safe-area-inset-top)) calc(18px + env(safe-area-inset-right)) calc(40px + env(safe-area-inset-bottom)) calc(18px + env(safe-area-inset-left));">

    <header class="text-center mb-[18px]">
      <h1 class="m-0 font-display text-[34px] tracking-[0.32em] font-bold text-gold indent-[0.32em]">FELT</h1>
      <p class="mt-0.5 mb-0 font-mono text-[11px] tracking-[0.14em] uppercase text-muted">Preflop &amp; heads-up trainer</p>
    </header>

    <!-- 3-column tab grid — 6 modes create 2 rows automatically -->
    <nav class="grid grid-cols-3 gap-2 mb-[14px]" role="tablist">
      <button
        v-for="m in MODES"
        :key="m.id"
        class="flex flex-col gap-0.5 py-[9px] px-[6px] rounded-[10px] border border-line bg-surface text-fg-soft cursor-pointer transition-[border-color,background] duration-150 active:scale-[0.97]"
        :class="mode === m.id ? 'border-line-gold bg-surface-2 shadow-[0_0_0_1px_var(--color-line-gold)_inset]' : ''"
        role="tab"
        :aria-selected="mode === m.id"
        @click="selectMode(m.id)"
      >
        <span
          class="text-[12px] font-semibold"
          :class="mode === m.id ? 'text-gold-soft' : ''"
        >{{ m.label }}</span>
        <span class="font-mono text-[9px] tracking-[0.05em] text-muted-2">{{ m.sub }}</span>
      </button>
    </nav>

    <!-- Tally row -->
    <div class="flex items-baseline justify-center gap-[10px] mb-[18px]">
      <template v-if="isQuiz">
        <span class="font-mono text-[18px] text-gold-soft">{{ currentTally.correct }} / {{ currentTally.total }}</span>
        <span class="font-mono text-[11px] text-muted" v-if="currentTally.total">{{ accuracy }}% this session</span>
        <span class="font-mono text-[11px] text-muted" v-else>start a hand below</span>
      </template>
      <template v-else-if="mode === 'equity'">
        <span class="font-mono text-[11px] text-muted">mental drill — no score</span>
      </template>
      <template v-else>
        <span class="font-mono text-[11px] text-muted">reference &amp; guides</span>
      </template>
    </div>

    <!-- Drill panels -->
    <PreflopDrill v-if="mode === 'preflop'" @score="handleScore" />
    <ScenariosDrill v-else-if="mode === 'showdown'" @score="handleScore" />
    <OddsDrill     v-else-if="mode === 'odds'"     @score="handleScore" />
    <EquityDrill   v-else-if="mode === 'equity'" />
    <LearnView     v-else-if="mode === 'learn'" />

    <footer class="mt-5 text-center text-[10.5px] leading-[1.5] text-muted-2">
      Strength = all-in equity vs a random hand · ranges are approximations for training, not a live solver.
    </footer>
  </div>
</template>
