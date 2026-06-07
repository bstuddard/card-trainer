<script setup lang="ts">
import { ref } from 'vue'

interface Section {
  heading: string
  items: string[]
}

interface Article {
  id: string
  title: string
  teaser: string
  sections: Section[]
}

const ARTICLES: Article[] = [
  {
    id: 'position',
    title: 'Position is Everything',
    teaser: 'Act last, win more — the button is worth more than any hand.',
    sections: [
      {
        heading: 'Why position dominates',
        items: [
          "Acting last means you see every opponent's decision before making yours — a massive information edge on every street.",
          'Post-flop position advantage is worth roughly 10–15% in long-run profitability over an equivalent hand played out of position.',
          'The button is the best seat. Small blind is the worst — you act second every post-flop street.',
        ],
      },
      {
        heading: 'Opening ranges by position',
        items: [
          'BTN (button): top 44% of hands — near half the deck is profitable here.',
          'CO (cutoff): top 29%',
          'HJ (hijack): top 21%',
          'EP (early position): top 14%',
          'UTG (under the gun): top 13% — only premiums; 5 opponents still to act.',
        ],
      },
      {
        heading: 'The golden rule',
        items: [
          "If you would fold it UTG, fold it from EP too. Save speculative hands for CO and BTN.",
          'A hand played in position can profitably call bets it would have to fold out of position.',
        ],
      },
    ],
  },
  {
    id: 'pot-odds',
    title: 'Pot Odds: The Break-Even Formula',
    teaser: 'One formula decides every call — know it cold.',
    sections: [
      {
        heading: 'The formula',
        items: [
          'Required equity = Bet ÷ (Pot + Bet + Call)  =  Bet ÷ (Pot + 2 × Bet)',
          'If your equity exceeds the threshold → call. Otherwise → fold. That is it.',
        ],
      },
      {
        heading: 'Common thresholds to memorise',
        items: [
          '¼ pot bet → need 17% equity',
          '½ pot bet → need 25% equity',
          '¾ pot bet → need 30% equity',
          'Pot-sized bet → need 33% equity',
          '2× pot bet → need 40% equity',
        ],
      },
      {
        heading: 'Worked example',
        items: [
          'Pot = $80, villain bets $60. Required = 60 ÷ (80 + 60 + 60) = 60 ÷ 200 = 30%.',
          'You have a flush draw: ~36% equity. Call — you have the edge.',
          'You have a gutshot: ~17% equity. Fold — math says no.',
          'The formula ignores the story villain tells — only the numbers matter.',
        ],
      },
    ],
  },
  {
    id: 'outs',
    title: 'Counting Outs',
    teaser: 'Every card that wins for you is an out. Count them fast with Rule of 2/4.',
    sections: [
      {
        heading: 'Common draw out counts',
        items: [
          'Flush draw (4 cards same suit): 9 outs',
          'Open-ended straight draw (OESD): 8 outs',
          'Gutshot (inside straight draw): 4 outs',
          'One overcard (e.g. Ace on low board): 3 outs',
          'Two overcards: 6 outs',
        ],
      },
      {
        heading: 'Rule of 2 / 4',
        items: [
          'Flop (2 cards left): outs × 4 ≈ equity %. Example: 9 outs → ~36%.',
          'Turn (1 card left): outs × 2 ≈ equity %. Example: 9 outs → ~18%.',
          'Accuracy is within 1–2% for most draws. Slightly overestimates with 15+ outs.',
        ],
      },
      {
        heading: 'Dirty outs and combo draws',
        items: [
          'A dirty out completes your draw but also completes a better hand for your opponent. Do not count it.',
          'Flush draw + OESD combo: use 15 outs, not 17. Two cards complete both draws — no double-counting.',
          'Subtract 1–2 outs when an out also improves the villain\'s hand.',
        ],
      },
    ],
  },
  {
    id: 'hand-selection',
    title: 'Preflop Hand Selection',
    teaser: "Most hands are trash. Here's how to filter them by position.",
    sections: [
      {
        heading: 'UTG range (~13%)',
        items: [
          'Pairs: TT+',
          'Aces: AJs+, AQo+',
          'Broadway: KQs, KQo',
          'Tight because 5 opponents can still 3-bet you into a bad spot.',
        ],
      },
      {
        heading: 'BTN range (~44%)',
        items: [
          'All pairs (22+), all Aces (A2s+, A2o+), most Kings and Queens.',
          'Suited connectors down to 65s and 54s.',
          'Wide because only BB and SB remain — neither has post-flop position on you.',
        ],
      },
      {
        heading: 'Key principles',
        items: [
          'Suited adds ~2–3% equity and flush potential. AKs > AKo, especially from early position.',
          'Low pairs (22–66): play from CO/BTN for set value. Need ~50bb stacks and implied odds.',
          "Limping is almost always wrong — a hand worth playing is worth raising. Limping kills your hand's value in multiway pots.",
        ],
      },
    ],
  },
  {
    id: 'stack-depth',
    title: 'Short Stacks — Push or Fold',
    teaser: 'Below 25 big blinds, most post-flop decisions disappear.',
    sections: [
      {
        heading: 'Why push/fold takes over',
        items: [
          'Stack-to-pot ratio (SPR) becomes tiny, removing multi-street decisions.',
          'A 3-bet non-all-in commits too much of your stack — might as well shove.',
          'Bluffing loses value. Hand strength and fold equity dominate.',
        ],
      },
      {
        heading: 'At 25bb (UTG)',
        items: [
          'Shove: TT+, A9s+, AJo+, KQs–KJs, QJs — top ~18% of hands.',
          'Everything else: fold.',
        ],
      },
      {
        heading: 'At 12bb (BTN)',
        items: [
          'Shove top ~60%: any pair, any Ace, K7o+, K2s+, Q8o+, J8s+, T8s+, 97s+.',
          'Even Q3o becomes a profitable shove — steal equity + hand equity exceed the risk.',
          'The longer you wait, the more you bleed to antes and blinds. Act before the math gets worse.',
        ],
      },
    ],
  },
  {
    id: 'heads-up',
    title: 'Heads-Up Adjustments',
    teaser: 'Heads-up is not 9-handed poker. Most hands flip from trash to playable.',
    sections: [
      {
        heading: 'Ranges widen dramatically',
        items: [
          'BTN opens ~80–93% of hands heads-up. Only 2 players; almost everything has positive EV.',
          'BB defends ~55–65% vs BTN opens — much wider than 6-max.',
          'Any Ace, any King, any pair: typically worth raising or calling heads-up.',
        ],
      },
      {
        heading: 'Aggression is the default',
        items: [
          'Near-constant c-betting and aggression is correct GTO play heads-up.',
          'Checking flop as BTN protects your checking range — treat it as strength, not weakness.',
          'Folding too often lets villain exploit with relentless aggression.',
        ],
      },
      {
        heading: 'River bet math',
        items: [
          'A ¾ pot river bet only needs to succeed 43% of the time to break even.',
          'Villain only needs to call 57% — they can fold hands that do not block bluffs.',
          'Most players under-bluff rivers → lean toward folding large river bets at showdown.',
        ],
      },
    ],
  },
  {
    id: 'made-hand-equity',
    title: 'How Strong Is Your Made Hand?',
    teaser: 'Outs are for draws. Once you have made a hand, you need a different yardstick.',
    sections: [
      {
        heading: 'Made hands vs draws',
        items: [
          'A draw has zero outs once it gets there — it is now a made hand, judged on how often it wins, not on cards still to come.',
          'The Rule of 2/4 estimates a draw\'s equity. It tells you nothing about a hand that is already complete.',
          'For made hands, think in tiers: roughly how often does this beat a random opponent who calls you down?',
        ],
      },
      {
        heading: 'Rough equity by hand class',
        items: [
          'Quads / full house: ~95% — essentially the nuts. Bet every street.',
          'Flush / straight: ~85% — strong, but two-suited or paired boards can beat you.',
          'Three of a kind: ~80% — dominant against pairs and draws.',
          'Two pair: ~70% — beats every single pair, loses to sets and completed draws.',
          'One pair: ~55% — decent, fragile. Top pair is far stronger than a low pair.',
        ],
      },
      {
        heading: 'Why a flat number lies',
        items: [
          'A made flush and a weak pair are not the same hand — treating both as "I am ahead" is the classic beginner leak.',
          'These tiers are estimates, not solver output. They assume a single opponent calling down a normal range.',
          'Use them to size bets: the higher your tier, the thinner the value you can extract.',
        ],
      },
    ],
  },
]

