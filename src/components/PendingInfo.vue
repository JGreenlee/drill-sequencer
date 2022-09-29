<template>
    <div class="pending info" v-if="proj.form">
        <div>
            {{ proj.form.applied ? 'changes saved ✅' : 'changes pending...' }}
        </div>
        <div v-if="!proj.form.applied" class="pending-options">
            <div v-for="(v,k) in proj.form.args" class="pendingform">
                <p>{{v.name}}</p>
                <input :type="v.type" step="1" :placeholder="v+''" :value="util.roundCalc(proj.form[k])"
                    @keyup.up.stop @keyup.down.stop
                    @keyup="(e:any) => {proj.form?.update()}"
                    @input="(e:any) => {proj.form![k] = +(e.target[v.bindAttr||'value']); proj.form?.update();}">
            </div>
            <button @click="proj.form?.apply()">APPLY</button>
            <button @click=" proj.form?.cancel(); proj.form=null">CANCEL</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { usePdStore } from '@/stores/DrillProject';
import * as util from '../util/util'

const proj = usePdStore();

</script>

<style lang="scss">
.pending {
    left: 0;
    top: 0;

    & input {
        min-width: 100%;
        max-width: 3rem;

        &[type="checkbox"] {
            min-width: unset;
        }
    }

    & .pending-options {
        display: grid;
        gap: .12rem;
        grid-template-columns: 1fr 1fr;
        max-width: 8rem;
    }

    & .pending-arg {
        display: inline-block;
    }

    & .pending-arg.newline {
        display: block;
    }
}
</style>