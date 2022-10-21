import { reactive } from "vue";

import * as calc from '@/util/calc';
import { Form, r } from "@/forms/Form";

export class CircleForm extends Form {

    evenEllipse;
    sizeX;
    sizeY;

    args = reactive({
        centerX: { name: 'Center X', type: 'number', valid: r(0, 160), newRow: 1 },
        centerY: { name: 'Center Y', type: 'number', valid: r(0, 84) },
        sizeX: { name: 'Radius X:', type: 'number', valid: r(.1, 80), newRow: 1 },
        sizeY: { name: 'Radius Y:', type: 'number', valid: r(.1, 42) },
        rotation: { name: 'Rotation:', type: 'number', valid: r(-360, 360), newRow: 1, },
        evenEllipse: { name: '⚠️ Even ellipse:', type: 'checkbox', bindAttr: 'checked' },
    });

    constructor(p?) {
        super(p);
        Object.assign(this, p);
        this.sizeX ||= 0;
        this.sizeY ||= 0;
        this.evenEllipse ||= false;
        if (this.marchers.length < 3)
            throw RangeError(">=3 marchers to make oval");
        this.update();
    }

    scale(factorX, factorY) {
        this.sizeX *= factorX;
        this.sizeY *= factorY;
        this.update();
    }

    recalculate(displayOnly?) {
        if (this.sizeX > 0) {
            this.sizeY ||= this.sizeX;
        } else {
            this.sizeX = this.sizeY = 0;
            this.marchers.forEach((i) => {
                this.sizeX += calc.distance({ x: this.centerX, y: this.centerY }, i.component.currentCoord);
            });
            this.sizeX /= this.marchers.length;
            this.sizeX = this.sizeY = Math.round(this.sizeX);
        }

        this.marchers.sort((a, b) =>
            calc.bearing(this.centerX, this.centerY, a.component.currentCoord.x, a.component.currentCoord.y)
            - calc.bearing(this.centerX, this.centerY, b.component.currentCoord.x, b.component.currentCoord.y)
        );

        this.rotation ||= 0;
        const sliceSize = 360 / this.marchers.length;

        let evenEllipseCoords;
        if (this.evenEllipse) {
            evenEllipseCoords = calc.getPointsAlongEllipse(
                this.sizeX, this.sizeY, this.marchers.length, this.rotation);
        }

        for (let i = 0; i < this.marchers.length; i++) {
            let c;
            let newX; let newY;
            if (evenEllipseCoords) {
                c = evenEllipseCoords[i];
                newX = c.x;
                newY = c.y
            } else {
                c = calc.bearingCoord(this.rotation + (sliceSize * i));
                newX = c.x * this.sizeX;
                newY = c.y * this.sizeY;
            }
            newX += this.centerX;
            newY += this.centerY;

            this.dots[i] = { x: newX, y: newY };
        }
    }
}