import { projectDataStore } from "@/stores/DrillProject";
import type { MarcherSelection } from "@/stores/MarcherSelection";
import { reactive, ref } from "vue";
import * as util from './util';

let selection: MarcherSelection;

export const makeOval = () => {

    if (!selection) selection = projectDataStore().selection;
    if (selection.length < 3) return console.error(">=3 marchers to make oval");

    const p = {
        args: reactive({
            sizeX: {
                val: 0,
                name: 'Radius X:',
                type: 'number'
            },
            sizeY: {
                val: 0,
                name: 'Radius Y:',
                type: 'number'
            },
            startAngle: {
                val: 0,
                name: 'Start angle:',
                type: 'number'
            },
            evenEllipse: {
                val: false,
                name: 'Even-spaced Ellipse (unstable):',
                type: 'checkbox',
                bindAttr: 'checked'
            },
        }),
        applied: false,
        update: function () {

            if (this.args.sizeX.val > 0) {
                this.args.sizeY.val ||= this.args.sizeX.val;
            } else {
                this.args.sizeX.val = this.args.sizeY.val = 0;
                selection.targets.items.forEach((i) => {
                    this.args.sizeX.val += util.marcherDistanceToCenter(i.element);
                });
                this.args.sizeX.val /= selection.length;
                this.args.sizeY.val = this.args.sizeX.val;
            }

            selection.targets.items.sort((a, b) =>
                Number(a.element.getAttribute('storedBearing')) - Number(b.element.getAttribute('storedBearing'))
            );

            this.args.startAngle.val ||= 0;
            const sliceSize = 360 / selection.length;

            console.log('evee', this.args.evenEllipse.val);

            let evenEllipseCoords;
            if (this.args.evenEllipse.val) {
                evenEllipseCoords = util.getPointsAlongEllipse(
                    this.args.sizeX.val, this.args.sizeY.val, selection.length, this.args.startAngle.val);
            }

            for (let i = 0; i < selection.length; i++) {
                let c;
                let newX; let newY;
                if (evenEllipseCoords) {
                    c = evenEllipseCoords[i];
                    newX = c.x;
                    newY = c.y
                }
                else {
                    c = util.bearingCoord(this.args.startAngle.val + (sliceSize * i));
                    newX = c.x * this.args.sizeX.val;
                    newY = c.y * this.args.sizeY.val;
                }
                newX += selection.center.x;
                newY += selection.center.y;
                selection.targets.items[i].component.setCurrentCoord(newX, newY);
            }
            selection.updateCenter();
        },
        apply: function () {
            console.log('fef');

            if (!this.applied) {
                this.update();
                this.applied = true;
                if (selection.length) {
                    selection.targets.items.forEach(i => {
                        i.component.applyCurrentCoord();
                    });
                }
                selection.updateCenter();
                this.applied = true;
            }
        },
        cancel: function () {
            if (selection.length) {
                selection.targets.items.forEach(i => {
                    const s = i.component.storedCoord;
                    i.component.setCurrentCoord(s.x, s.y);
                });
            }
        }
    }
    p.update();
    return p;
}

