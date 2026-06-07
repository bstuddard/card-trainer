<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{ score: [correct: boolean] }>()

interface Scenario {
  pot: number
  bet: number
  correct: number
  options: [number, number, number]
}

// All verified: correct = Math.round(bet / (pot + 2*bet) * 100)
// Low distractor ≈ half the correct; high ≈ bet/(pot+bet) (forget-your-call mistake)
const SCENARIOS: Scenario[] = [
  // ~17% — quarter-pot bets
  { pot: 80,  bet: 20,  correct: 17, options: [10, 17, 25] },
  { pot: 120, bet: 30,  correct: 17, options: [10, 17, 25] },
  { pot: 60,  bet: 15,  correct: 17, options: [10, 17, 20] },
  // 20% — third-pot bets
  { pot: 60,  bet: 20,  correct: 20, options: [12, 20, 29] },
  { pot: 90,  bet: 30,  correct: 20, options: [12, 20, 33] },
  { pot: 120, bet: 40,  correct: 20, options: [13, 20, 25] },
  // 25% — half-pot bets
  { pot: 80,  bet: 40,  correct: 25, options: [17, 25, 33] },
  { pot: 100, bet: 50,  correct: 25, options: [17, 25, 33] },
  { pot: 60,  bet: 30,  correct: 25, options: [15, 25, 33] },
  // ~29% — two-thirds-pot bets
  { pot: 60,  bet: 40,  correct: 29, options: [18, 29, 40] },
  { pot: 90,  bet: 60,  correct: 29, options: [18, 29, 40] },
  // 30% — three-quarter-pot bets
  { pot: 40,  bet: 30,  correct: 30, options: [20, 30, 43] },
  { pot: 80,  bet: 60,  correct: 30, options: [20, 30, 43] },
  { pot: 60,  bet: 45,  correct: 30, options: [18, 30, 40] },
  // ~33% — pot-sized bets
  { pot: 60,  bet: 60,  correct: 33, options: [22, 33, 50] },
  { pot: 80,  bet: 80,  correct: 33, options: [22, 33, 50] },
  { pot: 100, bet: 100, correct: 33, options: [20, 33, 50] },
  // 40% — two-times-pot bets
  { pot: 50,  bet: 100, correct: 40, options: [25, 40, 50] },
  { pot: 30,  bet: 60,  correct: 40, options: [25, 40, 50] },
  { pot: 40,  bet: 80,  correct: 40, options: [25, 40, 50] },
]

function pick(): Scenario & { shuffled: number[] } {
  const s = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)]
  const shuffled = [...s.options].sort(() => Math.random() - 0.5)
  return { ...s, shuffled }
}

const current = ref(pick())
const choice = ref<number | null>(null)
const animKey = ref(0)

function next() {
  let next = pick()
  while (next.pot === current.value.pot && next.bet === current.value.bet)
    next = pick()
  current.value = next
  choice.value = null
  animKey.value++
}

function answer(pct: number) {
  if (choice.value !== null) return
  choice.value = pct
  emit('score', pct === current.value.correct)
}
</script>

<template>
  <main :key="animKey" class="board animate-fade-in">
    <div class="seat">
      <span class="seat__name">Pot odds</span>
      <span class="seat__ctx">What % equity do you need to call profitably?</span>
    </div>

    <!-- Pot and bet display -->
    <div class="flex items-center justify-center gap-4 py-3">
      <div class="flex flex-col items-center gap-1.5 bg-[rgba(6,13,10,0.4)] border border-line-2 rounded-xl py-4 px-6 min-w-[84px]">
        <span class="font-mono text-[30px] font-bold text-fg leading-none">{{ current.pot }}</span>
        <span class="text-[10px] tracking-[0.08em] uppercase text-muted">pot</span>
      </div>
      <span class="text-[22px] text-muted leading-none">→</span>
      <div class="flex flex-col items-center gap-1.5 bg-[rgba(217,178,75,0.06)] border border-line-gold rounded-xl py-4 px-6 min-w-[84px]">
        <span class="font-mono text-[30px] font-bold text-gold-soft leading-none">{{ current.bet }}</span>
        <span class="text-[10px] tracking-[0.08em] uppercase text-muted">villain bets</span>
      </div>
    </div>

    <!-- Multiple choice buttons -->
    <div class="actions" v-if="choice === null">
      <button
        v-for="opt in current.shuffled"
        :key="opt"
        class="act act--fold"
        @click="answer(opt)"
      >
        {{ opt }}%
      </button>
    </div>

    <!-- Feedback -->
    <div v-else class="fb animate-pop-in">
      <div class="fb__verdict" :class="choice === current.correct ? 'fb__verdict--ok' : 'fb__verdict--no'">
        {{ choice === current.correct ? '✓ Correct' : '✗ Not quite' }}
        <span class="fb__answer">— answer: {{ current.correct }}%</span>
      </div>

      <!-- Formula breakdown -->
      <div class="fb__text--mono flex flex-col gap-0.5">
        <span class="text-fg-soft">bet ÷ (pot + bet + call)</span>
        <span class="text-fg-soft">= {{ current.bet }} ÷ ({{ current.pot }} + {{ current.bet }} + {{ current.bet }})</span>
        <span class="text-fg-soft">= {{ current.bet }} ÷ {{ current.pot + 2 * current.bet }}</span>
        <span class="text-good-soft font-bold pt-0.5">= {{ current.correct }}%</span>
      </div>

      <p class="fb__text">Call whenever your equity beats this threshold. Bigger bets demand more equity — but also punish your opponent more harshly when they bluff into your strong hands.</p>

      <button class="next" @click="next">Next spot →</button>
    </div>
  </main>
</template>