const selected = ref<Article | null>(null)

function open(a: Article) { selected.value = a }
function back() { selected.value = null }
</script>

<template>
  <!-- Article list -->
  <div v-if="!selected" class="flex flex-col gap-2.5">
    <div
      v-for="a in ARTICLES"
      :key="a.id"
      class="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-line bg-surface cursor-pointer"
      style="transition: transform 0.1s, background 0.15s;"
      @click="open(a)"
    >
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-fg leading-snug m-0">{{ a.title }}</p>
        <p class="text-[11px] text-muted mt-0.5 leading-snug m-0">{{ a.teaser }}</p>
      </div>
      <span class="text-muted-2 text-sm flex-shrink-0">›</span>
    </div>
  </div>

  <!-- Article detail -->
  <div v-else class="flex flex-col gap-0 animate-fade-in">
    <button
      class="flex items-center gap-1.5 text-[12px] font-mono text-muted mb-4 cursor-pointer bg-transparent border-0 p-0"
      @click="back"
    >
      ‹ back
    </button>

    <h2 class="font-display text-xl text-fg mb-1 leading-snug mt-0">{{ selected.title }}</h2>
    <p class="text-[12px] text-muted font-mono mb-5 mt-0">{{ selected.teaser }}</p>

    <div
      v-for="(sec, si) in selected.sections"
      :key="si"
      class="mb-5"
    >
      <p class="text-[11px] font-mono tracking-[0.08em] uppercase text-gold-soft mb-2 mt-0">
        {{ sec.heading }}
      </p>
      <ul class="flex flex-col gap-2 m-0 p-0 list-none">
        <li
          v-for="(item, ii) in sec.items"
          :key="ii"
          class="text-[13px] text-fg-soft leading-[1.55] pl-3 border-l border-line-2"
        >
          {{ item }}
        </li>
      </ul>
    </div>

    <button
      class="mt-2 flex items-center gap-1.5 text-[12px] font-mono text-muted cursor-pointer bg-transparent border-0 p-0"
      @click="back"
    >
      ‹ back to guides
    </button>
  </div>
</template>
