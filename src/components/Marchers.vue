<template>
    <div class="marchers no-transition" ref="marchersEl" draggable="true"
        @animationend="e => util.resetAnimation(e.target)"
        @dragstart.exact="onDragStart($event,false)"
        @dragstart.shift="onDragStart($event,true)"
        @drag="onDrag" @dragend="onDragEnd"
        @dragenter="dropAllowed" @dragover="dropAllowed"
        @mousedown.self.exact="if (proj.form) proj.form.apply(); selStore.selection.unselect()">
        <Marcher v-for="marcher in proj.getMarchers()" :drillNumber="marcher.drillNumber" @tap="onMarcherTap"
            @mouseover="e => selStore.hoveredEl = e.target.closest('.marcher')"
            @mouseout="e => selStore.hoveredEl == e.target.closest('.marcher') ? selStore.hoveredEl = undefined : ''"
            :ref="pushMarcherRef" />
        <div class="handle nw"></div>
        <div class="handle ne"></div>
        <div class="handle se"></div>
        <div class="handle sw"></div>
    </div>
</template>

<script setup lang="ts">

import { usePdStore, useTempStore } from '@/stores/DrillProject';
import type { Coord } from '@/stores/ProjectTypes';
import { onMounted, ref, type Ref } from 'vue';
import Marcher from '../components/Marcher.vue';
import * as util from '../util/util';

const proj = usePdStore();
const selStore = useTempStore();
const marchersEl: Ref<HTMLDivElement | null> = ref(null);
const marcherRefs: Ref<any[]> = ref([]);
const isAnimating = ref(false);

onMounted(() => {
    proj.setMarcherRefs(marcherRefs);
    setTimeout(() => {
        marchersEl.value?.classList.remove('no-transition')
    }, 100);
});

function pushMarcherRef(r) {
    marcherRefs.value.push(r);
}

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
            const notReplace = isShift || (mEl != null && selStore.selection.includes(mEl));
            selStore.selection.select(mEl, !notReplace);
        }

        const startCoords = fieldCoords(e, false);

        if (startCoords) {
            proj.formOrGeneric.dragStart = { x: startCoords?.x, y: startCoords?.y };
            proj.formOrGeneric.dragStartCenter = { ...selStore.selection.centerCurrent };
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
    selStore.selection.select(marcher, type != 'shift');
}

defineExpose({
    marchersEl,
    isAnimating
})

</script>

<style lang="scss">
.marchers {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 999;
    user-select: none;
    --marchToNextDuration: 1s;

    @keyframes marchToNext {
        from {
            left: var(--storedLeft);
            top: var(--storedTop);
        }

        to {
            left: var(--nextLeft);
            top: var(--nextTop);
        }
    }

    @keyframes empty {
        from {}

        to {}
    }

    &.animating {
        animation: var(--marchToNextDuration) linear empty forwards;
        animation-play-state: running;
        transition: none;
    }

    &.animating .marcher {
        animation: var(--marchToNextDuration) linear marchToNext forwards;
        animation-play-state: running;
        transition: none;
    }

    &,
    & .marcher {
        animation-play-state: paused;
    }
}


.marchers.no-transition .marcher {
    transition: none !important;
}

.handle {
    background: none;
    height: 0px;
    position: absolute;
    width: 0px;

    &.nw {
        left: 0;
        top: 0;
    }

    &.ne {
        right: 0;
        top: 0;
    }

    &.se {
        right: 0;
        bottom: 0;
    }

    &.sw {
        left: 0;
        bottom: 0;
    }
}
</style>