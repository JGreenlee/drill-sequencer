<template>
    <div class="marchers no-transition" ref="marchersEl" draggable="true"
        @dragstart.exact="onDragStart($event,false)"
        @dragstart.shift="onDragStart($event,true)"
        @drag="onDrag" @dragend="onDragEnd"
        @dragenter="dropAllowed" @dragover="dropAllowed"
        @mousedown.self.exact="if (proj.pending) proj.pending.apply(); proj.selection.unselect()">
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
let grabbedAt: Coord;

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

        if (round) {
            coord.x = Math.round(coord.x);
            coord.y = Math.round(coord.y);
        }
    }

    return coord;
}

function calcPositionOnDrag(e) {

    const coord = fieldCoords(e, false);

    if (coord && proj.selection.length) {
        proj.pending.deltaX = coord.x - proj.pending.startX;
        proj.pending.deltaY = coord.y - proj.pending.startY;
        proj.pending.update();
    }
}

function updateDisplayCoords(target, newX, newY) {
    const marcher = proj.asComponent(target);
    marcher.setCurrentCoord(newX, newY);
}

function onDrag(e?: MouseEvent) {
    if (e && e.target instanceof HTMLElement && (e.target as HTMLElement).classList.contains('marcher')) {
        calcPositionOnDrag(e);
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

        // proj.asComponent(e.target);

        const startCoords = fieldCoords(e, false);
        console.log('startcoords', startCoords);

        proj.pending = {
            startX: startCoords?.x,
            startY: startCoords?.y,
            deltaX: 0,
            deltaY: 0,
            options: ['deltaX', 'deltaY', 'startX', 'startY'],
            applied: false,
            update: function () {
                proj.selection.targets.items.forEach(i => {
                    const m = i.component;
                    if (!m) return;
                    const newX = m.storedCoord.x + this.deltaX;
                    const newY = m.storedCoord.y + this.deltaY;
                    updateDisplayCoords(i.element, newX, newY);
                });
            },
            apply: function () {
                if (!this.applied) {
                    this.update();
                    this.applied = true;
                    if (proj.selection.length) {
                        proj.selection.targets.items.forEach(i => {
                            i.component.applyCurrentCoord();
                        });
                    }
                    proj.selection.updateCenter();
                    this.applied = true;
                }
            },
            cancel: function () {
                if (proj.selection.length) {
                    proj.selection.targets.items.forEach(i => {
                        const s = i.component.storedCoord;
                        i.component.setCurrentCoord(s.x, s.y);
                    });
                }
            }
        }
    } else {
        e.preventDefault();
    }
}

function onDragEnd(e) {
    setTimeout(() => {
        if (proj.pending) {
            proj.pending.apply();
        }
    }, 150);

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