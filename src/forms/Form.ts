import munkres from 'munkres-js';

import { usePdStore, useTempStore } from '@/stores/DrillProject';
import { MarcherSelectionItem } from '@/stores/MarcherSelection';
import type { Coord } from '@/util/ProjectTypes';
import * as calc from '@/util/calc';

export abstract class Form {

    doNotSerialize = ['marchers', 'applied'];
    className: string = '';

    marchers: MarcherSelectionItem[] = [];
    marcherDrillNumbers: string[] = [];
    applied: boolean = false;
    formId?: string;

    centerX!: number;
    centerY!: number;
    scaleX: number = 1;
    scaleY: number = 1;
    rotation: number = 0;

    dragDeltaX: number = 0;
    dragDeltaY: number = 0;
    dragStart: Coord | undefined;
    dragStartCenter: Coord | undefined;

    dots: Coord[] = [];
    abstract args: { [arg: string]: { name: string, type: string, newRow?: number, bindAttr?: string } };
    keepOrder?: boolean;

    constructor(partial?: Partial<Form>) {
        if (partial) {
            partial.marcherDrillNumbers?.forEach((dn) => {
                this.marchers.push(new MarcherSelectionItem(dn));
            });
        } else {
            this.className = this.constructor.name;
            const selection = useTempStore().selection;
            this.marchers = [...selection.targets.items];
            this.marcherDrillNumbers = this.marchers.map(i => i.component.drillNumber);
            const center = { ...selection.centerCurrent } as Coord;
            this.centerX = center.x;
            this.centerY = center.y;
        }
    }

    abstract recalculate(displayOnly?: boolean)

    update(displayOnly?: boolean) {
        this.recalculate();
        this.assign(displayOnly);
        if (!displayOnly) {
            usePdStore().pushChange();
        }
    }

    calcCosts(): number[][] {
        const costs: number[][] = new Array(this.marchers.length).fill(0).map(() => []);

        for (let i = 0; i < this.dots.length; i++) {
            if (i < this.marchers.length) {
                this.marchers.forEach(m => {
                    const prev = m.component.prevCoord;
                    const dist = calc.distanceBetweenPoints(this.dots[i].x, this.dots[i].y, prev?.x, prev?.y);
                    const cost = dist * dist;
                    if (isNaN(cost)) {
                        throw TypeError('cost is NaN');
                    } else {
                        costs![i].push(cost);
                    }
                });
            }
        }
        return costs;
    }

    assign(displayOnly?: boolean) {
        if (this.keepOrder || displayOnly) return this.assignInPlace(false);

        const assignments = munkres(this.calcCosts());

        for (let i = 0; i < this.marchers.length; i++) {
            const chosenIndex = assignments[i][1];
            if (displayOnly) {
                this.marchers[chosenIndex].component.setDisplayCoord(this.dots[i].x, this.dots[i].y);
            } else {
                this.marchers[chosenIndex].component.setCurrentCoordByRef(this.dots[i]);
            }
        }
    }

    apply() {
        if (!this.applied) {
            this.update();
            this.applied = true;
            if (this.marchers.length) {
                this.marchers.forEach(i => {
                    i.component.setStoredCoordByRef(i.component.currentCoord);
                });
            }
            this.applied = true;
        }
        this.formId ||= crypto.randomUUID();
        usePdStore().saveForm(this.formId);
        usePdStore().pushChange();
    }

    cancel() {
        if (this.marchers.length) {
            this.marchers.forEach(i => {
                const s = i.component.storedCoord;
                i.component.setCurrentCoord(s.x, s.y);
            });
        }
        usePdStore().clearForm();
        usePdStore().pushChange();
    }

    rotate(delta) {
        this.rotation += delta;
        this.update();
    }

    scale(factorX, factorY) {
        this.scaleX *= factorX;
        this.scaleY *= factorY;
        this.update();
    }

    move(x, y) {
        this.centerX += x;
        this.centerY += y;
        this.update();
    }

    assignInPlace(displayOnly?: boolean) {
        for (let i = 0; i < this.dots.length; i++) {
            const dot = this.dots[i];
            if (displayOnly) {
                this.marchers[i].component.setDisplayCoord(dot.x, dot.y);
            } else {
                this.marchers[i].component.setCurrentCoord(dot.x, dot.y);
            }
        }
    }
}

export function r(min, max) {
    return (n) => n >= min && n <= max
}