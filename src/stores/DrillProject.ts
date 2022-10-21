import { type Ref, reactive } from 'vue';
import { $computed, $ref, $$ } from 'vue/macros';
import { useStorage } from '@vueuse/core';
import { defineStore } from 'pinia';

import { formClasses } from '@/forms/index';
import type { Form } from '@/forms/Form';
import { GenericForm } from '@/forms/GenericForm';
import type Marcher from '@/components/Marcher.vue';
import { MarcherSelection } from '@/stores/MarcherSelection';
import type { ProjectData, Coord } from '@/util/ProjectTypes';
import * as starterProject from '@/util/starterBlock.json';
import * as ui from '@/util/ui';

let stack;

export function initStack() {
  stack = createStack(ui.exclusiveStringify(getState()));
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
  if (p.form) {
    store.form = reconstructForm(p.form)
    setTimeout(() => {
      store.form?.recalculate();
    })
  }
}

export function reconstructForm(partial: Partial<Form>) {
  const className = partial.className;
  return new (formClasses)[className!](partial);
}

export const usePdStore = defineStore('projectData', () => {

  const pd: Ref<ProjectData> = useStorage('projectData', starterProject);
  const storedCurrentPictureId: Ref<string> = useStorage('currentPictureId', '0');
  let tempCurrentPictureId: string = $ref('');
  const snapToGrid = $ref(true);
  let marcherRefs: InstanceType<typeof Marcher>[];

  let form = $ref<Form | null>();

  function formOrGeneric() {
    if (form && form.applied) {
      return form;
    } else {
      return form = new GenericForm();
    }
  }

  function saveForm(newFormId) {
    if (form) {
      const forms = getPicture(currentPictureId)?.forms;
      if (!forms) throw TypeError('cannot save form when forms is falsy');
      forms[newFormId] = Object.fromEntries(Object.entries(form).filter(([key]) => !form?.doNotSerialize?.includes(key)));
      form.marcherDrillNumbers.forEach(dn => {
        const dot = pd.value.marchers.find(m => m.drillNumber == dn)?.dots[currentPictureId];
        if (dot)
          dot.formId = newFormId;
      });
    } else {
      throw TypeError('Cannot save form because it is falsy');
    }
    form = null;
  }

  function editForm(formId: string) {
    console.log('editform');
    const formData = getPicture(currentPictureId)?.forms[formId];
    console.log(formData);

    if (formData) {
      const partial = Object.fromEntries(Object.entries(formData).filter(([key]) => !formData.doNotSerialize?.includes(key)));
      console.log('formbef', form);
      console.log('partial', partial);

      form = reconstructForm(partial);
      console.log('formaft', form);

      setTimeout(() => {
        form?.recalculate();
      })
    } else {
      throw TypeError('could not reconstruct form, stored formData was falsy')
    }
  }

  function clearForm() {
    form = null;
  }

  const currentPictureId = $computed(() => tempCurrentPictureId || storedCurrentPictureId.value);

  function asComponent(marcher: HTMLDivElement | string) {
    let dn;
    if (typeof marcher == 'string') {
      dn = marcher;
    } else {
      dn = marcher.getAttribute('drillNumber');
    }
    if (!dn) throw TypeError('could not get drillNumber of ' + marcher);
    const m = marcherRefs.find(c => c.drillNumber == dn);
    if (!m) throw TypeError('could not find component of ' + dn);
    return m;
  }

  const getTitle = $computed(() => pd.value.projectTitle);

  // pictureOffset = -1 -> previous picture 
  // pictureOffset = 0 -> current picture 
  // pictureOffset = 1 -> next picture 
  function getMarcherDot(drillNumber: string, pictureId: string, pictureOffset?) {
    const p = getPicture(pictureId, pictureOffset);
    if (p)
      pictureId = p.pictureId;

    const m = pd.value.marchers.find(m => m.drillNumber == drillNumber);
    if (m) {
      const dot = m.dots[pictureId];
      if (dot && dot.coord) {
        return dot.coord;
      } else {
        // no dot found. create from previous picture
        const prevPicture = getPicture(pictureId, -1);
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
        const prevPicture = getPicture(pictureId, -1);
        if (prevPicture) {
          m.dots[drillNumber] = { ...m.dots[prevPicture.pictureId] };
        } else {
          console.error('Could not access prev picture');

        }
      }
    }
  }

  function getPictures() {
    return pd.value.pictures;
  }

  const nextPictureId = $computed(() => {
    const currentIndex = pd.value.pictures.findIndex(p => p.pictureId == currentPictureId);
    const next = pd.value.pictures[currentIndex + 1];
    if (next == undefined) {
      return null;
    }
    return next.pictureId;
  });

  const numPicturesLeft = $computed(() => {
    const currentIndex = pd.value.pictures.findIndex(p => p.pictureId == currentPictureId);
    return pd.value.pictures.length - currentIndex - 1;
  });

  // pictureOffset = -1 -> previous picture 
  // pictureOffset = 0 -> current picture 
  // pictureOffset = 1 -> next picture 
  function getPicture(currentPictureId, pictureOffset?) {
    const currentIndex = pd.value.pictures.findIndex(p => p.pictureId == currentPictureId);
    const p = pd.value.pictures[currentIndex + (pictureOffset || 0)];
    if (p == undefined) {
      return null;
    }
    return p;
  }

  function newPicture() {
    let newPictureId;
    if (nextPictureId) {
      newPictureId = (Number(currentPictureId) + Number(nextPictureId)) / 2;
    } else {
      newPictureId = Number(currentPictureId) + 1;
    }
    const i = pd.value.pictures.findIndex(p => p.pictureId == currentPictureId);
    pd.value.pictures.splice(i + 1, 0, {
      pictureId: newPictureId + '',
      countsToNext: 8,
      forms: {}
    });
    setCurrentPicture(newPictureId);
    resetPicture(newPictureId);
  }

  function resetPicture(pictureId) {
    const prevPicture = getPicture(pictureId, -1);
    if (prevPicture) {
      pd.value.marchers.forEach((m) => {
        m.dots[pictureId].coord = { ...m.dots[prevPicture.pictureId].coord };
      });
    }
  }

  function deletePicture(pictureId) {
    const prevId = getPicture(pictureId, -1)?.pictureId;
    pd.value.pictures = pd.value.pictures.filter(p => p.pictureId != pictureId);
    pd.value.marchers.forEach(m => {
      delete m.dots[pictureId];
    });
    setCurrentPicture(prevId || getPictures()[0].pictureId);
  }

  function getMarchers() {
    return pd.value.marchers;
  }

  function setCurrentPicture(id) {
    storedCurrentPictureId.value = id;
    tempCurrentPictureId = '';
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


  // TODO reimplement undo/redo
  const undo = () => {
    // const undo = stack.undo();
    // patch(undo);
  }
  const redo = () => {
    // const redo = stack.redo();
    // patch(redo);
  }
  const pushChange = () => {
    // const clone = ui.exclusiveStringify(getState());

    // stack.push(clone);
  }

  return $$({
    pd,
    form,
    currentPictureId,
    nextPictureId,
    tempCurrentPictureId,
    storedCurrentPictureId,
    numPicturesLeft,
    snapToGrid,
    getTitle,
    formOrGeneric,
    saveForm,
    editForm,
    clearForm,
    asComponent,
    getMarchers,
    getMarcherDot,
    getPictures,
    newPicture,
    resetPicture,
    deletePicture,
    setCurrentPicture,
    setMarcherDot,
    setMarcherRefs,
    reset,
    undo,
    redo,
    pushChange
  })
});

export const useTempStore = defineStore('temp', () => {

  const pdStore = usePdStore();

  // public
  const selection = reactive(new MarcherSelection());
  const hoveredEl: HTMLDivElement | null = $ref();

  return {
    selection,
    hoveredEl,
  }
})