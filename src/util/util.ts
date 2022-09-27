import type { Coord } from "@/stores/ProjectTypes";

export const DOT_PRECISION_UI = 10;
export const DOT_PRECISION_CALC = 1000;

export const roundUi = (n) =>
    Math.round(n * DOT_PRECISION_UI) / DOT_PRECISION_UI;

export const roundCalc = (n) =>
    Math.round(n * DOT_PRECISION_CALC) / DOT_PRECISION_CALC;


export function fieldX(x, abbr?) {
    // x = x * 1;
    if (x == 80) return 'on 50';
    let r = x < 80 ? 's1: ' : (x = 160 - x) < 0 || 's2: ';
    const pos = x % 8;
    if (pos == 0) {
        r += 'on ' + roundUi(x / 1.6);
    }
    else if (pos == 4) {
        r += 'split ' + roundUi((x - 4) / 1.6) + ' & ' + roundUi((x + 4) / 1.6)
    }
    else if (pos > 4) {
        const off = roundUi(4 - (x % 4));
        r += off + (abbr ? ' o/s ' : ' outside ') + roundUi((x + off) / 1.6);
    }
    else {
        const off = roundUi(x % 4);
        r += off + (abbr ? ' i/s ' : ' inside ') + roundUi((x - off) / 1.6);
    }
    return r;
}

export function fieldY(y, abbr?) {
    const distToHash = 28;
    if (y == 42) return 'split hashes (' + distToHash / 2 + ' steps)';
    const isFront = y < 42;
    if (!isFront) {
        y = 84 - y;
    }
    let r = '';
    if (y < distToHash / 2) {
        r += y + (isFront ? ' behind front' : ' before back') + ' sideline'
    } else if (y < distToHash) {
        r += roundUi(distToHash - y) + (isFront ? ' before front' : ' behind back') + ' hash'
    } else if (y == distToHash) {
        r += 'on ' + (isFront ? 'front' : 'back') + ' hash';
    } else {
        r += roundUi(y - distToHash) + (isFront ? ' behind front' : ' before back') + ' hash';
    }
    return r;
}

export function convertPointFromPageToNode(el: HTMLDivElement, ev: any) {
    const nw = el.querySelector('.handle.nw')?.getBoundingClientRect();
    const ne = el.querySelector('.handle.ne')?.getBoundingClientRect();
    const se = el.querySelector('.handle.se')?.getBoundingClientRect();
    const sw = el.querySelector('.handle.sw')?.getBoundingClientRect();

    if (!nw || !ne || !se || !sw) return;

    const height = sw.y - nw.y;
    const leftSlope = (nw.y - sw.y) / (nw.x - sw.x);
    const rightSlope = (ne.y - se.y) / (ne.x - se.x);

    const leftX = sw.x - (sw.y - ev.clientY) / leftSlope;
    const rightX = se.x - (se.y - ev.clientY) / rightSlope;

    return {
        x: (ev.clientX - leftX) / (rightX - leftX),
        y: (sw.y - ev.clientY) / height
    }
}

export function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
}

export function marcherDistanceToCenter(m) {
    const x = m.coordFromSel.x;
    const y = m.coordFromSel.y;
    return Math.sqrt(x * x + y * y);
}

export function distance(one: Coord, two: Coord): number {
    return distanceBetweenPoints(one.x, one.y, two.x, two.y)
}

export function distanceBetweenPoints(xOne, yOne, xTwo, yTwo): number {
    let y = xTwo - xOne;
    let x = yTwo - yOne;
    return Math.sqrt(x * x + y * y);
}

export const cosDeg = (deg) =>
    Math.cos(deg * Math.PI / 180)

export const sinDeg = (deg) =>
    Math.sin(deg * Math.PI / 180)

export const calcBearing = (cx, cy, px, py) =>
    modDegrees(360 - (Math.atan2(cy - py, cx - px) * 180 / Math.PI + 90))

export const bearingX = (deg) =>
    roundCalc(cosDeg(modDegrees(deg, -90)))

export const bearingY = (deg) =>
    roundCalc(-Math.sin(modDegrees(deg, -90) * Math.PI / 180))

export const bearingCoord = (d) => {
    return { x: bearingX(d), y: bearingY(d) };
}

export const modDegrees = (deg, shift?) =>
    (deg + (shift || 0) + 360) % 360;

const toRadians = (deg) =>
    deg * (Math.PI / 180);

const toDegrees = (rad) =>
    rad * (180 / Math.PI);

export function rotate(p, deg, o?) {
    const a = -toRadians(deg);
    return {
        x: Math.cos(a) * (p.x - (o?.x || 0)) - Math.sin(a) * (p.y - (o?.y||0)) + (o?.x||0),
        y: Math.sin(a) * (p.x - (o?.x || 0)) + Math.cos(a) * (p.y - (o?.y||0)) + (o?.y||0)
    }
}

// java solution https://stackoverflow.com/a/20510150/5110347
export function getPointsAlongEllipse(major, minor, numPoints, offsetDeg?): Coord[] {

    let theta = 0.0;
    const twoPi = Math.PI * 2.0;
    const deltaTheta = 0.0001;
    const numIntegrals = Math.round(twoPi / deltaTheta);
    let circ = 0.0;
    let dpt = 0.0;

    // integrate over the elipse to get the circumference
    for (let i = 0; i < numIntegrals; i++) {
        theta += i * deltaTheta;
        dpt = computeDpt(major, minor, theta);
        circ += dpt;
    }

    let nextPoint = 0;
    let run = 0.0;
    theta = 0.0 - toRadians(90);

    const evenPoints: Coord[] = [];

    for (let i = 0; i < numIntegrals; i++) {
        theta += deltaTheta;
        const subIntegral = numPoints * run / circ;
        if (subIntegral >= nextPoint) {
            const d = toDegrees(theta);
            evenPoints.push({
                x: roundUi(major * cosDeg(d + (offsetDeg||0) )),
                y: roundUi(minor * -sinDeg(d + (offsetDeg||0) ))
            });
            nextPoint++;
        }
        run += computeDpt(major, minor, theta);
    }
    return evenPoints;
}

function computeDpt(r1, r2, theta) {
    let dp = 0.0;
    const dpt_sin = Math.pow(r1 * Math.sin(theta), 2.0);
    const dpt_cos = Math.pow(r2 * Math.cos(theta), 2.0);
    dp = Math.sqrt(dpt_sin + dpt_cos);
    return dp;
}
