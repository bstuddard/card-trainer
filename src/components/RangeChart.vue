<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import handRankingData from '../data/handRanking.json'
import type { RankedHand } from '../types'

interface Scenario {
  position: string
  stack: number
  threshold: number
  action: 'open' | 'shove'
}

// Ordered: best position + deep stack → worst position → short-stack push/fold.
// Thresholds approximate GTO opening ranges from solver studies (100bb) and
// push/fold charts (≤25bb).
const SCENARIOS: Scenario[] = [
  { position: 'BTN', stack: 100, threshold: 44, action: 'open'  },
  { position: 'CO',  stack: 100, threshold: 29, action: 'open'  },
  { position: 'HJ',  stack: 100, threshold: 21, action: 'open'  },
  { position: 'EP',  stack: 100, threshold: 14, action: 'open'  },
  { position: 'UTG', stack: 100, threshold: 13, action: 'open'  },
  { position: 'UTG', stack: 25,  threshold: 18, action: 'open'  },
  { position: 'UTG', stack: 12,  threshold: 30, action: 'shove' },
  { position: 'BTN', stack: 12,  threshold: 60, action: 'shove' },
]

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']

const handMap: Record<string, number> = Object.fromEntries(
  (handRankingData as RankedHand[]).map(h => [h.hand, h.percentileStart])
)

function cellName(i: number, j: number): string {
  if (i === j) return RANKS[i] + RANKS[i]
  if (i < j)  return RANKS[i] + RANKS[j] + 's'
  return RANKS[j] + RANKS[i] + 'o'
}

const scenarioIdx = ref(0)
const fading = ref(false)

function advance() {
  fading.value = true
  setTimeout(() => {
    scenarioIdx.value = (scenarioIdx.value + 1) % SCENARIOS.length
    fading.value = false
  }, 350)
}

let timer: ReturnType<typeof setInterval>
onMounted(() => { timer = setInterval(advance, 3600) })
onUnmounted(() => clearInterval(timer))

const current = computed(() => SCENARIOS[scenarioIdx.value])

function inRange(i: number, j: number): boolean {
  const ps = handMap[cellName(i, j)]
  return ps !== undefined && ps < current.value.threshold
}
</script>

<template>
  <div class="flex-1 flex flex-col items-center gap-2.5">

    <!-- Header: position + stack + action label -->
    <div
      class="flex flex-col items-center gap-1.5 transition-opacity duration-300"
      :class="{ 'opacity-0': fading }"
    >
      <div class="flex items-baseline gap-2 flex-wrap justify-center">
        <span class="font-display text-2xl text-fg">{{ current.position }}</span>
        <span class="font-mono text-sm text-gold-soft">{{ current.stack }}bb</span>
        <span class="font-mono text-xs" :class="current.action === 'shove' ? 'text-gold-soft' : 'text-good-soft'">
          {{ current.action === 'open' ? 'Open' : 'Shove all-in' }} top {{ current.threshold }}%
        </span>
      </div>
      <!-- Progress dots -->
      <div class="flex gap-1.5">
        <span
          v-for="(_, k) in SCENARIOS"
          :key="k"
          class="w-1.5 h-1.5 rounded-full transition-colors duration-300"
          :class="k === scenarioIdx ? 'bg-gold' : 'bg-line-2'"
        />
      </div>
    </div>

    <!-- 13×13 hand range grid -->
    <div class="grid grid-cols-[repeat(13,1fr)] gap-[1.5px] w-full">
      <template v-for="i in 13" :key="i">
        <div
          v-for="j in 13"
          :key="j"
          class="aspect-square flex items-center justify-center rounded-[2px] overflow-hidden font-mono text-[6px] select-none transition-colors duration-500"
          :class="inRange(i - 1, j - 1)
            ? 'bg-good text-[rgba(6,13,10,0.65)]'
            : 'bg-surface text-[rgba(238,243,238,0.25)]'"
        >{{ cellName(i - 1, j - 1) }}</div>
      </template>
    </div>

    <!-- Legend -->
    <div class="flex items-center gap-1.5">
      <span class="w-2.5 h-2.5 rounded-[2px] bg-good flex-shrink-0"></span>
      <span class="text-[10.5px] text-muted mr-2.5">in range</span>
      <span class="w-2.5 h-2.5 rounded-[2px] bg-surface border border-line-2 flex-shrink-0"></span>
      <span class="text-[10.5px] text-muted">fold</span>
    </div>

    <p class="text-[10px] text-muted-2 text-center leading-relaxed max-w-[36ch]">
      Auto-cycles every 3.6 s · equity-ranked hands · deep-stack open or short-stack shove
    </p>
  </div>
</template>
