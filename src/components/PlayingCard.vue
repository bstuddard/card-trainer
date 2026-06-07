<script setup lang="ts">
import { computed } from 'vue'
import type { Card } from '../types'

const props = withDefaults(
  defineProps<{ card: Card; size?: 'lg' | 'sm' }>(),
  { size: 'lg' },
)

const RANKS: Record<number, string> = {
  14: 'A', 13: 'K', 12: 'Q', 11: 'J', 10: '10',
  9: '9', 8: '8', 7: '7', 6: '6', 5: '5', 4: '4', 3: '3', 2: '2',
}
const rankText = computed(() => RANKS[props.card.rank] ?? '?')
const isRed = computed(() => props.card.suit === '♥' || props.card.suit === '♦')
</script>

<template>
  <div class="card" :class="[`card--${size}`, { 'card--red': isRed }]">
    <span class="card__rank">{{ rankText }}</span>
    <span class="card__suit">{{ card.suit }}</span>
  </div>
</template>

<style scoped>
.card {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f7f4ec;
  color: #1a1a1a;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.25);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.6) inset,
    0 10px 22px -10px rgba(0, 0, 0, 0.7);
  line-height: 1;
  font-family: var(--font-display);
  user-select: none;
}
.card--lg {
  width: 64px;
  height: 90px;
  gap: 4px;
}
.card--sm {
  width: 38px;
  height: 54px;
  gap: 2px;
  border-radius: 6px;
}
.card--red { color: #c0392b; }
.card__rank {
  font-weight: 700;
  font-size: 26px;
}
.card--sm .card__rank { font-size: 16px; }
.card__suit { font-size: 24px; }
.card--sm .card__suit { font-size: 15px; }
</style>
