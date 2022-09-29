<template>
  <main @click="debug()" ref="main">
    <KeyEvents
      @keyup.space="debug()"
      @keyup.ctrl.z="proj.undo()"
      @keyup.ctrl.y="proj.redo()"
      @keyup.p="field.togglePerspective()"
      @keyup.a="selectAll"
      @keyup.o="(fStore.form as any) = new CircleForm(selStore.selection)"
      @keyup.b="makeBlock(true)"
      @keyup.+="fStore.formOrGeneric.scale(1.25, 1.25)"
      @keyup.-="fStore.formOrGeneric.scale(.8, .8)"
      @keyup.[="fStore.formOrGeneric.rotate(-8)"
      @keyup.]="fStore.formOrGeneric.rotate(8)"
      @keyup.up="fStore.formOrGeneric.move(0, 2)"
      @keyup.right="fStore.formOrGeneric.move(2, 0)"
      @keyup.down="fStore.formOrGeneric.move(0, -2)"
      @keyup.left="fStore.formOrGeneric.move(-2, 0)"
      @keyup.enter.stop="fStore.form?.apply()"
      @keyup.esc.stop="escape" />
    <div class="wrapper" ref="wrapper">
      <Field ref="field"></Field>
      <div class="timeline">
        <button class="play" @click="play">▶</button>
        <button class="create-picture" @click="proj.newPicture()">+</button>
        <ul class="pictures" @mouseout="proj.tempCurrentPictureId = ''">
          <li v-for="pic in proj.getPictures()" @mouseover="proj.tempCurrentPictureId = pic.pictureId"
            :class="{selected: proj.storedCurrentPictureId == pic.pictureId}">
            <button @click="proj.setCurrentPicture(pic.pictureId)">
              {{pic.pictureId}}
            </button>
            <div class="popup-menu">
              <button @click="proj.resetPicture(pic.pictureId)">Reset to previous</button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </main>
</template>
<script setup lang="ts">

import KeyEvents from '../components/keyevents.vue'
import Field from './Field.vue'
import { useFormStore, usePdStore, useSelectionStore } from '../stores/DrillProject';
import { onMounted, ref } from 'vue';
import { makeBlock } from '../util/formOperations';

import { CircleForm } from '@/forms/CircleForm';

const proj: any = usePdStore();
const selStore = useSelectionStore();
const fStore = useFormStore();

const main = ref<HTMLDivElement>();
const wrapper: any = ref<HTMLDivElement>();

const field = ref();

// for debugging
const log = console.log;
function debug() {
  console.log(fStore.form);
}

onMounted(() => {
  resizeField();
  ['resize', 'fullscreenchange'].forEach(ev =>
    setTimeout(() => window.addEventListener(ev, resizeField)), 300);
});

function resizeField() {
  if (!wrapper.value) return;
  const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  let fieldWidth: string;
  if (vh < wrapper.value.offsetHeight) {
    fieldWidth = 95 * (vh / wrapper.value.offsetHeight) + 'vw';
  } else if (vw < wrapper.value.offsetWidth) {
    fieldWidth = 95 * (vw / wrapper.value.offsetWidth) + 'vw';
  } else {
    fieldWidth = '95vw';
  }
  field.value.field.style.setProperty('--field-width', fieldWidth);
}

function play() {
  field.value.animating = true;
  field.value.marchers.marchersEl.classList.toggle('animating');
  field.value.field.addEventListener('animationend', animationEnd)
}

function animationEnd(e) {
  if (e.animationName != 'empty') return;
  field.value.field.removeEventListener('animationend', animationEnd);
  const nextPictureId = proj.nextPictureId;
  log('next',nextPictureId)
  if (nextPictureId) {
    // log('setnext', nextPictureId)
    proj.setCurrentPicture(nextPictureId);
    field.value.field.addEventListener('animationend', animationEnd);
    if (!proj.nextPictureId) {
      field.value.marchers.marchersEl.classList.remove('animating');
    }
  } else {
    field.value.animating = false;
    field.value.marchers.marchersEl.classList.remove('animating');
  }
}

function selectAll() {
  field.value.field.querySelectorAll('.field .marcher').forEach(e => {
    selStore.selection.select(e);
  });
}

function escape() {
  if (fStore.form) {
    fStore.form.cancel(); fStore.form = null;
  } else {
    proj.reset(true, true, true);
  }
}

</script>

<style lang="scss">
main {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
}


.wrapper {
  perspective: 100vw;
  user-select: none;

  &:has(.field.perspective) * {
    transform-style: preserve-3d;
  }
}

.timeline {
  display: flex;
  width: 100vw;
  height: 2rem;
  background: rgb(50 50 50 / .8);
}

.pictures {
  list-style: none;
  padding: 0;
}

.pictures li {
  display: inline;
  opacity: .9;

  &:hover {
    opacity: 1;
  }

  & button {
    background: white;
  }

  &.selected>button {
    border: .2rem solid hsl(var(--hue-selection) 100% 70% / 1);
  }

  & .popup-menu {
    max-height: 0rem;
    position: absolute;
    overflow: hidden;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
  }

  &.selected:hover .popup-menu {
    max-height: 10rem;
  }
}
</style>