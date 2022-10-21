<template>
  <div ref="marcherEl" v-bind="$attrs"
    draggable="true" :drillNumber="props.drillNumber" class="marcher"
    :class="{'selected': isSelected, 'form-selected': proj.form?.marcherDrillNumbers?.includes(props.drillNumber)}"
    :storedX="storedCoord.x" :storedY="storedCoord.y"
    :x="calc.round(currentCoord.x)" :nextX="nextCoord?.x"
    :y="calc.round(currentCoord.y)" :nextY="nextCoord?.y"
    :style="{left: ui.round(currentCoord.x) / 1.6 + '%', top: (84 - ui.round(currentCoord.y)) / 0.84 + '%'}"
    @click.exact="emit('tap', '', props.drillNumber)"
    @click.shift="emit('tap', 'shift', props.drillNumber)"
    @animationend="e => ui.resetAnimation(e.target)">
    <div ref="selectable" class="selectable">
    </div>
    <img src="../assets/bksprite.svg" draggable="false" />
    <img class="shadow" src="../assets/bksprite.svg" draggable="false" />
    <span>{{props.drillNumber}}</span>
  </div>
  <svg v-if="ghostCoord" class="ghost-path overlay" width="100%" height="100%" viewBox="0 0 160 84"
    xmlns="http://www.w3.org/2000/svg">
    <line :x1="currentCoord.x" :y1="84-currentCoord.y" :x2="ghostCoord.x" :y2="84-ghostCoord.y" stroke-width="0.05" />
  </svg>
</template>

<script setup lang="ts">

import { onMounted, reactive } from 'vue';
import { $computed, $ref, $$ } from 'vue/macros';

import { usePdStore, useTempStore } from '@/stores/DrillProject';
import type { Coord } from '@/util/ProjectTypes';
import * as ui from '@/util/ui';
import * as calc from '@/util/calc';

let isMounted: boolean = $ref(false);
const marcherEl: HTMLDivElement = $ref();
// const ghostEl: HTMLDivElement = $ref();
const selectable: HTMLDivElement = $ref();
const props = defineProps(['x', 'y', 'drillNumber']);
const emit = defineEmits(['tap']);

const proj = usePdStore();
const tempStore = useTempStore();

let currentCoord: Coord = reactive({
  x: 80,
  y: 56
});
const x = $computed(() => currentCoord.x);
const y = $computed(() => currentCoord.y);

const prevCoord = $computed(() => {
  const prevC = proj.getMarcherDot(props.drillNumber, proj.currentPictureId, -1);
  return prevC;
});

const nextCoord = $computed(() => {
  const nextC = proj.getMarcherDot(props.drillNumber, proj.currentPictureId, 1);
  if (nextC) {
    marcherEl?.style.setProperty('--nextLeft', ui.round(nextC.x) / 1.6 + '%');
    marcherEl?.style.setProperty('--nextTop', (84 - ui.round(nextC.y)) / 0.84 + '%');
  }
  return nextC;
});

const ghostCoord = $computed(() => {
  if (marcherEl?.parentElement?.classList.contains('animating')) {
    return nextCoord;
  } else {
    return prevCoord;
  }
});

const isSelected = $computed(() => {
  if (!isMounted) return;
  if (!marcherEl) return console.error('marcherEl is null for marcher ', props.drillNumber);
  return tempStore.selection.includes(props.drillNumber);
});

const formId = $computed(() =>
  proj.getMarchers().find(m => m.drillNumber == props.drillNumber)?.dots[proj.currentPictureId]?.formId
)

onMounted(() => {
  currentCoord.x = storedCoord.x;
  currentCoord.y = storedCoord.y;
  isMounted = true;
});

const storedCoord = $computed(() => {
  const c = proj.getMarcherDot(props.drillNumber, proj.currentPictureId) || { x: 999, y: -999 }
  setCurrentCoord(c.x, c.y);
  marcherEl?.style.setProperty('--storedLeft', ui.round(c.x) / 1.6 + '%');
  marcherEl?.style.setProperty('--storedTop', (84 - ui.round(c.y)) / 0.84 + '%');
  return (c);
});

function setDisplayCoord(newX, newY) {
  marcherEl.style.left = newX / 1.6 + '%';
  marcherEl.style.top = (84 - newY) / .84 + '%';
}

function setCurrentCoord(newX, newY) {
  currentCoord.x = calc.round(calc.clamp(newX, 0, 160));
  currentCoord.y = calc.round(calc.clamp(newY, 0, 84));
}

function setStoredCoord(newX, newY) {
  setCurrentCoord(newX, newY);
  applyCurrentCoord();
}

function setCurrentCoordByRef(c: Coord) {
  currentCoord = c;
}

function setStoredCoordByRef(c: Coord) {
  setCurrentCoordByRef(c);
  currentCoord = c;
}

function applyCurrentCoord() {
  proj.setMarcherDot(props.drillNumber, proj.currentPictureId, currentCoord);
}

defineExpose($$({
  drillNumber: props.drillNumber,
  currentCoord, x, y,
  marcherEl,
  formId,
  storedCoord,
  prevCoord,
  setCurrentCoord,
  setDisplayCoord,
  setStoredCoord,
  setCurrentCoordByRef,
  setStoredCoordByRef,
}));

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
  filter: drop-shadow(0em -0.4em 0.2em rgba(0, 0, 0, 0));
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
    width: 0.7em;
    height: 0.5em;
    bottom: 0;
    background: rgb(10 10 10 / .9);
    clip-path: polygon(50% 100%, 0% 0%, 100% 0%);
    translate: -50%;
  }
}

.marcher span {
  bottom: 0;
  opacity: 1;
  line-height: 1em;
  font-family: "Barlow Condensed", sans-serif;
  width: unset;
  height: unset;
  padding-bottom: 0.27em;
  font-weight: 900;
  color: white;
  scale: 0.8;
  translate: -50% 0%;
  z-index: 999;
  text-shadow:
    //  .2vw .2vw 0 #000,
    -.1vw -.1vw 0 #000,
    .1vw -.1vw 0 #000,
    -.1vw .1vw 0 #000,
    .1vw .1vw 0 #000;
}

.ghost-path {
  stroke: black;
  opacity: .5;
  z-index: -1;
  pointer-events: none;
  animation: .2s ease-in fade-in forwards;
}

.field.perspective .marchers.animating .ghost-path {
  display: none;
}

.marcher.form-selected~.ghost-path {
  opacity: 1;
  stroke: hsl(330, 100%, 20%);

  & line {
    stroke-width: 0.1;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: .5;
  }
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

.marcher.form-selected .selectable {
  filter: brightness(110%) saturate(150%);
  outline: .1em solid hsl(220 100% 50% / 0.8);
  // outline: .1em solid hsl(var(--hue-form-selection) 100% 39% / 0.6);
  background-color: hsl(220 100% 50% / 0.5);
  // background-color: hsl(var(--hue-form-selection) 100% 39% / 0.3);
}
</style>