import { reactive } from "vue";

import type Marcher from '@/components/Marcher.vue';
import * as calc from '@/util/calc'
import { usePdStore } from "./DrillProject";

export class MarcherSelection {

    targets: { items: MarcherSelectionItem[] } = reactive({ items: [] });

    get length() { return this.targets.items.length; }
    includes = (x) => {
        return this.targets.items.find(a => a.drillNumber == x);
    }

    unselect(e?) {
        if (!e == undefined) {
            this.targets.items = [];
        } else if (e) {
            this.targets.items = this.targets.items.filter(i => i.element != e && i.component != e);
        }
    }

    select(marcherEl, isReplace?: boolean) {
        if (!marcherEl) return console.error('no marcher');
        const comp = usePdStore().asComponent(marcherEl);
        if (comp.formId != undefined) {
            console.log('c', comp);
            usePdStore().editForm(comp.formId);
        }
        const item = new MarcherSelectionItem(comp.drillNumber);
        if (isReplace) {
            this.targets.items = [item];
        } else if (!this.includes(comp.drillNumber)) {
            this.targets.items.push(item);
        }
    }

    add(toAdd: []) {
        toAdd.forEach((e) => {
            this.select(e);
        })
    }

    remove(toRemove: []) {
        toRemove.forEach((e) => {
            this.unselect(e);
        });
    }

    get center() {
        let sumX = 0, sumY = 0;
        this.targets.items.forEach((t) => {
            sumX += t.component.storedCoord.x;
            sumY += t.component.storedCoord.y;
        });
        return {
            x: calc.round(sumX / (this.length || 1)),
            y: calc.round(sumY / (this.length || 1))
        };
    }

    get centerCurrent() {
        let sumX = 0, sumY = 0;
        this.targets.items.forEach((i) => {
            sumX += i.component.currentCoord.x;
            sumY += i.component.currentCoord.y;
        });
        return {
            x: calc.round(sumX / (this.length || 1)),
            y: calc.round(sumY / (this.length || 1))
        };
    }
}

export class MarcherSelectionItem {

    doNotSerialize = ['storedElement', 'storedComponent', 'tempData'];
    drillNumber: string;
    storedElement?: HTMLDivElement;
    storedComponent?: InstanceType<typeof Marcher>;
    tempData?: any;

    constructor(drillNumber) {
        this.drillNumber = drillNumber;
    }

    get component(): InstanceType<typeof Marcher> {
        if (!this.storedComponent)
            this.storedComponent = usePdStore().asComponent(this.drillNumber);
        return this.storedComponent!;
    }

    get element(): HTMLDivElement {
        if (!this.storedElement)
            this.storedElement = this.component.marcherEl;
        return this.storedElement!;
    }
}