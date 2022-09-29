<template>
    <div class="pending info" v-if="fStore.form">
        <div>
            {{ fStore.form.applied ? 'changes saved ✅' : 'changes pending...' }}
        </div>
        <div v-if="!fStore.form.applied" class="pending-options">
            <div v-for="(v,k) in fStore.form.args" class="pendingform">
                <p>{{v.name}}</p>
                <input :type="v.type" step="1" :placeholder="v+''" :value="util.roundCalc(fStore.form[k])"
                    @keyup.up.stop @keyup.down.stop
                    @keyup="(e:any) => {fStore.form?.update()}"
                    @input="(e:any) => {fStore.form![k] = +(e.target[v.bindAttr||'value']); fStore.form?.update();}">
            </div>
            <button @click="fStore.form?.apply()">APPLY</button>
            <button @click=" fStore.form?.cancel(); fStore.form=null">CANCEL</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useFormStore } from '@/stores/DrillProject';
import * as util from '../util/util'

const fStore = useFormStore();

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