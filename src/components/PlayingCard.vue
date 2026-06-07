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
  <div
    class="inline-flex flex-col items-center justify-center bg-[#f7f4ec] leading-none font-display select-none border border-[rgba(0,0,0,0.25)]"
    :class="[
      size === 'lg' ? 'w-16 h-[90px] gap-1 rounded-lg' : 'w-[38px] h-[54px] gap-0.5 rounded-md',
      isRed ? 'text-[#c0392b]' : 'text-[#1a1a1a]',
    ]"
    style="box-shadow: 0 1px 0 rgba(255,255,255,0.6) inset, 0 10px 22px -10px rgba(0,0,0,0.7);"
  >
    <span
      class="font-bold"
      :class="size === 'lg' ? 'text-[26px]' : 'text-[16px]'"
    >{{ rankText }}</span>
    <span :class="size === 'lg' ? 'text-[24px]' : 'text-[15px]'">{{ card.suit }}</span>
  </div>
</template>
