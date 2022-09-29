<template>
  <div ref="marcherEl" draggable="true" :drillNumber="drillNumber" :class="{marcher: true, selected: isSelected}"
    :storedX="storedCoord.x" :storedY="storedCoord.y"
    :x="util.roundCalc(currentCoord.x)" :nextX="nextCoord?.x"
    :y="util.roundCalc(currentCoord.y)" :nextY="nextCoord?.y"
    :storedBearing="coordFromSel.bearing"
    :style="{left: util.roundUi(currentCoord.x) / 1.6 + '%', top: (84 - util.roundUi(currentCoord.y)) / 0.84 + '%'}"
    @click.exact="$emit('tap', '', drillNumber)"
    @click.shift="$emit('tap', 'shift', drillNumber)"
    @animationend="e => util.resetAnimation(e.target)">
    <div ref="selectable" class="selectable">
    </div>
    <img src="../assets/bksprite.svg" draggable="false" />
    <img class="shadow" src="../assets/bksprite.svg" draggable="false" />
    <span>{{drillNumber}}</span>
  </div>
</template>

<script setup lang="ts">

import { usePdStore, useSelectionStore } from '@/stores/DrillProject';
import type { Coord } from '../stores/ProjectTypes';
import { onMounted, reactive, ref, watch, type Ref } from 'vue';
import { computed } from '@vue/reactivity';

import * as util from '../util/util';

let isMounted = ref(false);
const marcherEl: Ref<HTMLDivElement | null> = ref(null);
const selectable: Ref<HTMLDivElement | null> = ref(null);
const props = defineProps(['x', 'y', 'drillNumber']);

let proj = usePdStore();
const selStore = useSelectionStore();

const currentCoord: Coord = reactive({
  x: 80,
  y: 56
});
const x = computed(() => currentCoord.x);
const y = computed(() => currentCoord.y);

const nextCoord = computed(() => {
  const nextC = proj.getMarcherDot(props.drillNumber, proj.currentPictureId, 1);
  if (nextC) {
    marcherEl.value?.style.setProperty('--nextLeft', util.roundUi(nextC.x) / 1.6 + '%');
    marcherEl.value?.style.setProperty('--nextTop', (84 - util.roundUi(nextC.y)) / 0.84 + '%');
  }
  return nextC;
});

const coordFromSel = reactive({
  x: computed(() => currentCoord.x - selStore.selection.center.x),
  y: computed(() => currentCoord.y - selStore.selection.center.y),
  bearing: computed(() => util.calcBearing(selStore.selection.center.x, selStore.selection.center.y, storedCoord.value.x, storedCoord.value.y))
});

const isSelected = computed(() => {
  if (!isMounted.value) return;
  if (!marcherEl.value) return console.error('marcherEl is null for marcher ', props.drillNumber);
  return selStore.selection.includes(marcherEl.value!);
});

onMounted(() => {
  currentCoord.x = storedCoord.value.x;
  currentCoord.y = storedCoord.value.y;
  isMounted.value = true;
});

const storedCoord = computed(() => {
  const c = proj.getMarcherDot(props.drillNumber, proj.currentPictureId) || { x: 999, y: -999 }
  setCurrentCoord(c.x, c.y);
  marcherEl.value?.style.setProperty('--storedLeft', util.roundUi(c.x) / 1.6 + '%');
  marcherEl.value?.style.setProperty('--storedTop', (84 - util.roundUi(c.y)) / 0.84 + '%');
  return (c);
});

function setDisplayCoord(newX, newY) {
  marcherEl.value!.style.left = newX / 1.6 + '%';
  marcherEl.value!.style.top = (84 - newY) / .84 + '%';
}

function setCurrentCoord(newX, newY) {
  currentCoord.x = util.roundCalc(util.clamp(newX, 0, 160));
  currentCoord.y = util.roundCalc(util.clamp(newY, 0, 84));
}

function setStoredCoord(newX, newY) {
  setCurrentCoord(newX, newY);
  applyCurrentCoord();
}

function applyCurrentCoord() {
  proj.setMarcherDot(props.drillNumber, proj.currentPictureId, currentCoord);
}

defineExpose({
  drillNumber: props.drillNumber,
  currentCoord, x, y,
  marcher: marcherEl,
  storedCoord,
  coordFromSel,
  setCurrentCoord,
  setDisplayCoord,
  setStoredCoord,
  applyCurrentCoord,
});

</script>

<style lang="scss">
.marcher {
  position: absolute;
  border-radius: 50%;
  text-align: center;
  transition: left .3s, top .3s, filter .5s;
  translate: -50% -100%;
  width: 1%;
  aspect-ratio: 1;
  filter: drop-shadow(0vw -0.4vw 0.2vw rgba(0, 0, 0, 0));
  transform: rotateX(0);
  transform-origin: bottom;
  cursor: grab;

  & img {
    opacity: 0;
    display: block;
  }

  &:after {
    content: "";
    position: absolute;
    border-left: .5vw solid transparent;
    border-right: .5vw solid transparent;
    border-top: 1vw solid rgb(10 10 10 / 90%);
    translate: -50% 0;
  }
}

.marcher span {
  opacity: 1;
  transform: translate(-50%, 20%);
  font-family: 'Barlow Condensed', sans-serif;
  width: min-content;
  height: 100%;
  font-size: .8vw;
  z-index: 999;
  font-weight: 900;
  color: white;
  text-shadow: 0.1vw 0.1vw black, -0.1vw -0.1vw black;
  -webkit-text-stroke: .2vw .2vw black;
  color: white;
  text-shadow:
    //  .2vw .2vw 0 #000,
    -.1vw -.1vw 0 #000,
    .1vw -.1vw 0 #000,
    -.1vw .1vw 0 #000,
    .1vw .1vw 0 #000;
}

.field.perspective {
  & .marcher {
    background-color: transparent;
    aspect-ratio: 1/3;
    border-radius: 0;
    transform: rotateX(calc(-.3 * 60deg / var(--cam-level)));

    & img.shadow {
      opacity: .5;
    }

    & img {
      opacity: 1;
    }

    & span {
      opacity: 0;
    }

    &:after {
      opacity: 0;
    }
  }
}

.marcher * {
  width: 100%;
  height: 100%;
  position: absolute;
}

.marcher img.shadow {
  transform: rotateX(60deg) skewX(-10deg);
  filter: brightness(0) blur(0.2vw);
  translate: 25% 25%;
  z-index: -1;
  opacity: 0;
  // transition: opacity .5s;
  pointer-events: none;
}

.marcher.selected .selectable {
  filter: brightness(110%) saturate(150%);
  outline: .1em solid hsl(var(--hue-selection) 100% 39% / 0.6);
  background-color: hsl(var(--hue-selection) 100% 39% / 0.3);
}
</style>