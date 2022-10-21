import { reactive } from "vue";

import * as calc from '@/util/calc';
import { Form, r } from "@/forms/Form";

export class ArcForm extends Form {

    evenEllipse = false;
    sizeX = 0;
    sizeY = 0;
    focalDist = 0;

    args = reactive({
        centerX: { name: 'Center X', type: 'number', valid: r(0, 160), newRow: 1 },
        centerY: { name: 'Center Y', type: 'number', valid: r(0, 84) },
        sizeX: { name: 'Radius X:', type: 'number', valid: r(.1, 80), newRow: 1 },
        sizeY: { name: 'Radius Y:', type: 'number', valid: r(.1, 42) },
        rotation: { name: 'Rotation:', type: 'number', valid: r(-360, 360), newRow: 1, },
        focalDist: { name: 'Focal distance:', type: 'number', valid: r(0, 100) },
    });

    constructor(p?) {
        super(p);
        Object.assign(this, p);
        if (this.marchers.length < 3) console.error(">=3 marchers to make oval");
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

    // this.arcMarchers = function(direction, isFine) {
    //     if (EDITOR.selectedMarchers.length < 3) {
    //         return false;
    //     }

    //     isFine = (isFine) ? true : false;

    //     if (this.reverseArcKey) {
    //         //direction *= -1;
    //     }

    //     var isInit = false;
    //     if (!this.arcFocusDist) {
    //         // initialize arc
    //         EDITOR.registerChange('arc');

    //         this.arcFocusDist = 100;
    //         this.arcDirection = direction;

    //         // if it's an existing arc, estimate which side it should tend to
    //         var prevAngles = [];
    //         var center = this.getSelectionCenter();
    //         for (m = 0; m < EDITOR.selectedMarchers.length; m++) {
    //             var marcher = EDITOR.selectedMarchers[m];
    //             prevAngles.push(get_angle([marcher.x, marcher.y], center));
    //         }

    //         this.cleanLine(true, true);

    //         this.arcCenter = this.getSelectionCenter();

    //         // sort marchers by angle to focus
    //         this.arcAxisAngle = EDITOR.selectedMarchers[0].angleToMarcher(EDITOR.selectedMarchers[EDITOR.selectedMarchers.length - 1]);
    //         if (this.arcAxisAngle > 180) {
    //             this.arcAxisAngle -= 180;
    //         }

    //         var totalOffset = 0;
    //         for (var i = 0; i < prevAngles.length; i++) {
    //             totalOffset += angle_difference(360 + prevAngles[i], 360 + this.arcAxisAngle);
    //         }

    //         this.arcDirection = (totalOffset < 0) ? -1 : 1;

    //         this.updateArcFocusAngle();

    //         isInit = true;
    //     }
    //     else {
    //         // change depth of arc
    //         var dist = this.arcFocusDist * 0.2 * (direction * this.arcDirection);
    //         if (isFine) {
    //             dist *= 0.25;
    //         }
    //         this.arcFocusDist -= dist;

    //         if (this.arcFocusDist < 20) {
    //             this.arcFocusDist = 20;
    //         }
    //         else if (this.arcFocusDist > 350) {
    //             this.arcFocusDist = 300;
    //             this.arcDirection = (this.arcDirection > 0) ? -1 : 1;
    //             this.reverseArcKey = (this.reverseArcKey) ? false : true;
    //             this.updateArcFocusAngle();
    //         }
    //     }

    //     this.moveArcFocus();

    //     this.moveMarchersToArc();

    //     //if (isInit) {  EDITOR.addToHistory(true);  }

    // };

    // this.moveArcFocus = function() {
    //     // move arc focus, perpendicular to baseline (end marchers)
    //     // this is a right angle to the axis line
    //     this.arcFocus[0] = this.arcCenter[0] + Math.sin(this.arcFocusAngle * Math.PI / 180) * this.arcFocusDist;
    //     this.arcFocus[1] = this.arcCenter[1] + Math.cos(this.arcFocusAngle * Math.PI / 180) * this.arcFocusDist * -1.0;
    // };

    // this.moveMarchersToArc = function() {
    //     this.cleanLine(true, true);

    //     // sort marchers by angle to focus
    //     for (m = 0; m < EDITOR.selectedMarchers.length; m++) {
    //         EDITOR.selectedMarchers[m].setAngleToCenter(this.arcFocus, this.arcFocusAngle);
    //     }
    //     EDITOR.selectedMarchers.sort(function(a, b) {
    //         return a.angleToCenter - b.angleToCenter
    //     });
    //     if (this.arcDirection < 0) {
    //         // EDITOR.selectedMarchers.reverse();
    //     }

    //     var axisLen = EDITOR.selectedMarchers[0].distanceToPoint(this.arcCenter);

    //     var totalAngle = Math.atan2(axisLen * Math.PI / 180.0, this.arcFocusDist * Math.PI / 180.0) * 180.0 / Math.PI;
    //     totalAngle *= 2.0;

    //     var startAngle = get_angle([EDITOR.selectedMarchers[0].x, EDITOR.selectedMarchers[0].y], this.arcFocus);
    //     var angleInterval = totalAngle / (EDITOR.selectedMarchers.length - 1);
    //     var rad = EDITOR.selectedMarchers[0].distanceToPoint(this.arcFocus);

    //     for (m = 1; m < EDITOR.selectedMarchers.length - 1; m++) {
    //         var newAngle = startAngle + angleInterval * m;
    //         var newX = this.arcFocus[0] + Math.sin(newAngle * Math.PI / 180) * rad;
    //         var newY = this.arcFocus[1] + Math.cos(newAngle * Math.PI / 180) * rad * -1.0;

    //         EDITOR.selectedMarchers[m].move(newX, newY);
    //     }
    // };
}