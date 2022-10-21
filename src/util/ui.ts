import type { Coord } from "@/util/ProjectTypes";

export const DOT_PRECISION_UI = 10;

export const round = (n, precision?) => {
    if (!precision) precision = DOT_PRECISION_UI;
    return Math.round(n * precision) / precision;
}
export function resetAnimation(target) {
    target.style.animation = 'none';
    target.offsetHeight;
    target.style.animation = null;
}

export function fieldX(x, abbr?) {
    // x = x * 1;
    if (x == 80) return 'on 50';
    let r = x < 80 ? 's1: ' : (x = 160 - x) < 0 || 's2: ';
    const pos = x % 8;
    if (pos == 0) {
        r += 'on ' + round(x / 1.6);
    }
    else if (pos == 4) {
        r += 'split ' + round((x - 4) / 1.6) + ' & ' + round((x + 4) / 1.6)
    }
    else if (pos > 4) {
        const off = round(4 - (x % 4));
        r += off + (abbr ? ' o/s ' : ' outside ') + round((x + off) / 1.6);
    }
    else {
        const off = round(x % 4);
        r += off + (abbr ? ' i/s ' : ' inside ') + round((x - off) / 1.6);
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
        r += round(distToHash - y) + (isFront ? ' before front' : ' behind back') + ' hash'
    } else if (y == distToHash) {
        r += 'on ' + (isFront ? 'front' : 'back') + ' hash';
    } else {
        r += round(y - distToHash) + (isFront ? ' behind front' : ' before back') + ' hash';
    }
    return r;
}

export function convertPointFromPageToNode(el: HTMLDivElement, ev: MouseEvent) {
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


export function exclusiveStringify(obj, inArray?) {
    let res = '';
    for (const k in obj) {
        const omit = obj['doNotSerialize'];        
        if (!(omit && omit.includes(k))) {
            if (!inArray)
                res += "\"" + k + "\"" + ':'
            if (Array.isArray(obj[k])) {
                res += '['
                res += exclusiveStringify(obj[k], true);
                res += '],'
            } else {
                if (typeof obj[k] == 'object' && obj[k] != null) {
                    res += '{'                    
                    res += exclusiveStringify(obj[k]);
                    res += '},'
                } else {
                    if (obj[k] == undefined) {
                        res += '0,'
                    } else {
                        res += JSON.stringify(obj[k]) + ','
                    }
                }
            }
        }
    }
    if (res.charAt(res.length - 1) == ',')
        res = res.slice(0, -1);
    return res;
}