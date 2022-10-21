import { reactive } from 'vue';

import { Form } from "@/forms/Form";
import * as calc from "@/util/calc";
import type { Coord } from '@/util/ProjectTypes';

export class BlockForm extends Form {

    sizeX = 0;
    sizeY = 0;
    numRows = 0;
    numColumns = 0;

    costs?: number[][];

    args = reactive({
        centerX: { name: 'Center X', type: 'number', newRow: 1 },
        centerY: { name: 'Center Y', type: 'number' },
        sizeX: { name: 'Width:', type: 'number', newRow: 1 },
        sizeY: { name: 'Height:', type: 'number' },
        numRows: { name: 'Rows:', type: 'number', newRow: 1 },
        numColumns: { name: 'Columns:', type: 'number' },
        rotation: { name: 'Rotation:', type: 'number', newRow: 1 },
    });

    constructor(p?) {
        super(p);
        Object.assign(this, p);
        if (this.marchers.length < 4) console.error(">=4 marchers to make block");
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
            const xCoords: number[] = this.marchers.map(i => i.component.x);
            const yCoords: number[] = this.marchers.map(i => i.component.y);
            const minX = Math.min(...xCoords);
            const maxX = Math.max(...xCoords);
            const minY = Math.min(...yCoords);
            const maxY = Math.max(...yCoords);
            this.sizeX = Math.round(maxX - minX);
            this.sizeY = Math.round(maxY - minY);
        }

        if (!this.numRows || !this.numColumns) {
            // find numRows and numColumns so sum is smallest (incur penalty if not even rows/cols)
            let smallestSum = 9999;
            for (let nCols = 2; nCols <= this.marchers.length / 2; nCols++) {
                const nRows = this.marchers.length / nCols;
                const penalty = 10 * (this.marchers.length % nRows + this.marchers.length % nCols);
                const sum = nCols + nRows + penalty;
                if (sum < smallestSum) {
                    smallestSum = sum;
                    this.numColumns = Math.ceil(nCols);
                    this.numRows = Math.ceil(nRows);
                }
            }
            // ensure longer dimension pairs to longer distance
            if (this.sizeX > this.sizeY && this.numColumns < this.numRows) {
                const tmp = this.numColumns;
                this.numColumns = this.numRows;
                this.numRows = tmp;
            }
        }

        if (this.numRows * this.numColumns < this.marchers.length) {
            throw RangeError(`${this.numRows} rows and ${this.numColumns} columns
                cannot fit ${this.marchers.length} marchers`
            );
        } else {
            this.makeGrid();
        }
    }

    makeGrid() {

        const gapX = this.sizeX / (this.numColumns - 1);
        const gapY = this.sizeY / (this.numRows - 1);

        for (let i = 0; i < this.numRows; i++) {
            for (let j = 0; j < this.numColumns; j++) {
                let gridPointX = gapX * j;
                let gridPointY = gapY * i;
                let gridPoint = {
                    x: (gridPointX + this.centerX) - this.sizeX / 2,
                    y: (gridPointY + this.centerY) - this.sizeY / 2
                }
                gridPoint = calc.rotate(gridPoint, this.rotation, { x: this.centerX, y: this.centerY })
                this.dots.push(gridPoint);
            }
        }
    }
}