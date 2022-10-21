<template>
  <main @click="debug()" ref="main">
    <KeyEvents
      @keyup.space="playPause()"
      @keyup.ctrl.c="proj.copy()"
      @keyup.ctrl.v="proj.paste()"
      @keyup.ctrl.z="proj.undo()"
      @keyup.ctrl.q.prevent="proj.pushChange()"
      @keyup.ctrl.y="proj.redo()"
      @keyup.p="field.togglePerspective()"
      @keyup.a="selectAll"
      @keyup.i="proj.form = new LineForm()"
      @keyup.o="proj.form = new CircleForm()"
      @keyup.b="proj.form = new BlockForm()"
      @keyup.+="proj.formOrGeneric().scale(1.25, 1.25)"
      @keyup.-="proj.formOrGeneric().scale(.8, .8)"
      @keyup.[="proj.formOrGeneric().rotate(-8)"
      @keyup.]="proj.formOrGeneric().rotate(8)"
      @keyup.up="proj.formOrGeneric().move(0, 2)"
      @keyup.right="proj.formOrGeneric().move(2, 0)"
      @keyup.down="proj.formOrGeneric().move(0, -2)"
      @keyup.left="proj.formOrGeneric().move(-2, 0)"
      @keyup.enter.stop="proj.form?.apply()"
      @keyup.esc.stop="escape" />
    <div class="wrapper" ref="wrapper">
      <div @mousemove="field.marchers?.isAnimating || (proj.tempCurrentPictureId &&= '')">
        <Field ref="field"></Field>
      </div>
      <div class="timeline">
        <button class="play-pause" @click="playPause()" @keyup.space.prevent>
          <b>{{field?.marchers?.isAnimating?'װ':'▶'}}</b>
        </button>
        <div class="button-column">
          <button class="create-picture" @click="proj.newPicture()">
            <i>+</i>
          </button>
          <button class="delete-picture" @click="proj.deletePicture(proj.currentPictureId)">
            <i>-</i>
          </button>
        </div>
        <ul class="pictures" @mouseout="!field?.marchers?.isAnimating && (proj.tempCurrentPictureId = '')">
          <li v-for="pic in proj.pd.pictures"
            :class="{ selected: proj.storedCurrentPictureId == pic.pictureId,
                      shown: proj.tempCurrentPictureId == pic.pictureId,
                      notshown: proj.tempCurrentPictureId && proj.tempCurrentPictureId != pic.pictureId
            }" @mouseover="!field?.marchers?.isAnimating && (proj.tempCurrentPictureId = pic.pictureId)">
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
    <FormInfo />
  </main>
</template>
<script setup lang="ts">

import { onMounted } from 'vue';
import { $ref } from 'vue/macros';

import KeyEvents from '@/components/keyevents.vue'
import SelectionInfo from '@/components/SelectionInfo.vue';
import FormInfo from '@/components/FormInfo.vue';
import Field from '@/views/Field.vue'
import { usePdStore, useTempStore } from '@/stores/DrillProject';
import { CircleForm } from '@/forms/CircleForm';
import { BlockForm } from '@/forms/BlockForm';
import { LineForm } from '@/forms/LineForm';

const proj = usePdStore();
const tempStore = useTempStore();

const main: HTMLDivElement = $ref();
const wrapper: HTMLDivElement = $ref();

const field: InstanceType<typeof Field> = $ref();

// for debugging
function debug() {
}

onMounted(() => {
  resizeField();
  ['resize', 'fullscreenchange'].forEach(evName =>
    setTimeout(() => window.addEventListener(evName, resizeField)), 300);
});

function resizeField() {
  if (!wrapper) return;
  const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  let fieldWidth: string;
  if (vh < wrapper.offsetHeight) {
    fieldWidth = 95 * (vh / wrapper.offsetHeight) + 'vw';
  } else if (vw < wrapper.offsetWidth) {
    fieldWidth = 95 * (vw / wrapper.offsetWidth) + 'vw';
  } else {
    fieldWidth = '95vw';
  }
  field.fieldEl?.style.setProperty('--field-width', fieldWidth);
}

function playPause() {
  proj.tempCurrentPictureId = '';

  console.log(field);
  console.log(field.marchers);

  if (field.marchers) {
    field.marchers.isAnimating = !field.marchers.isAnimating;
    if (field.marchers.isAnimating)
      proj.tempCurrentPictureId = proj.currentPictureId || '';
  }

  field.fieldEl?.addEventListener('animationend', animationEnd)
}

function animationEnd(e) {
  if (e.animationName != 'empty') return;
  field.fieldEl?.removeEventListener('animationend', animationEnd);
  const nextPictureId = proj.nextPictureId;
  if (nextPictureId) {
    proj.tempCurrentPictureId = nextPictureId;
    field.fieldEl?.addEventListener('animationend', animationEnd);
    if (!proj.nextPictureId) {
      if (field.marchers) field.marchers.isAnimating = false;
    }
  } else {
    if (field.marchers) field.marchers.isAnimating = false;
  }
}

function selectAll() {
  field.fieldEl?.querySelectorAll('.field .marcher').forEach(e => {
    tempStore.selection.select(e);
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
  gap: .1rem;

  &>button {
    width: 2rem;
    padding: 0;
    margin: 0;
  }

  & .button-column {
    display: flex;
    flex-direction: column;

    & button {
      height: 50%;

      & i {
        position: absolute;
        translate: -50% -50%;
        left: 50%;
        top: 50%;
      }
    }
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

  &.notshown {
    opacity: .6;
  }

  &.shown {
    opacity: 1;
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