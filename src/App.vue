<script setup lang="ts">
import safeStringify from '@sindresorhus/safe-stringify';
import { onMounted } from 'vue';
import { RouterView } from 'vue-router'
import { usePdStore } from './stores/DrillProject';

function createStack<T>(current: T) {
  const stack = [current]

  let index = stack.length

  function update() { 
    current = stack[index - 1]
    return current
  }

  return {
    push: (value: T | ((payload: T) => T)) => {
      stack.length = index
      // @ts-expect-error: Value can be a function
      stack[index++] = typeof value === 'function' ? value(current) : value

      return update()
    },
    undo: () => {
      console.log('stack', stack);
      console.log('index', index);

      if (index > 1)
        index -= 1
      return update()
    },
    redo: () => {
      if (index < stack.length)
        index += 1
      return update()
    },
  }
}

onMounted(() => {
  const store : any = usePdStore();
  const stack = createStack(JSON.parse(safeStringify(store.$state)))
  let preventUpdateOnSubscribe = false;
  store.undo = () => {
    preventUpdateOnSubscribe = true
    const undo = stack.undo();
    console.log('undo', undo.pd.marchers[0].dots[0].coord.x);
    store.$patch(undo)
  }
  store.redo = () => {
    preventUpdateOnSubscribe = true;
    const redo = stack.redo()
    console.log('redo', redo.pd.marchers[0].dots[0].coord.x);
    store.$patch(redo)
  }
  store.$subscribe(() => {
    if (preventUpdateOnSubscribe) {
      preventUpdateOnSubscribe = false
      return
    }
    const clone = JSON.parse(safeStringify(store.$state))
    const pushed = stack.push(clone);
    // console.log('pushing', pushed.pd.marchers[0].dots[0].coord.x);
  }, {
    flush: 'sync'
  })
})
</script>

<template>
  <header>
  </header>

  <RouterView />
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 5rem;
}
</style>
