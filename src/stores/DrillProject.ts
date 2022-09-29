import { useStorage } from '@vueuse/core';
import { type Ref, ref, computed, reactive } from 'vue';
import type { Form } from '../forms/Form';
import { GenericForm } from '../forms/GenericForm';
import { MarcherSelection } from '../stores/MarcherSelection';
import type { ProjectData, Coord } from '../stores/ProjectTypes';
import * as starterProject from '../util/starterBlock.json'
import { defineStore } from 'pinia';
import * as util from '../util/util'

let stack;
const excludeKeys = ['selection'];

export function initStack() {
  stack = createStack(util.exclusiveStringify(getState(), excludeKeys));
}

function createStack(current: string) {
  const stack = [current];
  let index = 0;
  function update() {
    current = stack[index]
    return JSON.parse('{' + current + '}')
  }
  return {
    push: (value: string) => {
      stack.length = index + 1;
      index++;
      stack.push(value);
      console.log('pushed', stack);
      return update()
    },
    undo: () => {
      if (index > 0)
        index -= 1
      return update()
    },
    redo: () => {
      if (index < stack.length - 1)
        index += 1
      return update()
    },
  }
}

function getState() {
  return usePdStore().$state;
}

function patch(p) {
  const store = usePdStore();
  store.$patch(p);
  console.log(p);

  if (p.form) {
    setTimeout(() => store.form?.recalculate())
  }
}

