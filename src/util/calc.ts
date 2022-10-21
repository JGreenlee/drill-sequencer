import type { Coord } from "@/util/ProjectTypes";

export const DOT_PRECISION_CALC = 1000;

export const round = (n, precision?) => {
    if (!precision) precision = DOT_PRECISION_CALC;
    return Math.round(n * precision) / precision;
}

export function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
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

/**
 * 
 * @param cx Center X coord
 * @param cy Center Y coord
 * @param px Point X coord
 * @param py Point Y coord
 * @returns bearing in degrees (North=0, East=90)
 */
export const bearing = (cx: number, cy, px, py) =>
    modDegrees(360 - (Math.atan2(cy - py, cx - px) * 180 / Math.PI + 90))

const bearingX = (deg) =>
    round(cosDeg(modDegrees(deg, -90)))

const bearingY = (deg) =>
    round(-Math.sin(modDegrees(deg, -90) * Math.PI / 180))

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
        x: Math.cos(a) * (p.x - (o?.x || 0)) - Math.sin(a) * (p.y - (o?.y || 0)) + (o?.x || 0),
        y: Math.sin(a) * (p.x - (o?.x || 0)) + Math.cos(a) * (p.y - (o?.y || 0)) + (o?.y || 0)
    }
}

// returns obj with {slope, intercept}
export function lineOfBestFit(coords: Coord[]) {
    let sumX = 0;
    let sumY = 0;
    let sumXYProduct = 0;
    let sumXSquare = 0;
    let x = 0;
    let y = 0;

    coords.forEach(c => {
        x = c.x;
        y = c.y;
        sumX += x;
        sumY += y;
        sumXSquare += x * x;
        sumXYProduct += x * y;
    });

    const m = (coords.length * sumXYProduct - sumX * sumY) / (coords.length * sumXSquare - sumX * sumX);
    const b = (sumY / coords.length) - (m * sumX) / coords.length;

    return { slope: m, intercept: b };
}

export function project(p, a, b) {

    const atob = { x: b.x - a.x, y: b.y - a.y };
    const atop = { x: p.x - a.x, y: p.y - a.y };
    const len = atob.x * atob.x + atob.y * atob.y;
    let dot = atop.x * atob.x + atop.y * atob.y;
    const t = dot / len;

    dot = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);

    return {
        x: a.x + atob.x * t,
        y: a.y + atob.y * t
    };
}

// java solution https://stackoverflow.com/a/20510150/5110347
export function getPointsAlongEllipse(major, minor, numPoints, offsetDeg?): Coord[] {

    let theta = 0.0;
    const twoPi = Math.PI * 2.0;
    const deltaTheta = 0.0001;
    const numIntegrals = Math.round(twoPi / deltaTheta);
    let circ = 0.0;
    let dpt = 0.0;

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
            // round to tenths
            evenPoints.push({
                x: round(major * cosDeg(d + (offsetDeg || 0)), 10),
                y: round(minor * -sinDeg(d + (offsetDeg || 0)), 10)
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

function onSegment(p, q, r) {
    if (q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
        q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y))
        return true;
    return false;
}

function orientation(p, q, r) {
    let val = (q.y - p.y) * (r.x - q.x) -
        (q.x - p.x) * (r.y - q.y);

    if (val == 0) return 0;
    return (val > 0) ? 1 : 2;
}

export function doIntersect(p1, q1, p2, q2) {

    let o1 = orientation(p1, q1, p2);
    let o2 = orientation(p1, q1, q2);
    let o3 = orientation(p2, q2, p1);
    let o4 = orientation(p2, q2, q1);

    if (o1 != o2 && o3 != o4)
        return true;

    // Special Cases
    if (o1 == 0 && onSegment(p1, p2, q1)) return true;
    if (o2 == 0 && onSegment(p1, q2, q1)) return true;
    if (o3 == 0 && onSegment(p2, p1, q2)) return true;
    if (o4 == 0 && onSegment(p2, q1, q2)) return true;

    return false;
}