import { computed } from "@vue/reactivity";
import { reactive, type ComputedRef } from "vue";

import * as util from '../util/util'
import type { Coord } from "./ProjectTypes";

export class MarcherSelection {

    targets: { items: MarcherSelectionItem[] } = reactive({ items: [] });
    asComponent;
    // proj = projectDataStore();

    constructor(asComponent) {
        this.asComponent = asComponent;
    }

    get length() { return this.targets.items.length; }
    includes = (x) => {
        return this.targets.items.find(a => a.element == x || a.component == x);
    }

    unselect(e?) {
        if (e == undefined) {
            this.targets.items = [];
        } else if (e && this.includes(e)) {
            this.targets.items = this.targets.items.filter(i => i.element != e && i.component != e);
        }
    }
    select(marcherEl, isReplace?: boolean) {
        if (!marcherEl) return console.error('no marcher');
        // marcher.classList.add('selected');
        const item = new MarcherSelectionItem(marcherEl, this.asComponent);
        if (isReplace) {
            this.targets.items = [item];
        } else if (!this.includes(marcherEl)) {
            this.targets.items.push(item);
        }
    }
    add(toAdd: any[]) {
        toAdd.forEach((e) => {
            this.select(e);
        })
    }
    remove(toRemove: any[]) {
        toRemove.forEach((e) => {
            this.unselect(e);
        });
    }
    center: Coord | ComputedRef<Coord> = computed<Coord>(() => {        
        let sumX = 0, sumY = 0;
        this.targets.items.forEach((t) => {
            sumX += t.component.storedCoord.x;
            sumY += t.component.storedCoord.y;
        });
        return {
            x: util.roundCalc(sumX / (this.length || 1)),
            y: util.roundCalc(sumY / (this.length || 1))
        };
    });

    centerCurrent : Coord | ComputedRef<Coord> = computed(() => {
        let sumX = 0, sumY = 0;
        this.targets.items.forEach((i) => {
            sumX += i.component.currentCoord.x;
            sumY += i.component.currentCoord.y;
        });
        return {
            x: util.roundCalc(sumX / (this.length || 1)),
            y: util.roundCalc(sumY / (this.length || 1))
        };
    });
}

export class MarcherSelectionItem {
    element: HTMLDivElement;
    storedComponent?: any;
    asComponent;
    // proj = projectDataStore();

    constructor(el, asComponent) {
        this.element = el;
        this.asComponent = asComponent;
    }

    get component() {
        if (!this.storedComponent) {
            this.storedComponent = this.asComponent(this.element);
        }
        return this.storedComponent;
    }
}