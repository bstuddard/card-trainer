<script setup lang="ts">
import { ref, computed } from 'vue'
import PlayingCard from './PlayingCard.vue'
import type { Card, ShowdownPuzzle } from '../types'
import showdownData from '../data/showdowns.json'

const emit = defineEmits<{ score: [correct: boolean] }>()

const puzzles = showdownData.puzzles as ShowdownPuzzle[]
const puzzleIdx = ref(Math.floor(Math.random() * puzzles.length))
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
  emit('score', action === puzzle.value.correct)
}

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
</script>

<template>
  <main class="board animate-fade-in" :key="puzzle.id">
    <div class="seat">
      <span class="seat__name">{{ puzzle.title }}</span>
      <span class="seat__ctx">Heads-up · {{ puzzle.street }} · pot {{ puzzle.pot }}, facing {{ puzzle.bet }}</span>
    </div>

    <!-- Board cards -->
    <div class="flex gap-1.5 py-2">
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

      <!-- Equity comparison -->
      <div class="flex items-center justify-center gap-4 py-2">
        <div class="flex flex-col items-center gap-0.5">
          <span class="font-mono text-[22px] text-fg">{{ puzzle.math.requiredEquityPct }}%</span>
          <span class="text-[9.5px] tracking-[0.04em] uppercase text-muted text-center max-w-[12ch] leading-[1.3]">equity needed (pot odds)</span>
        </div>
        <div class="font-display italic text-muted">vs</div>
        <div class="flex flex-col items-center gap-0.5">
          <span
            class="font-mono text-[22px]"
            :class="puzzle.math.yourEquityPct >= puzzle.math.requiredEquityPct ? 'text-good-soft' : 'text-bad-soft'"
          >{{ puzzle.math.yourEquityPct }}%</span>
          <span class="text-[9.5px] tracking-[0.04em] uppercase text-muted text-center max-w-[12ch] leading-[1.3]">your equity</span>
        </div>
      </div>

      <p class="fb__text fb__text--mono">{{ puzzle.math.reasoning }}</p>
      <p class="fb__text">{{ puzzle.explanation }}</p>

      <button class="next" @click="newShowdown">Next spot →</button>
    </div>
  </main>
</template>
