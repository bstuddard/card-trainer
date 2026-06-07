<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import PlayingCard from './PlayingCard.vue'
import RangeBar from './RangeBar.vue'
import type { PreflopAction } from '../types'
import { generateSpot, gradePreflop, laneById, type PreflopFeedback } from '../engine/preflop'

const props = defineProps<{ laneId: 'steal' | 'mid' }>()
const emit = defineEmits<{ score: [correct: boolean] }>()

const spot = ref(generateSpot(laneById(props.laneId)))
const preflopFb = ref<PreflopFeedback | null>(null)
const animKey = ref(0)

watch(() => props.laneId, (id) => {
  spot.value = generateSpot(laneById(id))
  preflopFb.value = null
  animKey.value++
})

function newPreflop() {
  spot.value = generateSpot(laneById(props.laneId))
  preflopFb.value = null
  animKey.value++
}

function answerPreflop(action: PreflopAction) {
  if (preflopFb.value) return
  const fb = gradePreflop(spot.value, action)
  preflopFb.value = fb
  emit('score', fb.correct)
}

const lane = computed(() => spot.value.lane)
</script>

<template>
  <main :key="animKey" class="board animate-fade-in">
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
</template>
