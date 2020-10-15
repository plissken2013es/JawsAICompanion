import ZoneNames from "~/consts/ZoneNames"

const MapConfig = [
    {name: ZoneNames.ONE, 
        x: 0, y: 0, 
        bx: 150, by: 100, 
        seaX: 200, seaY: 90},

    {name: ZoneNames.TWO, 
        x: 420, y: 0, 
        bx: 950, by: 120, 
        seaX: 907, seaY: 32},

    {name: ZoneNames.THREE, 
        x: 0, y: 243, 
        bx: 100, by: 680, 
        seaX: 230, seaY: 710},

    {name: ZoneNames.FOUR, 
        x: 384, y: 243, 
        bx: 1000, by: 680, 
        seaX: 650, seaY: 680},
    
    {name: ZoneNames.FIVE, 
        x: 90, y: 155, 
        bx: 271, by: 270, 
        gndX: 326, gndY: 326, 
        seaX: 227, seaY: 318},
    
    {name: ZoneNames.SIX, 
        x: 411, y: 28, 
        bx: 738, by: 107, 
        gndX: 609, gndY: 213, 
        seaX: 601, seaY: 72},
    
    {name: ZoneNames.SEVEN, 
        x: 141, y: 302, 
        bx: 421, by: 570, 
        gndX: 374, gndY: 460, 
        seaX: 294, seaY: 589},        

    {name: ZoneNames.EIGHT, 
        x: 483, y: 241, 
        bx: 950, by: 500, 
        gndX: 665, gndY: 416, 
        seaX: 907, seaY: 416},

    {name: ZoneNames.N, 
        x: 177, y: 35,  
        bx: 465, by: 119,
        isBeach: true, 
        sx: 328, sy: 207, 
        gndX: 399, gndY: 247, 
        seaX: 347, seaY: 134},
    
    {name: ZoneNames.S, 
        x: 385, y: 327, 
        bx: 750, by: 595, 
        isBeach: true, 
        sx: 693, sy: 558, 
        gndX: 534, gndY: 465, 
        seaX: 550, seaY: 569},

    {name: ZoneNames.E, 
        x: 548, y: 77, 
        bx: 887, by: 245, 
        isBeach: true, 
        sx: 794, sy: 169, 
        gndX: 698, gndY: 301, 
        seaX: 776, seaY: 226},
    
    {name: ZoneNames.W, 
        x: 21, y: 245, 
        bx: 200, by: 575, 
        isBeach: true, 
        sx: 172, sy: 570, 
        gndX: 248, gndY: 460, 
        seaX: 68, seaY: 475},
    
    {name: ZoneNames.A, 
        x: 298, y: 204, 
        gndX: 480, gndY: 346}
]

export default MapConfig