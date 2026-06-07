<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import PlayingCard from './PlayingCard.vue'
import { shuffledDeck, analyzeHand } from '../engine/equity'
import type { Card } from '../types'

type Stage = 'preflop' | 'flop' | 'turn' | 'river'
const STAGES: Stage[] = ['preflop', 'flop', 'turn', 'river']
const STAGE_LABELS: Record<Stage, string> = {
  preflop: 'Pre-flop', flop: 'Flop', turn: 'Turn', river: 'River',
}
const TIMER = 30

const hero = ref<Card[]>([])
const fullBoard = ref<Card[]>([]) // all 5 board cards pre-dealt
const stageIdx = ref(0)
const countdown = ref(TIMER)
const paused = ref(false)
const revealed = ref(false)
const animKey = ref(0)

const stage = computed(() => STAGES[stageIdx.value])
const board = computed(() => {
  if (stageIdx.value === 0) return []
  if (stageIdx.value === 1) return fullBoard.value.slice(0, 3)
  if (stageIdx.value === 2) return fullBoard.value.slice(0, 4)
  return fullBoard.value.slice(0, 5)
})

const analysis = computed(() => analyzeHand(hero.value, board.value))

const timerColor = computed(() => {
  if (countdown.value > 15) return 'text-good-soft'
  if (countdown.value > 7) return 'text-gold-soft'
  return 'text-bad-soft'
})

let tick: ReturnType<typeof setInterval>

function startTick() {
  clearInterval(tick)
  tick = setInterval(() => {
    if (paused.value || revealed.value) return
    countdown.value--
    if (countdown.value <= 0) {
      revealed.value = true
      clearInterval(tick)
    }
  }, 1000)
}

function dealNewHand() {
  clearInterval(tick)
  const deck = shuffledDeck()
  hero.value = [deck[0], deck[1]]
  fullBoard.value = [deck[2], deck[3], deck[4], deck[5], deck[6]]
  stageIdx.value = 0
  countdown.value = TIMER
  paused.value = false
  revealed.value = false
  animKey.value++
  startTick()
}

function reveal() {
  revealed.value = true
  clearInterval(tick)
}

function nextStreet() {
  if (stageIdx.value >= 3) { dealNewHand(); return }
  stageIdx.value++
  countdown.value = TIMER
  paused.value = false
  revealed.value = false
  startTick()
}

onMounted(dealNewHand)
onUnmounted(() => clearInterval(tick))
</script>

<template>
  <main :key="animKey" class="board animate-fade-in">
    <div class="seat">
      <span class="seat__name">Equity drill</span>
      <span class="seat__ctx">Count outs · estimate equity · plan your action</span>
    </div>

    <!-- Board cards (revealed progressively) -->
    <div v-if="board.length > 0" class="flex gap-1.5 py-1">
      <PlayingCard v-for="(c, i) in board" :key="i" :card="c" size="sm" />
    </div>

    <!-- Hero hole cards -->
    <div class="hole">
      <PlayingCard :card="hero[0]" v-if="hero[0]" />
      <PlayingCard :card="hero[1]" v-if="hero[1]" />
    </div>

    <!-- Stage label + countdown -->
    <div class="flex items-center gap-4">
      <span class="font-mono text-[13px] tracking-[0.1em] uppercase text-fg-soft">{{ STAGE_LABELS[stage] }}</span>
      <span v-if="!revealed" class="font-mono text-4xl font-bold transition-colors duration-500" :class="timerColor">
        {{ countdown }}s
      </span>
    </div>

    <!-- Controls (before reveal) -->
    <div v-if="!revealed" class="actions">
      <button class="act act--fold" @click="paused = !paused">
        {{ paused ? 'Resume' : 'Pause' }}
      </button>
      <button class="act act--go" @click="reveal">
        Reveal now
      </button>
    </div>

    <!-- Analysis (after reveal) -->
    <div v-else class="fb animate-pop-in">
      <div class="fb__verdict fb__verdict--ok">{{ analysis.handSummary }}</div>

      <!-- Outs + equity display -->
      <div class="flex items-center justify-center gap-4 py-1">
        <div class="flex flex-col items-center gap-0.5">
          <span class="font-mono text-[22px]" :class="analysis.outs > 0 ? 'text-gold-soft' : 'text-fg'">
            {{ analysis.outs > 0 ? analysis.outs : '—' }}
          </span>
          <span class="text-[9.5px] uppercase tracking-[0.04em] text-muted text-center max-w-[12ch] leading-tight">outs</span>
        </div>
        <span class="font-display italic text-muted">→</span>
        <div class="flex flex-col items-center gap-0.5">
          <span class="font-mono text-[22px] text-good-soft">~{{ analysis.equityPct }}%</span>
          <span class="text-[9.5px] uppercase tracking-[0.04em] text-muted text-center max-w-[12ch] leading-tight">{{ analysis.rule }}</span>
        </div>
      </div>

      <p class="fb__text--mono">{{ analysis.outsDetail }}</p>
      <p class="fb__text">{{ analysis.recommendation }}</p>

      <button class="next" @click="nextStreet">
        {{ stageIdx >= 3 ? 'New hand →' : `Next: ${STAGE_LABELS[STAGES[stageIdx + 1]]} →` }}
      </button>
    </div>
  </main>
</template>
