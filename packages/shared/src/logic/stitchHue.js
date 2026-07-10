const BRICK = new Set(['k', 'sl', 'kfb', 'm1', 'c4f', 'c4b', 'sc', 'hdc']);
const MUSTARD = new Set(['p', 'p2tog', 'mb', 'dc', 'ch', 'slst']);
export function stitchHue(colors, id) {
    if (BRICK.has(id))
        return colors.brick;
    if (MUSTARD.has(id))
        return colors.mustard;
    return colors.forest;
}
