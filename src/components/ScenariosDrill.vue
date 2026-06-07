<script setup lang="ts">
import { ref, computed } from 'vue'
import PlayingCard from './PlayingCard.vue'
import type { Card, ShowdownPuzzle } from '../types'
import showdownData from '../data/showdowns.json'

const emit = defineEmits<{ score: [correct: boolean] }>()

const puzzles = showdownData.puzzles as ShowdownPuzzle[]
if (import.meta.env.DEV) {
  for (const p of puzzles) {
    if (!p.gto) throw new Error(`Puzzle "${p.id}" is missing the gto field`)
  }
}
const puzzleIdx = ref(Math.floor(Math.random() * puzzles.length))
const puzzle = computed(() => puzzles[puzzleIdx.value])
const choice = ref<string | null>(null)
const isCorrect = computed(() => choice.value !== null && choice.value === puzzle.value.correct)

function nextPuzzle() {
  let next = puzzleIdx.value
  if (puzzles.length > 1) while (next === puzzleIdx.value) next = Math.floor(Math.random() * puzzles.length)
  puzzleIdx.value = next
  choice.value = null
}

function answer(action: string) {
  if (choice.value) return
  choice.value = action
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
const heroCards = computed(() => puzzle.value.heroHand.map(parseCard))

const yourEq = computed(() => puzzle.value.math.yourEquityPct)
const reqEq = computed(() => puzzle.value.math.requiredEquityPct)
const beatsPotOdds = computed(() => yourEq.value >= reqEq.value)
</script>

<template>
  <main class="board animate-fade-in" :key="puzzle.id">

    <!-- Header -->
    <div class="seat">
      <span class="seat__name">{{ puzzle.title }}</span>
      <span class="seat__ctx">{{ puzzle.street }} · pot {{ puzzle.pot }} · facing {{ puzzle.bet }}</span>
    </div>

    <!-- Board cards -->
    <div class="flex gap-1.5 py-1">
      <PlayingCard v-for="(c, i) in boardCards" :key="i" :card="c" size="sm" />
    </div>

    <!-- Hero hand -->
    <div class="hole hole--sd">
      <PlayingCard :card="heroCards[0]" />
      <PlayingCard :card="heroCards[1]" />
    </div>

    <!-- Situation -->
    <p class="prompt prompt--sd">{{ puzzle.situation }}</p>

    <!-- Action buttons -->
    <div class="actions" v-if="!choice">
      <button
        v-for="a in puzzle.actions"
        :key="a"
        class="act"
        :class="a === 'Fold' ? 'act--fold' : 'act--go'"
        @click="answer(a)"
      >{{ a }}</button>
    </div>

    <!-- Feedback panel -->
    <div v-else class="fb animate-pop-in">

      <!-- Verdict -->
      <div class="fb__verdict" :class="isCorrect ? 'fb__verdict--ok' : 'fb__verdict--no'">
        {{ isCorrect ? '✓ Correct' : '✗ Not quite' }}
        <span class="fb__answer">— best play: {{ puzzle.correct }}</span>
      </div>

      <!-- ── Equity vs Pot Odds ── -->
      <div class="w-full">
        <div class="flex justify-between items-baseline mb-2">
          <span class="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">Equity vs pot odds</span>
          <div class="flex items-baseline gap-2.5">
            <span
              class="font-mono text-[13px] font-semibold"
              :class="beatsPotOdds ? 'text-good-soft' : 'text-bad-soft'"
            >you {{ yourEq }}%</span>
            <span class="font-mono text-[11px] text-gold-soft">need {{ reqEq }}%</span>
          </div>
        </div>

        <div class="relative h-[14px] rounded-full bg-surface-2 border border-line overflow-visible">
          <!-- Your equity fill -->
          <div
            class="absolute inset-y-0 left-0 rounded-full"
            :style="{
              width: Math.min(yourEq, 100) + '%',
              background: beatsPotOdds ? 'rgba(127,214,168,0.28)' : 'rgba(235,150,132,0.28)'
            }"
          />
          <!-- Required threshold line -->
          <div
            class="absolute top-[-5px] bottom-[-5px] w-[2px] bg-gold z-10 -translate-x-px"
            :style="{ left: Math.min(reqEq, 100) + '%' }"
          >
            <span class="absolute bottom-[-16px] left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[8px] text-gold-soft">
              need
            </span>
          </div>
          <!-- Your equity dot -->
          <div
            class="absolute top-1/2 w-3.5 h-3.5 rounded-full -translate-x-1/2 -translate-y-1/2 border-2 border-[#0a1410] shadow-[0_2px_6px_rgba(0,0,0,0.6)] z-20"
            :class="beatsPotOdds ? 'bg-good-soft' : 'bg-bad-soft'"
            :style="{ left: Math.min(yourEq, 100) + '%' }"
          />
        </div>

        <div class="flex justify-between mt-[18px] font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted-2">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      <!-- ── Villain Range Breakdown ── -->
      <div class="w-full">
        <span class="font-mono text-[10px] uppercase tracking-[0.08em] text-muted block mb-2">
          Villain's range
        </span>
        <div class="flex h-7 rounded-xl overflow-hidden border border-line">
          <!-- Value: beats hero -->
          <div
            class="flex items-center justify-center shrink-0"
            style="background: rgba(215,100,80,0.38);"
            :style="{ width: puzzle.gto.villainValuePct + '%' }"
          >
            <span
              v-if="puzzle.gto.villainValuePct >= 18"
              class="font-mono text-[9px] tracking-[0.03em] text-bad-soft"
            >{{ puzzle.gto.villainValuePct }}% value</span>
          </div>
          <!-- Bluffs: hero beats -->
          <div
            class="flex items-center justify-center shrink-0"
            style="background: rgba(76,175,125,0.22);"
            :style="{ width: puzzle.gto.villainBluffPct + '%' }"
          >
            <span
              v-if="puzzle.gto.villainBluffPct >= 18"
              class="font-mono text-[9px] tracking-[0.03em] text-good-soft"
            >{{ puzzle.gto.villainBluffPct }}% bluffs</span>
          </div>
        </div>
        <div class="flex justify-between mt-1 font-mono text-[8.5px] text-muted-2">
          <span>← beats you</span>
          <span>you beat →</span>
        </div>
      </div>

      <!-- ── GTO Key Insight ── -->
      <div class="w-full border-l-2 border-gold pl-3 py-0.5">
        <div class="mb-1.5">
          <span
            class="font-mono text-[9.5px] tracking-[0.05em] uppercase text-gold-soft border rounded-md px-2 py-[3px]"
            style="border-color: rgba(217,178,75,0.4);"
          >{{ puzzle.gto.conceptTag }}</span>
        </div>
        <p class="m-0 text-[13px] leading-[1.55] text-fg-soft">{{ puzzle.gto.keyInsight }}</p>
      </div>

      <!-- Math reasoning -->
      <p class="fb__text fb__text--mono">{{ puzzle.math.reasoning }}</p>

      <!-- Full explanation -->
      <p class="fb__text">{{ puzzle.explanation }}</p>

      <button class="next" @click="nextPuzzle">Next scenario →</button>
    </div>

  </main>
</template>
