<template>
    <div class="marchers" :class="{'animating': isAnimating, 'no-transition': isAnimating}" ref="marchersEl"
        draggable="true"
        @animationend.self="e => ui.resetAnimation(e.target)"
        @dragstart.exact="onDragStart($event,false)"
        @dragstart.shift="onDragStart($event,true)"
        @drag="onDrag" @dragend="onDragEnd"
        @dragenter="dropAllowed" @dragover="dropAllowed"
        @mousedown.self.exact="if (proj.form) proj.form.apply(); tempStore.selection.unselect()">
        <Marcher v-for="marcher in proj.getMarchers()" :drillNumber="marcher.drillNumber" @tap="onMarcherTap"
            @mouseover="e => tempStore.hoveredEl = (e.target as Element)?.closest('.marcher')"
            @mouseout="e => {if (tempStore.hoveredEl == (e.target as Element)?.closest('.marcher')) tempStore.hoveredEl = null}"
            :ref="pushMarcherRef" />
        <div class="handle nw"></div>
        <div class="handle ne"></div>
        <div class="handle se"></div>
        <div class="handle sw"></div>
    </div>
</template>

<script setup lang="ts">

import { onMounted } from 'vue';
import { $ref, $$ } from 'vue/macros';

import { usePdStore, useTempStore } from '@/stores/DrillProject';
import type { Coord } from '@/util/ProjectTypes';
import Marcher from '@/components/Marcher.vue';
import * as ui from '@/util/ui';

const proj = usePdStore();
const tempStore = useTempStore();
const marchersEl: HTMLDivElement = $ref();
const marcherRefs: InstanceType<typeof Marcher>[] = $ref([]);
const isAnimating: boolean = $ref(false);

onMounted(() => {
    proj.setMarcherRefs(marcherRefs);
    setTimeout(() => {
        marchersEl?.classList.remove('no-transition');
    }, 100);
});

function pushMarcherRef(r) {
    marcherRefs.push(r);
}

function fieldCoords(e, round) {

    if (!e.target || !(e.target instanceof HTMLElement) || !e.clientX || !e.clientY || !marchersEl) return

    let coord: Coord | undefined;
    if (marchersEl.parentElement?.classList.contains('perspective')) {
        const c = ui.convertPointFromPageToNode(marchersEl, e);
        if (c) {
            coord = c;
        }
    } else {
        let parentBounds = marchersEl.getBoundingClientRect();
        coord = {
            x: (e.clientX - parentBounds.left) / marchersEl.clientWidth,
            y: (parentBounds.bottom - e.clientY) / marchersEl.clientHeight
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

        marchersEl?.classList.add('no-transition');
        e.dataTransfer.setDragImage(e.target, -99999, -99999);
        e.dataTransfer.effectAllowed = 'move';

        if (marchersEl) {
            const dn = e.target.getAttribute('drillNumber');
            const mEl: HTMLDivElement | null = marchersEl.querySelector(`[drillNumber=${dn}]`);
            const notReplace = isShift || (mEl != null && tempStore.selection.includes(dn));
            tempStore.selection.select(mEl, !notReplace);
        }

        const startCoords = fieldCoords(e, false);

        if (startCoords) {
            proj.formOrGeneric().dragStart = { x: startCoords?.x, y: startCoords?.y };
            proj.formOrGeneric().dragStartCenter = { ...tempStore.selection.centerCurrent };
        }
    } else {
        e.preventDefault();
    }
}

function onDragEnd(e) {
    if ((e?.target as HTMLElement).classList.contains('marcher')) {
        calcPositionOnDrag(e);
    }
    marchersEl?.classList.remove('no-transition');
}

const dropAllowed = e => { e.preventDefault(); e!.dataTransfer!.dropEffect = 'move' }

function onMarcherTap(type: string, drillNumber: string) {
    if (!marchersEl) return console.error('marchersEl ref was invalid');
    const marcher: HTMLDivElement | null = marchersEl.querySelector(`[drillNumber=${drillNumber}]`);
    tempStore.selection.select(marcher, type != 'shift');
}

defineExpose($$({
    marchersEl,
    isAnimating
}))

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

        & .marcher {
            animation: var(--marchToNextDuration) linear marchToNext forwards;
            animation-play-state: running;
            transition: none;
        }
    }

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