
<template>
  <div class="field-wrapper">
    <div class="field" ref="field" :class="{perspective: isPerspective}">
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
      <Marchers ref="marchers"></Marchers>
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

import Marchers from '../components/Marchers.vue'
import { ref, type Ref } from 'vue';
import Selecto from 'vue3-selecto';

import { useTempStore } from '@/stores/DrillProject';

const tempStore = useTempStore();
let isPerspective: Ref<boolean> = ref(false);
const field = ref<HTMLDivElement>();
const marchers = ref<HTMLDivElement>();

function onSelect(selectoEvent) {
  tempStore.selection.add(selectoEvent.added.map(s => s.parentElement));
  tempStore.selection.remove(selectoEvent.removed.map(s => s.parentElement));
}

function togglePerspective() {
  isPerspective.value = !isPerspective.value;
}

defineExpose({
  field,
  marchers,
  togglePerspective
})

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
  --yardline-thickness: .05vw;
  --tpl-major-grid-color: hsl(var(--hue-editor) 50% 17% / .5);
  --tpl-minor-grid-color: hsl(var(--hue-editor) 50% 37% / 0.25);
  --cam-level: .5;
  --x-rotation: calc(90deg * (1 - var(--cam-level)));
  --hash-distance: 33.4%;
  font-size: calc(var(--field-width)*.012);
  width: 100%;
  max-width: var(--field-width);
  aspect-ratio: 40/21;
  line-height: 0;
  position: relative;
  margin: auto;
  transform: rotateX(0) scale(1) translateY(0);
  transition: transform .5s;

  &.perspective {
    transform: rotateX(var(--x-rotation)) scale(1.1) translateY(-6vw);
    --dark-turf-green: hsl(124 50% 32% / .9);
    --light-turf-green: hsl(124 50% 36% / .9);
    --yardlines-white: hsl(124 44% 90% / 1);
    --yardline-thickness: 0.1vw;
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

.field.perspective .side1>div:not(:last-child) span:not(:empty):before {
  position: absolute;
  content: '';
  width: 0;
  height: 0;
  left: -1.3vw;
  top: -0.3vw;
  border-top: 0.3vw solid transparent;
  border-bottom: 0.3vw solid transparent;
  border-right: 1vw solid var(--yardlines-white);
}

.field.perspective .side2>div span:not(:empty):after {
  position: absolute;
  content: '';
  width: 0;
  height: 0;
  right: -.8vw;
  top: -0.3vw;
  border-top: 0.3vw solid transparent;
  border-bottom: 0.3vw solid transparent;
  border-left: 1vw solid var(--yardlines-white);
}

.field .side>div span.yardline-numbers {
  color: var(--yardline-numbers-white);
  text-align: center;
  padding: 0;
  position: absolute;
  left: 100%;
  translate: calc(-50% + 0.32vw) 0;
  top: 15.2%;
  letter-spacing: .5vw;
  font-size: 2.6vw;
  font-weight: bold;
  z-index: 998;
}

.field.perspective .side>div span.yardline-numbers {
  text-shadow:
    0 0.15vw .1vw rgb(0 0 0 / 30%),
    .15vw 0 .1vw rgb(0 0 0 / 30%),
    0 -.15vw .1vw rgb(0 0 0 / 30%),
    -.15vw 0 .1vw rgb(0 0 0 / 30%);
}

.field .side>div span.yardline-numbers:nth-child(even) {
  top: 84.8%;
}

.field .side>div span.hash:not(.side2>div:last-child .hash) {
  position: absolute;
  width: 1vw;
  height: 0.3vw;
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
  font-size: .8vw;
  padding: .5vw;
  line-height: 1;
  color: white;
  position: absolute;
  background-color: rgb(0 0 0 / 80%);
  user-select: none;
}
</style>