import { reactive } from "vue";

import * as util from '../util/util';
import { Form } from "./Form";

export class CircleForm extends Form {

    evenEllipse = false;
    sizeX = 0;
    sizeY = 0;

    args = reactive({
        centerX: { name: 'Center X', type: 'number' },
        centerY: { name: 'Center Y', type: 'number' },
        sizeX: { name: 'Radius X:', type: 'number' },
        sizeY: { name: 'Radius Y:', type: 'number' },
        rotation: { name: 'Rotation:', type: 'number' },
        evenEllipse: { name: '⚠️ Even ellipse:', type: 'checkbox', bindAttr: 'checked' },
    });

    constructor() {
        super();
        if (this.selection.length < 3) console.error(">=3 marchers to make oval");
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
            this.selection.targets.items.forEach((i) => {
                this.sizeX += util.marcherDistanceToCenter(i.component);
            });
            this.sizeX /= this.selection.length;
            this.sizeY = this.sizeX;
        }

        this.selection.targets.items.sort((a, b) =>
            a.component.coordFromSel.bearing - b.component.coordFromSel.bearing
        );

        this.rotation ||= 0;
        const sliceSize = 360 / this.selection.length;

        let evenEllipseCoords;
        if (this.evenEllipse) {
            evenEllipseCoords = util.getPointsAlongEllipse(
                this.sizeX, this.sizeY, this.selection.length, this.rotation);
        }

        for (let i = 0; i < this.selection.length; i++) {
            let c;
            let newX; let newY;
            if (evenEllipseCoords) {
                c = evenEllipseCoords[i];
                newX = c.x;
                newY = c.y
            } else {
                c = util.bearingCoord(this.rotation + (sliceSize * i));
                newX = c.x * this.sizeX;
                newY = c.y * this.sizeY;
            }
            newX += this.centerX;
            newY += this.centerY;
            if (displayOnly) {
                this.selection.targets.items[i].component.setDisplayCoord(newX, newY);
            } else {
                this.selection.targets.items[i].component.setCurrentCoord(newX, newY);
            }
        }
    }
}