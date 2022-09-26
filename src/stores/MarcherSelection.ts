import { reactive, type Ref } from "vue";
import { projectDataStore } from "./DrillProject";

import * as util from '../util/util'

export class MarcherSelection {

    targets: { items: MarcherSelectionItem[] } = reactive({ items: [] });
    center = { x: 0, y: 0 };
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
        this.updateCenter();
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
        this.updateCenter();
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
    updateCenter() {
        let sumX = 0, sumY = 0;
        this.targets.items.forEach((t) => {
            sumX += t.component.storedCoord.x;
            sumY += t.component.storedCoord.y;
        });
        this.center = { x: util.roundCalc(sumX / this.length), y: util.roundCalc(sumY / this.length) };

        this.targets.items.forEach((i) => {
            const c = i.component;
            const myX = c.storedCoord.x;
            const myY = c.storedCoord.y;
            c.relativeCoordToSelection.x = myX - this.center.x;
            c.relativeCoordToSelection.y = myY - this.center.y;
            c.relativeCoordToSelection.bearing = util.calcBearing(this.center.x, this.center.y, myX, myY);
        });
    }
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