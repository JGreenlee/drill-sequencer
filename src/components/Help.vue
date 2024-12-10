<script setup lang="ts">
import { usePdStore } from '@/stores/DrillProject';
import { ref } from 'vue'

const proj = usePdStore();
const showHelp = ref(false)
</script>

<template>
    <div v-if="!proj.form" class="help info" @mouseenter="showHelp = true" @mouseleave="showHelp = false">
        <span v-if="!showHelp" style="font-size: large;">
            <svg width="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>help</title><path d="M10,19H13V22H10V19M12,2C17.35,2.22 19.68,7.62 16.5,11.67C15.67,12.67 14.33,13.33 13.67,14.17C13,15 13,16 13,17H10C10,15.33 10,13.92 10.67,12.92C11.33,11.92 12.67,11.33 13.5,10.67C15.92,8.43 15.32,5.26 12,5A3,3 0 0,0 9,8H6A6,6 0 0,1 12,2Z" fill="#eee" /></svg></span>
        <div v-if="showHelp">
            <h3>List of keyboard shortcuts</h3>
            <ul>
                <li>
                    <code>I</code>
                    <span>Arrange into line</span>
                </li>
                <li>
                    <code>B</code>
                    <span>Arrange into block</span>
                </li>
                <li>
                    <code>O</code>
                    <span>Arrange into circle/oval</span>
                </li>
                <li>
                    <code>[</code>
                    <span>Rotate CCW</span>
                </li>
                <li>
                    <code>]</code>
                    <span>Rotate CW</span>
                </li>
                <li>
                    <code>+</code>
                    <span>Make larger</span>
                </li>
                <li>
                    <code>-</code>
                    <span>Make smaller</span>
                </li>
                <li>
                    <code>Enter</code>
                    <span>Apply</span>
                </li>
                <li>
                    <code>Ctrl+Z</code>
                    <span>Undo</span>
                </li>
                <li>
                    <code>Ctrl+Y</code>
                    <span>Redo</span>
                </li>
                <li>
                    <code>Esc</code>
                    <span>⚠️ Reset back to starter project</span>
                </li>
            </ul>
        </div>

    </div>
</template>

<style scoped lang="scss">
.help {
    min-width: 3rem;
    min-height: 3rem;
    position: fixed;
    top: 0;
    left: 0;
    padding: 1rem;
    font-size: 1rem;
    li code {
        display: inline-block;
        width: 5rem;    
    }
}
</style>