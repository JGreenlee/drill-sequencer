<template>
    <div style="display:none"></div>
</template>

<script lang="ts">
import { onBeforeUnmount } from 'vue';

const events = ['keyup'];
export default {
    emits: events,
    setup(props, context) {
        const handlers = {};
        events.forEach((evName) => {
            handlers[evName] = function (e) {
                context.emit(evName, e);
            }
            window.addEventListener(evName, handlers[evName]);
        });
        onBeforeUnmount(() => {
            events.forEach((evName) => {
                window.removeEventListener(evName, handlers[evName]);
            })
        })
    }
}

</script>