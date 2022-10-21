<template>
    <div v-if='tempStore.selection.length > 0' class="sel-hover info">
        <div>
            {{ '[selection of ' + tempStore.selection.length + ']' }}
            <br />
            {{ ui.fieldX(tempStore.selection.center.x)}}
            <br />
            {{ ui.fieldY(tempStore.selection.center.y)}}
            <br />
            {{ tempStore.selection.targets.items.map(i => i?.element?.getAttribute('drillNumber')).join(', ')}}
        </div>
    </div>
    <div v-else-if='tempStore.hoveredEl' class="sel-hover info">
        <div>
            {{tempStore.hoveredEl?.getAttribute('drillNumber') }}
            <br />
            {{ ui.fieldX(tempStore.hoveredEl?.getAttribute('x'))}}
            <br />
            {{ ui.fieldY(tempStore.hoveredEl?.getAttribute('y'))}}
        </div>
    </div>
</template>

<script setup lang="ts">
import { useTempStore } from '@/stores/DrillProject';
import * as ui from '@/util/ui'

const tempStore = useTempStore();

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