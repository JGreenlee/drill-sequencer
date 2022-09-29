<template>
  <main @click="debug()" ref="main">
    <KeyEvents
      @keyup.space="debug()"
      @keyup.ctrl.z="proj.undo()"
      @keyup.ctrl.q.prevent="proj.pushChange()"
      @keyup.ctrl.y="proj.redo()"
      @keyup.p="field.togglePerspective()"
      @keyup.a="selectAll"
      @keyup.o="(proj.form as any) = new CircleForm()"
      @keyup.b="makeBlock(true)"
      @keyup.+="proj.formOrGeneric.scale(1.25, 1.25)"
      @keyup.-="proj.formOrGeneric.scale(.8, .8)"
      @keyup.[="proj.formOrGeneric.rotate(-8)"
      @keyup.]="proj.formOrGeneric.rotate(8)"
      @keyup.up="proj.formOrGeneric.move(0, 2)"
      @keyup.right="proj.formOrGeneric.move(2, 0)"
      @keyup.down="proj.formOrGeneric.move(0, -2)"
      @keyup.left="proj.formOrGeneric.move(-2, 0)"
      @keyup.enter.stop="proj.form?.apply()"
      @keyup.esc.stop="escape" />
    <div class="wrapper" ref="wrapper">
      <Field ref="field"></Field>
      <div class="timeline">
        <button class="play-pause" @click="playPause">{{field?.marchers?.isAnimating?'⏸':'▶'}}</button>
        <button class="create-picture" @click="proj.newPicture()">+</button>
        <ul class="pictures" @mouseout="proj.tempCurrentPictureId = ''">
          <li v-for="pic in proj.getPictures()" @mouseover="proj.tempCurrentPictureId = pic.pictureId"
            :class="{selected: proj.storedCurrentPictureId == pic.pictureId, shown: proj.tempCurrentPictureId == pic.pictureId}">
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
    <SelectionInfo />
    <PendingInfo />
  </main>
</template>
<script setup lang="ts">

import KeyEvents from '../components/keyevents.vue'
import Field from './Field.vue'
import SelectionInfo from '../components/SelectionInfo.vue';
import PendingInfo from '../components/PendingInfo.vue';
import { onMounted, ref } from 'vue';
import { makeBlock } from '../util/formOperations';

import { CircleForm } from '@/forms/CircleForm';
import { usePdStore, useTempStore } from '@/stores/DrillProject';

const proj: any = usePdStore();
const selStore = useTempStore();

const main = ref<HTMLDivElement>();
const wrapper: any = ref<HTMLDivElement>();

const field = ref();

// for debugging
function debug() {

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

function playPause() {
  field.value.marchers.isAnimating = !field.value.marchers.isAnimating;
  field.value.marchers.marchersEl.classList.toggle('animating');
  field.value.field.addEventListener('animationend', animationEnd)
}

function animationEnd(e) {
  if (e.animationName != 'empty') return;
  field.value.field.removeEventListener('animationend', animationEnd);
  const nextPictureId = proj.nextPictureId;
  if (nextPictureId) {
    proj.tempCurrentPictureId = nextPictureId;
    field.value.field.addEventListener('animationend', animationEnd);
    if (!proj.nextPictureId) {
      field.value.marchers.isAnimating = false;
      field.value.marchers.marchersEl.classList.remove('animating');
    }
  } else {
    field.value.marchers.isAnimating = false;
    field.value.marchers.marchersEl.classList.remove('animating');
  }
}

function selectAll() {
  field.value.field.querySelectorAll('.field .marcher').forEach(e => {
    selStore.selection.select(e);
  });
}

function escape() {
  if (proj.form) {
    proj.form.cancel(); proj.form = null;
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

.timeline {
  display: flex;
  width: 100vw;
  height: 2rem;
  background: rgb(50 50 50 / .8);
  padding: .2rem;

  &>button {
    width: 2rem;
  }
}

.pictures {
  display: flex;
  align-items: center;
  list-style: none;
}

.pictures li {
  display: inline;
  // position: relative;
  opacity: .9;

  &:hover {
    opacity: 1;
  }

  &.shown {
    opacity: 1;

    &>button {
      background-color: hsl(var(--hue-selection) 100% 92%);
      filter: brightness(150%);
    }
  }

  & button {
    // position: absolute;
    background: white;
    line-height: 1;
    // top: 0;
    // transform: translateY(-50%);
    transition: .1s border;
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