import { useTempStore } from "@/stores/DrillProject";
import type { Coord } from "@/stores/ProjectTypes";
import { reactive } from "vue";

import * as util from '../util/util';
import { Form } from "./Form";

export class GenericForm extends Form {

    args = reactive({
        centerX: { name: 'Center X', type: 'number' },
        centerY: { name: 'Center Y', type: 'number' },
        scaleX: { name: 'Scale X:', type: 'number' },
        scaleY: { name: 'Scale Y:', type: 'number' },
        rotation: { name: 'Rotation:', type: 'number' }
    });

    relativeDots = {};

    constructor() {
        super();
        this.storeRelativeDots();
        this.update();
    }

    storeRelativeDots() {
        this.selection.targets.items.forEach(i => {
            const marcher = i.component;
            this.relativeDots[marcher.drillNumber] = {
                x: marcher.coordFromSel.x,
                y: marcher.coordFromSel.y
            };
        });
    }

    recalculate(displayOnly?) {
        const center = this.selection.centerCurrent as Coord;
        this.selection.targets.items.forEach(i => {
            const marcher = i.component;
            const relativeDot = this.relativeDots[marcher.drillNumber];
            if (relativeDot) {
                let newX;
                let newY;
                // apply rotation
                if (this.rotation) {
                    const rotated = util.rotate(relativeDot, this.rotation);
                    newX = rotated.x;
                    newY = rotated.y;
                } else {
                    newX = relativeDot.x;
                    newY = relativeDot.y;
                }

                // apply scale
                if (this.scaleX != 1 || this.scaleY != 1) {
                    newX *= this.scaleX;
                    newY *= this.scaleY;
                }

                newX += this.centerX;
                newY += this.centerY;

                // display coord
                if (displayOnly) {
                    marcher.setDisplayCoord(newX, newY);
                } else {
                    marcher.setCurrentCoord(newX, newY);
                }
            }
        });
    }
}