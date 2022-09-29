import { usePdStore, useTempStore } from "@/stores/DrillProject";
import type { MarcherSelection } from "@/stores/MarcherSelection";
import type { Coord } from "@/stores/ProjectTypes";

export abstract class Form {

    selection: MarcherSelection;
    applied = false;

    centerX;
    centerY;
    scaleX = 1;
    scaleY = 1;
    rotation = 0;

    dragDeltaX = 0;
    dragDeltaY = 0;
    dragStart: Coord | undefined;
    dragStartCenter: Coord | undefined;

    abstract args;

    constructor() {
        this.selection = useTempStore().selection;
        const center = { ...this.selection.centerCurrent } as Coord;
        this.centerX = center.x;
        this.centerY = center.y;
    }

    abstract recalculate(displayOnly?)

    update(displayOnly?: boolean) {
        this.recalculate();
        if (!displayOnly) {
            usePdStore().pushChange();
        }
    }

    apply() {
        if (!this.applied) {
            this.update();
            this.applied = true;
            if (this.selection.length) {
                this.selection.targets.items.forEach(i => {
                    i.component.applyCurrentCoord();
                });
            }
            this.applied = true;
        }
    }

    cancel() {
        if (this.selection.length) {
            this.selection.targets.items.forEach(i => {
                const s = i.component.storedCoord;
                i.component.setCurrentCoord(s.x, s.y);
            });
        }
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
}