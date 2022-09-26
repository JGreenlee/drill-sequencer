export type Coord = { x: number, y: number };

export type Picture = {
    pictureId: string,
    countsToNext: number
}

export type MarcherData = {
    // marcherSprite: string,
    drillNumber: string,
    dots: { pictureId: string, coord: Coord }[]
}

export type ProjectData = {
    projectTitle: string,
    author: string,
    pictures: Picture[],
    marchers: MarcherData[],
    musicFile: string
}

const starterMarchers: MarcherData[] = [
    {
        drillNumber: "M1",
        dots: [
            { pictureId: '0', coord: { x: 80, y: 56 } },
            { pictureId: '1', coord: { x: 80, y: 64 } },
        ]
    },
    {
        drillNumber: "M2",
        dots: [
            { pictureId: '0', coord: { x: 70, y: 52 } },
            { pictureId: '0', coord: { x: 70, y: 60 } },
        ]
    },
    {
        drillNumber: "M3",
        dots: [
            { pictureId: '0', coord: { x: 60, y: 48 } },
            { pictureId: '0', coord: { x: 60, y: 56 } },
        ]
    },
    {
        drillNumber: "M4",
        dots: [
            { pictureId: '0', coord: { x: 90, y: 60 } },
            { pictureId: '0', coord: { x: 90, y: 68 } },
        ]
    },
    {
        drillNumber: "M5",
        dots: [
            { pictureId: '0', coord: { x: 100, y: 64 } },
            { pictureId: '0', coord: { x: 100, y: 72 } },
        ]
    }
]

export const starterProject : ProjectData = {
    projectTitle: 'unsaved project',
    author: '',
    pictures: [{ pictureId: '0', countsToNext: 8 }, { pictureId: '1', countsToNext: 0 }],
    marchers: starterMarchers,
    musicFile: ''
}