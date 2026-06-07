<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  thresholdPct: number
  handPercentile: number
}>()

const handLeft = computed(() => Math.min(100, Math.max(0, props.handPercentile)))
const threshLeft = computed(() => Math.min(100, Math.max(0, props.thresholdPct)))
const inside = computed(() => props.handPercentile < props.thresholdPct)
</script>

<template>
  <div class="w-full">
    <!-- Track -->
    <div class="relative h-4 rounded-full bg-surface-2 border border-line overflow-visible">
      <!-- Green zone: open range -->
      <div
        class="absolute inset-y-0 left-0 rounded-l-full"
        style="background: linear-gradient(90deg, rgba(76,175,125,0.5), rgba(76,175,125,0.22));"
        :style="{ width: threshLeft + '%' }"
      ></div>

      <!-- Threshold line + label -->
      <div
        class="absolute top-[-4px] bottom-[-4px] w-0.5 bg-gold -translate-x-px"
        :style="{ left: threshLeft + '%' }"
      >
        <span class="absolute top-[-18px] left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] tracking-[0.06em] text-gold-soft">
          open ≤ {{ thresholdPct }}%
        </span>
      </div>

      <!-- Hand position dot -->
      <div
        class="absolute top-1/2 w-3.5 h-3.5 rounded-full -translate-x-1/2 -translate-y-1/2 border-2 border-[#0a1410] shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
        :class="inside ? 'bg-good-soft' : 'bg-bad-soft'"
        :style="{ left: handLeft + '%' }"
      ></div>
    </div>

    <!-- Labels -->
    <div class="flex justify-between mt-1.5 font-mono text-[9px] tracking-[0.1em] uppercase text-muted-2">
      <span>strongest</span>
      <span>weakest</span>
    </div>
  </div>
</template>
