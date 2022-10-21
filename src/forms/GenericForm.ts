import { useTempStore } from "@/stores/DrillProject";
import type { Coord } from "@/util/ProjectTypes";
import { reactive } from "vue";

import * as calc from '@/util/calc';
import { Form } from "@/forms/Form";

export class GenericForm extends Form {

    args = reactive({
        centerX: { name: 'Center X', type: 'number', newRow: 1 },
        centerY: { name: 'Center Y', type: 'number' },
        scaleX: { name: 'Scale X:', type: 'number', newRow: 1 },
        scaleY: { name: 'Scale Y:', type: 'number' },
        rotation: { name: 'Rotation:', type: 'number', newRow: 1 }
    });

    relativeDots = {};

    constructor(p?) {
        super(p);
        Object.assign(this, p);
        this.keepOrder = true;
        this.storeRelativeDots();
        this.update();
    }

    storeRelativeDots() {
        this.marchers.forEach(i => {
            const marcher = i.component;
            this.relativeDots[marcher.drillNumber] = {
                x: marcher.x - this.centerX,
                y: marcher.y - this.centerY
            };
        });
    }

    recalculate(displayOnly?) {
        for (let i = 0; i < this.marchers.length; i++) {
            const marcher = this.marchers[i].component;
            const relativeDot = this.relativeDots[marcher.drillNumber];
            if (relativeDot) {
                let newX;
                let newY;
                // apply rotation
                if (this.rotation) {
                    const rotated = calc.rotate(relativeDot, this.rotation);
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

                this.dots[i] = { x: newX, y: newY }
            }
        }
    }
}