export const usePdStore = defineStore('projectData', () => {

  const pd: Ref<ProjectData> = useStorage('projectData', starterProject);
  const storedCurrentPictureId: Ref<string> = useStorage('currentPictureId', '0');
  const tempCurrentPictureId: Ref<string> = ref('');
  const snapToGrid = ref(true);
  let marcherRefs: Ref<any[]>;

  const form = ref<Form | null>();
  const formOrGeneric = computed(() => {
    if (form.value && !form.value.applied) {
      return form.value;
    } else {
      return form.value = new GenericForm();
    }
  });

  const currentPictureId = computed(() => tempCurrentPictureId.value || storedCurrentPictureId.value);

  function asComponent(marcherEl: HTMLDivElement) {
    const dn = marcherEl.getAttribute('drillNumber');
    if (!dn) return console.error('marcher does not have drillNumber', marcherEl);
    const m = marcherRefs.value.find(c => c.drillNumber == dn);
    if (!m) return console.error("couldn't find component of " + marcherEl);
    return m;
  }

  const getTitle = computed(() => pd.value.projectTitle);

  // pictureOffset = -1 -> previous picture 
  // pictureOffset = 0 -> current picture 
  // pictureOffset = 1 -> next picture 
  function getMarcherDot(drillNumber: string, pictureId: string, pictureOffset?) {
    if (pictureOffset < 0) {
      pictureId = getPrevPicture(pictureId)?.pictureId
    } else if (pictureOffset > 0) {
      pictureId = getNextPicture(pictureId)?.pictureId || pictureId;
    }
    const m = pd.value.marchers.find(m => m.drillNumber == drillNumber);
    if (m) {
      const dot = m.dots[pictureId];
      if (dot && dot.coord) {
        return dot.coord;
      } else {
        console.error("Couldn't find dot for " + drillNumber + " at picture " + pictureId + '. Creating from previous picture');
        const prevPicture = getPrevPicture(pictureId);
        if (prevPicture) {
          m.dots[pictureId] = { ...m.dots[prevPicture.pictureId] }
        }
      }
    }
  }

  function setTitle(t: string) { pd.value.projectTitle = t; }

  function setMarcherDot(drillNumber: string, pictureId: string, coord: Coord) {
    if (coord.x == null || coord.y == null) {
      console.error('Coord to set marcher ' + drillNumber + ' is null. Not setting');
      return;
    }

    const m = pd.value.marchers.find(m => m.drillNumber == drillNumber);
    if (m) {
      const dot = m.dots[pictureId];
      if (dot && dot.coord) {
        dot.coord = { ...coord };
      } else {
        console.error("Couldn't find dot for " + drillNumber + " at picture " + pictureId + '. Creating from previous picture');
        const prevPicture = getPrevPicture(pictureId);
        m.dots[drillNumber] = { ...m.dots[prevPicture.pictureId] };
      }
    }
  }

  function getPictures() {
    return pd.value.pictures;
  }

  function getPrevPicture(currentPictureId) {
    const currentIndex = pd.value.pictures.findIndex(p => p.pictureId == currentPictureId);
    return pd.value.pictures[currentIndex - 1];
  }

  const nextPictureId = computed(() => {
    const currentIndex = pd.value.pictures.findIndex(p => p.pictureId == currentPictureId.value);
    const next = pd.value.pictures[currentIndex + 1];
    if (next == undefined) {
      return null;
    }
    return next.pictureId;
  });

  const numPicturesLeft = computed(() => {
    const currentIndex = pd.value.pictures.findIndex(p => p.pictureId == currentPictureId.value);
    return pd.value.pictures.length - currentIndex - 1;
  });

  function getNextPicture(currentPictureId) {
    const currentIndex = pd.value.pictures.findIndex(p => p.pictureId == currentPictureId);
    const next = pd.value.pictures[currentIndex + 1];
    if (next == undefined) {
      return null;
    }
    return next;
  }

  function newPicture() {
    let newPictureId;
    if (nextPictureId.value) {
      newPictureId = (Number(currentPictureId.value) + Number(nextPictureId.value)) / 2;
    } else {
      newPictureId = Number(currentPictureId.value) + 1;
    }
    pd.value.pictures.push({
      pictureId: newPictureId + '',
      countsToNext: 8
    })
  }

  function resetPicture(pictureId) {
    const prevPicture = getPrevPicture(pictureId);
    pd.value.marchers.forEach((m) => {
      m.dots[pictureId].coord = { ...m.dots[prevPicture.pictureId].coord };
    });
  }

  function getMarchers() {
    return pd.value.marchers;
  }

  function getPicture(pictureId: string) {
    return pd.value.pictures.find(p => { p.pictureId == pictureId })
  }

  function setCurrentPicture(id) {
    storedCurrentPictureId.value = id;
    tempCurrentPictureId.value = '';
    pushChange();
  }

  function setMarcherRefs(refs) {
    marcherRefs = refs;
  }

  function reset(areYouSure?, areYouReallySure?, areYouAbsolutelySure?) {
    if (areYouSure && areYouReallySure && areYouAbsolutelySure) {
      localStorage.removeItem('projectData');
      window.location.reload();
    }
  }

  const undo = () => {
    const undo = stack.undo();
    console.log('undo', undo.pd.value);
    patch(undo);
  }
  const redo = () => {
    const redo = stack.redo()
    console.log('redo', redo.pd.value.marchers[0].dots[0].coord.x);
    patch(redo);
  }
  const pushChange = () => {
    const clone = util.exclusiveStringify(getState(), excludeKeys);
    stack.push(clone);
  }

  return {
    pd,
    form,
    formOrGeneric,
    currentPictureId,
    nextPictureId,
    tempCurrentPictureId,
    storedCurrentPictureId,
    numPicturesLeft,
    snapToGrid,
    getTitle,
    asComponent,
    getMarchers,
    getMarcherDot,
    getPictures,
    newPicture,
    resetPicture,
    setCurrentPicture,
    setMarcherDot,
    setMarcherRefs,
    reset,
    undo,
    redo,
    pushChange
  }
});

export const useTempStore = defineStore('temp', () => {

  const pdStore = usePdStore();

  // public
  const selection = reactive(new MarcherSelection(pdStore.asComponent));
  const hoveredEl = ref<HTMLDivElement>();

  return {
    selection,
    hoveredEl,
  }
})