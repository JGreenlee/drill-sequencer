import { usePdStore, useSelectionStore } from "@/stores/DrillProject";
import type { MarcherSelection } from "@/stores/MarcherSelection";

let selection: MarcherSelection;

export function makeBlock(doPerfectSquare) {

    if (!selection) selection = useSelectionStore().selection;
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
};