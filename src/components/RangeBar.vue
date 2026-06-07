<script setup lang="ts">
import { computed } from 'vue'

// Visualizes "open the top X%": a bar from strongest (left) to weakest (right),
// the green zone = the opening range, a marker for where this hand sits.
const props = defineProps<{
  thresholdPct: number
  handPercentile: number
}>()

const handLeft = computed(() => Math.min(100, Math.max(0, props.handPercentile)))
const threshLeft = computed(() => Math.min(100, Math.max(0, props.thresholdPct)))
const inside = computed(() => props.handPercentile < props.thresholdPct)
</script>

<template>
  <div class="rb">
    <div class="rb__track">
      <div class="rb__open" :style="{ width: threshLeft + '%' }"></div>
      <div class="rb__line" :style="{ left: threshLeft + '%' }">
        <span class="rb__line-label">open ≤ {{ thresholdPct }}%</span>
      </div>
      <div
        class="rb__hand"
        :class="{ 'rb__hand--in': inside, 'rb__hand--out': !inside }"
        :style="{ left: handLeft + '%' }"
      ></div>
    </div>
    <div class="rb__ends">
      <span>strongest</span>
      <span>weakest</span>
    </div>
  </div>
</template>

<style scoped>
.rb { width: 100%; }
.rb__track {
  position: relative;
  height: 16px;
  border-radius: 8px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-line);
  overflow: visible;
}
.rb__open {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 8px 0 0 8px;
  background: linear-gradient(90deg, rgba(76, 175, 125, 0.5), rgba(76, 175, 125, 0.22));
}
.rb__line {
  position: absolute;
  top: -4px;
  bottom: -4px;
  width: 2px;
  background: var(--color-gold);
  transform: translateX(-1px);
}
.rb__line-label {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.06em;
  color: var(--color-gold-soft);
}
.rb__hand {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid #0a1410;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
}
.rb__hand--in { background: var(--color-good-soft); }
.rb__hand--out { background: var(--color-bad-soft); }
.rb__ends {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-muted-2);
}
</style>
