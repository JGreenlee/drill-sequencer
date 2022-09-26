import type { Coord, ProjectData } from './ProjectTypes';
import { MarcherSelection } from "./MarcherSelection";
import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia';
import { computed, reactive, ref, watch, type Ref } from 'vue';
import * as starterProject from '../util/starterProject.json'

export const projectDataStore = defineStore('projectData', () => {

  const pd: Ref<ProjectData> = useStorage('projectData', starterProject); //private
  // const pd: any = null;
  const currentPictureId: Ref<string> = useStorage('currentPictureId', '0'); //public
  const snapToGrid = ref(true); //public
  let marcherRefs: Ref<any[]>;

  const hoveredEl = ref<HTMLDivElement>();

  undo: {
    omit: ['pd', 'selection', 'hoveredEl', 'pending', 'marcherRefs']
  }

  // public
  const selection = reactive(new MarcherSelection(asComponent));
  const pending = ref<any>(null);

  watch(pending, () => {
    if (pending.update) {
      console.log('trying update');

      pending.update();
    } else {
      console.log('not found upda');

    }
  });

  // public
  function asComponent(marcherEl: HTMLDivElement) {
    const dn = marcherEl.getAttribute('drillNumber');
    if (!dn) return console.error('marcher does not have drillNumber', marcherEl);
    const m = marcherRefs.value.find(c => c.drillNumber == dn);
    if (!m) return console.error("couldn't find component of " + marcherEl);
    return m;
  }

  // public
  const getTitle = computed(() => pd.value.projectTitle);

  // public
  function getMarcherDot(drillNumber: string, picturedId: string) {
    return pd.value.marchers.find(m => m.drillNumber == drillNumber)?.dots.find(p => p.pictureId == picturedId);
  }

  function setTitle(t: string) { pd.value.projectTitle = t; }

  // public
  function setMarcherDot(drillNumber: string, pictureId: string, coord: Coord) {
    if (coord.x == null || coord.y == null) {
      console.error('Coord to set marcher ' + drillNumber + ' is null. Not setting');
      return;
    }

    const dot = pd.value.marchers.find(m => m.drillNumber == drillNumber)?.dots.find(p => p.pictureId == pictureId);
    if (dot) {
      dot.coord = { ...coord };
    } else {
      console.error("Can't find dot for " + drillNumber + " at picture " + pictureId);
    }
  }

  function getPictures() {
    return pd.value.pictures;
  }

  // public
  function getMarchers() {
    return pd.value.marchers;
  }

  function getPicture(pictureId: string) {
    return pd.value.pictures.find(p => { p.pictureId == pictureId })
  }

  function setMarcherRefs(refs) {
    marcherRefs = refs;
  }

  // public
  function reset(areYouSure?, areYouReallySure?, areYouAbsolutelySure?) {
    if (areYouSure && areYouReallySure && areYouAbsolutelySure) {
      localStorage.removeItem('projectData');
      window.location.reload();
    }
  }

  return {
    currentPictureId,
    selection,
    pending,
    hoveredEl,
    snapToGrid,
    getTitle,
    asComponent,
    getMarchers,
    getMarcherDot,
    setMarcherDot,
    setMarcherRefs,
    reset,
  }
});