<template>
    <div v-if='selStore.selection.length > 0' class="sel-hover info">
        <div>
            {{ '[selection of ' + selStore.selection.length + ']' }}
            <br />
            {{ util.fieldX(selStore.selection.center.x)}}
            <br />
            {{ util.fieldY(selStore.selection.center.y)}}
            <br />
            {{ selStore.selection.targets.items.map(i => i?.element?.getAttribute('drillNumber')).join(', ')}}
        </div>
    </div>
    <div v-else-if='selStore.hoveredEl' class="sel-hover info">
        <div>
            {{selStore.hoveredEl?.getAttribute('drillNumber') }}
            <br />
            {{ util.fieldX(selStore.hoveredEl?.getAttribute('x'))}}
            <br />
            {{ util.fieldY(selStore.hoveredEl?.getAttribute('y'))}}
        </div>
    </div>
</template>

<script setup lang="ts">
import { useSelectionStore } from '@/stores/DrillProject';
import * as util from '../util/util'

const selStore = useSelectionStore();

</script>

<style lang="scss">
    
.sel-hover {
    max-width: 10vw;
    right: 0;
    bottom: 0;
    border-radius: 1vw 0 0 0;
}

.sel-hover:hover {
    & div {
        display: none;
    }
}
</style>