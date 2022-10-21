import { reactive } from 'vue';

import { Form } from "@/forms/Form";
import * as calc from "@/util/calc";

export class LineForm extends Form {

    xLength;
    yLength;
    slope = 0;

    args = reactive({
        centerX: { name: 'Center X', type: 'number', newRow: 1 },
        centerY: { name: 'Center Y', type: 'number' },
        xLength: { name: 'Side-to-side:', type: 'number', newRow: 1 },
        yLength: { name: 'Front-to-back:', type: 'number' },
        slope: { name: 'Slope:', type: 'number', newRow: 1 },
    });

    constructor(p?) {
        super(p);
        Object.assign(this, p);
        if (this.marchers.length < 2) console.error(">=2 marchers to make line");
        this.update();
    }

    scale(factorX, factorY) {
        this.xLength *= factorX;
        this.yLength *= factorY;
        this.update();
    }

    recalculate(displayOnly?) {

        if (!this.slope) {
            const line = calc.lineOfBestFit(this.marchers.map(i => i.component.storedCoord));
            this.slope = line.slope;
        }

        if (this.xLength == undefined || this.yLength == undefined) {
            this.marchers.forEach(i => {
                const c = calc.project(i.component.storedCoord,
                    { x: this.centerX, y: this.centerY },
                    { x: this.centerX + 1, y: this.centerY + this.slope }
                );
                i.tempData = { x: c.x, y: c.y };
            });
            this.marchers.sort((a, b) => a.tempData.x - b.tempData.x);
            this.xLength = this.marchers[this.marchers.length - 1].component.currentCoord.x - this.marchers[0].component.currentCoord.x;
            this.yLength = this.marchers[this.marchers.length - 1].component.currentCoord.y - this.marchers[0].component.currentCoord.y;
        } else {
            this.marchers.sort((a, b) => a.component.currentCoord.x - b.component.currentCoord.x);
        }

        const startX = this.centerX - this.xLength / 2;
        const startY = this.centerY - this.yLength / 2;

        for (let i = 0; i < this.marchers.length; i++) {
            const t = i / (this.marchers.length - 1);
            const newX = startX + this.xLength * t;
            const newY = startY + this.yLength * t;
            this.dots[i] = { x: newX, y: newY };
        }
    }

    assign(displayOnly?: boolean) {
        this.assignInPlace(displayOnly);
    }
}