export function makeBlock(doPerfectSquare) {

    if (!selection) selection = projectDataStore().selection;
    if (selection.length < 4) return console.error(">= 4 marchers to make block");
    if (selection.length % 2 != 0) return console.error("need even number to make block");

    // find the 4 outer coordinates, starting with top going clockwise
    const corners = [999, -999, -999, 999];
    selection.targets.items.forEach((i) => {
        const marcher = i.component;
        if (marcher.y < corners[0])
            corners[0] = marcher.y;
        if (marcher.x > corners[1])
            corners[1] = marcher.x;
        if (marcher.y > corners[2])
            corners[2] = marcher.y;
        if (marcher.x < corners[3])
            corners[3] = marcher.x;
    });

    if (corners[1] == corners[3] || corners[0] == corners[2]) {
        // single file line
        // makeLine();
        return true;
    }

    if (doPerfectSquare) {
        var sizeX = corners[1] - corners[3];
        var sizeY = corners[2] - corners[0];

        if (sizeX > sizeY) {
            corners[0] -= (sizeX - sizeY) / 2;
            corners[2] += (sizeX - sizeY) / 2;
        }
        else {
            corners[1] += (sizeY - sizeX) / 2;
            corners[3] -= (sizeY - sizeX) / 2;
        }
    }

    let blockSize: any[] = [];

    if (!doPerfectSquare) {
        var dimY = 0;
        var cornerY1 = false;
        var cornerY2 = false;
        //  count marchers on far left side to estimate desired dimension
        selection.targets.items.forEach((i) => {
            const marcher = i.component;
            if (Math.abs(marcher.x - corners[3]) < 12) {
                ++dimY;
                if (Math.abs(marcher.y - corners[0]) < 12) {
                    cornerY1 = true;
                }
                if (Math.abs(marcher.y - corners[2]) < 12) {
                    cornerY2 = true;
                }
            }
        });

        if (dimY > 1 && cornerY1 && cornerY2) {
            if (selection.length % dimY == 0) {
                var dimX = selection.length / dimY;
                blockSize = [dimX, dimY];
            }
        }
    }

    // find most even dimension

    if (!blockSize[0]) {
        var blockFactor = 99;
        for (let x = 2; x <= selection.length / 2; x++) {
            if (selection.length % x == 0) {
                var y = selection.length / x;
                if (x + y < blockFactor) {
                    blockFactor = x + y;
                    blockSize = [x, y];
                }
            }
        }
    }

    // EDITOR.registerChange();

    var sizeX = corners[1] - corners[3];
    var sizeY = corners[2] - corners[0];

    if (sizeX > sizeY && blockSize[0] < blockSize[1]) {
        const tmp = blockSize[0];
        blockSize[0] = blockSize[1];
        blockSize[1] = tmp;
    }

    var blockIntX = sizeX / (blockSize[0] - 1);
    var blockIntY = sizeY / (blockSize[1] - 1);

    selection.targets.items.sort((a, b) =>
        a.component.y - b.component.y
    );

    var blockMarchers: any[] = [];
    for (let m = 0; m < selection.length; m++) {
        blockMarchers.push(selection.targets.items[m].component);
    }

    // chunk the marchers into rough rows
    blockMarchers.sort(function (a, b) {
        return a.y - b.y
    });
    for (y = 0; y <= blockSize[1] - 1; y++) {
        const row: any[] = [];
        for (let x = 0; x <= blockSize[0] - 1; x++) {
            row.push(blockMarchers.shift());
        }
        row.sort(function (a, b) {
            return a.x - b.x
        })
        for (let x = 0; x <= blockSize[0] - 1; x++) {
            var pegX = corners[3] + x * blockIntX;
            var pegY = corners[0] + y * blockIntY;
            var marcher = row[x];
            marcher.setStoredCoord(pegX, pegY);
        }
    }
    selection.updateCenter();
};

export function scaleForm(scaleX, scaleY, isFine) {

    if (!selection) selection = projectDataStore().selection;
    if (selection.length < 2) return console.error('need >=2 marchers to scale');
    if (scaleX > 10 || scaleX < .1) return console.error('cannot scale by scaleX factor ' + scaleX);
    if (scaleY > 10 || scaleY < .1) return console.error('cannot scale by scaleY factor ' + scaleY);

    selection.targets.items.forEach(i => {
        const marcher = i.component;
        let newX = marcher.x;
        let newY = marcher.y;

        const distX = marcher.x - selection.center.x;
        newX = selection.center.x + distX * scaleX;

        const distY = marcher.y - selection.center.y;
        newY = selection.center.y + distY * scaleY;

        marcher.setStoredCoord(newX, newY);
    });
    selection.updateCenter();
}

// rotateDeg (positive -> clockwise)
export function rotateForm(deg) {

    if (!selection) selection = projectDataStore().selection;
    if (selection.length < 2) return console.error('need >=2 marchers to rotate');

    selection.targets.items.forEach(i => {
        const marcher = i.component;
        const newCoord = util.rotate(selection.center, marcher.currentCoord, deg);
        marcher.setStoredCoord(newCoord.x, newCoord.y);
    });
    selection.updateCenter();
}

export function moveForm(moveX, moveY) {

    if (!selection) selection = projectDataStore().selection;
    if (selection.length < 1) return console.error('no marchers selected');

    selection.targets.items.forEach(i => {
        const marcher = i.component;
        marcher.setStoredCoord(marcher.x + moveX, marcher.y + moveY);
    });
    selection.updateCenter();
}

console.log();
