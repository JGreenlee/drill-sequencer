
<template>
  <div class="field-wrapper">
    <div class="field" ref="fieldEl" :class="{perspective: isPerspective}">
      <div class="side side1">
        <div v-for="n in 10" v-bind:num-labels="10">
          <span class="yardline-numbers">{{n%2==0 || !isPerspective ? n*5 : '' }}</span>
          <span class="yardline-numbers">{{n%2==0 || !isPerspective ? n*5 : '' }}</span>
          <span class="hash"></span>
          <span class="hash"></span>
        </div>
      </div>
      <div class="side side2">
        <div v-for="n in 10" v-bind:num-labels="10">
          <span class="yardline-numbers">{{n%2==0 || !isPerspective ? 50 - n*5 || '' : '' }}</span>
          <span class="yardline-numbers">{{n%2==0 || !isPerspective ? 50 - n*5 || '' : '' }}</span>
          <span class="hash"></span>
          <span class="hash"></span>
        </div>
      </div>
      <div class="tpl grid"></div>
      <Marchers ref="marchers" />
    </div>
  </div>
  <button class="toggle-perspective" @click="togglePerspective">perspective</button>
  <Selecto ref="selecto" :dragCondition="e => e.inputEvent.target.classList.contains('marchers')"
    dragContainer=".marchers" v-bind:selectableTargets='[".marchers .selectable"]' v-bind:hitRate='0'
    v-bind:selectByClick='true' v-bind:selectFromInside='false' v-bind:toggleContinueSelect='["shift"]'
    v-bind:ratio='0' @select="onSelect">
  </Selecto>
</template>
<script setup lang="ts">

import { $ref, $$ } from 'vue/macros';
import Selecto from 'vue3-selecto';

import Marchers from '@/components/Marchers.vue'
import { useTempStore } from '@/stores/DrillProject';

const log = console.log;
const tempStore = useTempStore();
let isPerspective: boolean = $ref(false);
const fieldEl = $ref<HTMLDivElement | null>(null);
const marchers = $ref<InstanceType<typeof Marchers> | null>(null);

function onSelect(selectoEvent) {
  tempStore.selection.add(selectoEvent.added.map(s => s.parentElement));
  tempStore.selection.remove(selectoEvent.removed.map(s => s.parentElement));
}

function togglePerspective() {
  isPerspective = !isPerspective;
}

defineExpose($$({
  fieldEl,
  marchers,
  togglePerspective
}))

</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css?family=Barlow+Condensed:700');

.field-wrapper {
  perspective: 100vw;
  user-select: none;

  &:has(.field.perspective) * {
    transform-style: preserve-3d;
  }
}

.field {
  --field-width: 95vw;
  --dark-turf-green: hsl(var(--hue-editor) 3% 95% / 1);
  --light-turf-green: hsl(var(--hue-editor) 3% 100% / 1);
  --yardlines-white: hsl(var(--hue-editor) 5% 50% / 1);
  --yardline-numbers-white: hsl(var(--hue-editor) 3% 36% / .5);
  --yardline-thickness: .05em;
  --tpl-major-grid-color: hsl(var(--hue-editor) 50% 17% / .5);
  --tpl-minor-grid-color: hsl(var(--hue-editor) 50% 37% / 0.25);
  --cam-level: .5;
  --x-rotation: calc(90deg * (1 - var(--cam-level)));
  --hash-distance: 33.4%;
  --em: calc(var(--field-width)*.012);
  font-size: var(--em);
  width: 100%;
  max-width: var(--field-width);
  aspect-ratio: 40/21;
  line-height: 0;
  position: relative;
  margin: auto;
  transform: rotateX(0) scale(1) translateY(0);
  transition: transform .5s;

  &.perspective {
    transform: rotateX(var(--x-rotation)) scale(1.1) translateY(-6em);
    --dark-turf-green: hsl(124 50% 32% / .9);
    --light-turf-green: hsl(124 50% 36% / .9);
    --yardlines-white: hsl(124 44% 90% / 1);
    --yardline-thickness: 0.1em;
    --yardline-numbers-white: hsl(124 44% 90% / 1);
    --tpl-major-grid-color: rgb(0 0 0 / .5);
    --tpl-minor-grid-color: rgb(255 255 255 / .25);
  }
}

