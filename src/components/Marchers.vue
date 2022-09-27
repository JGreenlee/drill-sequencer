<template>
    <div class="marchers no-transition" ref="marchersEl" draggable="true"
        @dragstart.exact="onDragStart($event,false)"
        @dragstart.shift="onDragStart($event,true)"
        @drag="onDrag" @dragend="onDragEnd"
        @dragenter="dropAllowed" @dragover="dropAllowed"
        @mousedown.self.exact="if (proj.form) proj.form.apply(); proj.selection.unselect()">
        <Marcher v-for="marcher in proj.getMarchers()" :drillNumber="marcher.drillNumber" @tap="onMarcherTap"
            @mouseover="e => proj.hoveredEl = e.target.closest('.marcher')"
            @mouseout="e => proj.hoveredEl == e.target.closest('.marcher') ? proj.hoveredEl = undefined : ''"
            :ref="'marcherRefs'" />
        <div class="handle nw"></div>
        <div class="handle ne"></div>
        <div class="handle se"></div>
        <div class="handle sw"></div>
    </div>
</template>

<script setup lang="ts">

import { projectDataStore } from '@/stores/DrillProject';
import type { Coord } from '@/stores/ProjectTypes';
import { onMounted, ref, type Ref } from 'vue';
import Marcher from '../components/Marcher.vue';
import * as util from '../util/util';

const proj = projectDataStore();
const marchersEl: Ref<HTMLDivElement | null> = ref(null);
const marcherRefs: Ref<any[]> = ref([]);

onMounted(() => {
    proj.setMarcherRefs(marcherRefs);
    setTimeout(() => marchersEl.value?.classList.remove('no-transition'), 100);
});

function fieldCoords(e, round) {

    if (!e.target || !(e.target instanceof HTMLElement) || !e.clientX || !e.clientY
        || !marchersEl.value) return

    let coord: Coord | undefined;
    if (marchersEl.value.parentElement?.classList.contains('perspective')) {
        const c = util.convertPointFromPageToNode(marchersEl.value, e);
        if (c) {
            coord = c;
        }
    } else {
        let parentBounds = marchersEl.value.getBoundingClientRect();
        coord = {
            x: (e.clientX - parentBounds.left) / marchersEl.value.clientWidth,
            y: (parentBounds.bottom - e.clientY) / marchersEl.value.clientHeight
        }
    }
    if (coord) {
        coord.x = coord.x * 160
        coord.y = coord.y * 84;
    }
    return coord;
}

function calcPositionOnDrag(e, displayOnly?) {

    const coord = fieldCoords(e, false);
    console.log('lfejf');

    if (coord && proj.form?.dragStart && proj.form.dragStartCenter) {
        proj.form.dragDeltaX = coord.x - proj.form.dragStart.x;
        proj.form.centerX = proj.form.dragStartCenter.x + proj.form.dragDeltaX;
        proj.form.dragDeltaY = coord.y - proj.form.dragStart.y;
        proj.form.centerY = proj.form.dragStartCenter.y + proj.form.dragDeltaY;
        proj.form.update(displayOnly);
    }
}

function onDrag(e?: MouseEvent) {
    if (e!.offsetX % 2 == 0) {
        if ((e?.target as HTMLElement).classList.contains('marcher')) {
            calcPositionOnDrag(e, true);
        }
    }
}

function onDragStart(e, isShift: boolean) {

    if (e && e.target instanceof HTMLElement && (e.target as HTMLElement).classList.contains('marcher')) {

        marchersEl.value?.classList.add('no-transition');

        e.dataTransfer.setDragImage(e.target, -99999, -99999);
        e.dataTransfer.effectAllowed = 'move';

        if (marchersEl.value) {
            const mEl: HTMLDivElement | null = marchersEl.value.querySelector(`[drillNumber=${e.target.getAttribute('drillNumber')}]`);
            const notReplace = isShift || (mEl != null && proj.selection.includes(mEl));
            proj.selection.select(mEl, !notReplace);
        }

        const startCoords = fieldCoords(e, false);

        if (startCoords) {
            proj.formOrGeneric.dragStart = { x: startCoords?.x, y: startCoords?.y };
            proj.formOrGeneric.dragStartCenter = { ...proj.selection.centerCurrent };
        }
    } else {
        e.preventDefault();
    }
}

function onDragEnd(e) {
    if ((e?.target as HTMLElement).classList.contains('marcher')) {
        calcPositionOnDrag(e);
    }
    marchersEl.value?.classList.remove('no-transition');
}

const dropAllowed = e => { e.preventDefault(); e!.dataTransfer!.dropEffect = 'move' }

function onMarcherTap(type: string, drillNumber: string) {
    if (!marchersEl.value) return console.error('marchersEl ref was invalid');
    const marcher: HTMLDivElement | null = marchersEl.value.querySelector(`[drillNumber=${drillNumber}]`);
    proj.selection.select(marcher, type != 'shift');
}

</script>

<style lang="scss">
.marchers.no-transition .marcher {
    transition: none !important;
}
</style>