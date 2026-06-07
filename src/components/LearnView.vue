<script setup lang="ts">
import { ref } from 'vue'
import RangeChart from './RangeChart.vue'
import TutorialsDrill from './TutorialsDrill.vue'

type Sub = 'ranges' | 'guides'

const sub = ref<Sub>('guides')
</script>

<template>
  <div class="flex flex-col flex-1 gap-3">
    <!-- Sub-navigation pill toggle -->
    <div class="flex gap-2 self-center bg-surface rounded-xl p-1 border border-line">
      <button
        v-for="opt in ([{ id: 'guides', label: 'Guides' }, { id: 'ranges', label: 'Range chart' }] as const)"
        :key="opt.id"
        class="px-4 py-1.5 rounded-lg text-[12.5px] font-semibold transition-colors duration-150 border-0 cursor-pointer"
        :class="sub === opt.id
          ? 'bg-surface-2 text-gold-soft shadow-[0_0_0_1px_var(--color-line-gold)_inset]'
          : 'bg-transparent text-fg-soft'"
        @click="sub = opt.id"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- Panel -->
    <TutorialsDrill v-if="sub === 'guides'" />
    <RangeChart v-else />
  </div>
</template>