.field .side {
  background: repeating-linear-gradient(90deg,
      var(--dark-turf-green) 0%,
      var(--dark-turf-green) 50%,
      var(--light-turf-green) 50%,
      var(--light-turf-green) 100%),
    url('../assets/noise.svg');
  background-size: 20%;
  pointer-events: none;
  user-select: none;

  &:first-child {
    background: repeating-linear-gradient(-90deg,
        var(--dark-turf-green) 0%,
        var(--dark-turf-green) 50%,
        var(--light-turf-green) 50%,
        var(--light-turf-green) 100%),
      url('../assets/noise.svg');
    background-size: 20%;
  }
}

.field .side {
  width: 50%;
  height: 100%;
  display: inline-block;

  &>div {
    width: 10%;
    height: 100%;
    display: inline-block;

    &:before,
    &:after {
      content: '';
      position: absolute;
      width: var(--yardline-thickness);
      height: 100%;
      background-color: var(--yardlines-white);
      z-index: 99;
    }

    &:before {
      left: 0;
    }

    &:after {
      right: 0;
    }
  }
}

.field.perspective .side2 {
  z-index: -1;
}

.yardline-numbers:before,
.yardline-numbers:after {
  position: absolute;
  width: 0;
  height: 0;
  top: calc(-0.3 * var(--em));
  border: calc(0.3 * var(--em)) solid transparent;
}

.field.perspective .side1>div:not(:last-child) .yardline-numbers:not(:empty):before {
  content: '';
  left: calc(-1.3 * var(--em));
  border-right: var(--em) solid var(--yardlines-white);
}

.field.perspective .side2 .yardline-numbers:not(:empty):after {
  content: '';
  right: calc(-0.8 * var(--em));
  border-left: var(--em) solid var(--yardlines-white);
}

.field .yardline-numbers {
  color: var(--yardline-numbers-white);
  text-align: center;
  padding: 0;
  position: absolute;
  left: 100%;
  translate: calc(-50% + calc(.32 * var(--em))) 0;
  top: 15.2%;
  letter-spacing: calc(.5*var(--em));
  font-size: calc(2.6 * var(--em));
  font-weight: bold;
  z-index: 998;
}

.field.perspective .yardline-numbers {
  text-shadow:
    0 0.07em .05em rgb(0 0 0 / 12%),
    .07em 0 .05em rgb(0 0 0 / 12%),
    0 -.07em .05em rgb(0 0 0 / 12%),
    -.07em 0 .05em rgb(0 0 0 / 12%);
}

.field .side>div span.yardline-numbers:nth-child(even) {
  top: 84.8%;
}

.field .side>div span.hash:not(.side2>div:last-child .hash) {
  position: absolute;
  width: 1em;
  height: 0.3em;
  background-color: var(--yardlines-white);
  right: 0;
  translate: 50% -50%;
  z-index: 99;
  top: var(--hash-distance);
}

.field .side>div span.hash:not(.side2>div:last-child .hash):nth-child(even) {
  top: calc(100% - var(--hash-distance));
}

.field>.tpl {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  transition: opacity .5s;
}

.field>.tpl.grid {
  --four-steps: calc(var(--field-width)*0.025);
  --one-step: calc(var(--four-steps) / 4);
  --major-thickness: .08em;
  --minor-thickness: .05em;
  background-image:
    linear-gradient(var(--tpl-major-grid-color) var(--major-thickness), transparent var(--major-thickness)),
    linear-gradient(90deg, var(--tpl-major-grid-color) var(--major-thickness), transparent var(--major-thickness)),
    linear-gradient(var(--tpl-minor-grid-color) var(--minor-thickness), transparent var(--minor-thickness)),
    linear-gradient(90deg, var(--tpl-minor-grid-color) var(--minor-thickness), transparent var(--minor-thickness));
  background-size:
    var(--four-steps) var(--four-steps),
    var(--four-steps) var(--four-steps),
    var(--one-step) var(--one-step),
    var(--one-step) var(--one-step);
  opacity: .5;
}

.field.perspective>.tpl.grid {
  opacity: 0;
}

.toggle-perspective {
  position: fixed;
  right: .5rem;
  top: .5rem;
}

.selecto-selection {
  background: hsl(270 100% 80% / 0.04) !important;
  border: .1em dashed hsl(270 100% 25% / 0.8) !important;
}

.info {
  font-size: .6rem;
  padding: .4rem;
  line-height: 1;
  color: white;
  position: absolute;
  background-color: rgb(0 0 0 / 80%);
  user-select: none;
}
</style>