<template>
    <div class="form info" v-if="proj.form">
        <div>
            {{ proj.form.applied ? 'changes saved ✅' : 'changes pending...' }}
        </div>
        <div class="form-options">
            <div v-for="(v,k) in proj.form.args" :class="{'form-arg' : 1, 'newline' : v.newRow}">
                <p>{{v.name}}</p>
                <input :type="v.type" step="1" :placeholder="v+''" :value="calc.round(proj.form[k])"
                    @keyup.up.stop @keyup.down.stop
                    @keyup="proj.form?.update()"
                    @input="onInput($event, k, v)">
            </div>
            <button class="form-arg newline" @click="proj.form?.apply()">APPLY</button>
            <button class="form-arg" @click=" proj.form?.cancel(); proj.form=null">CANCEL</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { usePdStore } from '@/stores/DrillProject';
import * as calc from '@/util/calc'

const proj = usePdStore();

function onInput(e, k, v) {
    let val = e.target![v.bindAttr || 'value'];
    if (val != undefined && val != null) {
        if (v.type == 'number') { val = +val; }
        if (!v.valid || v.valid(val)) {
            proj.form![k] = val;
            proj.form?.update();
        } else {
            e.target![v.bindAttr || 'value'] = proj.form![k];
        }
    } else {
        e.target![v.bindAttr || 'value'] = proj.form![k];
    }
}

</script>

<style lang="scss">
.form.info {
    left: 0;
    top: 0;

    & input {
        min-width: 100%;
        max-width: 3rem;

        &[type="checkbox"] {
            min-width: unset;
        }
    }

    & .form-options {
        display: grid;
        gap: .12rem;
        grid-auto-columns: min-content;
        max-width: 8rem;
    }

    & .form-arg {
        display: inline-block;
        grid-column-start: none;

        &.newline {
            grid-column-start: 1;
        }
    }
}
</style>