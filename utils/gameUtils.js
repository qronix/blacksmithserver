const { Item } = require('../db/user.model');
const GRID_WIDTH = 4;
const GRID_HEIGHT = 6;

const getNonEmptySpaces = (grid, alreadyFlat = false) => {
    let flatGrid = grid;
    if(!alreadyFlat){
        flatGrid = flattenArray(grid);
    }
    const count = flatGrid.filter(id => id !== 0).length;
    return count;
}

const getEmptySpaceCount = (grid, alreadyFlat = false) => {
    let flatGrid = grid;
    if(!alreadyFlat){
        flatGrid = flattenArray(grid);
    }
    const count = flatGrid.filter(id => id === 0).length;
    return count;
}

const gridHasSpace = (grid, alreadyFlat=false) => {
    let flatGrid = grid;
    if(!alreadyFlat){
        flatGrid = flattenArray(grid);
    }
    return flatGrid.some(id => id === 0);
}

const getIndexOfFirstFree = (grid, alreadyFlat=false) => {
    let flatGrid = grid;
    if(!alreadyFlat){
        flatGrid = flattenArray(grid);
    }
    return flatGrid.indexOf(0);
}

const addItemToGrid = (grid, item) => {
    const flatGrid = flattenArray(grid);
    console.log('Grid has space: ', gridHasSpace(flatGrid, true));
    if(gridHasSpace(flatGrid, true)){
        const freeIndex = getIndexOfFirstFree(flatGrid, true);
        flatGrid[freeIndex] = item;
        console.log('Converting flat to grid!');
        let updatedGrid = convertFlatArrayToGrid(flatGrid);
        // debugger
        console.log('Returning (updatedGrid): ',  updatedGrid);
        return {result:true, grid:updatedGrid};
    }else{
        return {result:false, grid}
    }
}

const convertFlatArrayToGrid = flatArray => {
    //take an array with length of 24 items
    //to a 4 x 6 array
    let grid = [];
    let row = [];
    let indexCounter = 0;
    const ARRAY_ROW_WIDTH_REQUIREMENT = 4;
    const ARRAY_ROW_HEIGHT_REQUIREMENT = 6;
    const ARRAY_LENGTH_REQUIREMENT = (ARRAY_ROW_WIDTH_REQUIREMENT * ARRAY_ROW_HEIGHT_REQUIREMENT);

    if(flatArray.length !== ARRAY_LENGTH_REQUIREMENT){
        throw Error('Array is incorrect length');
    }else{
        //row
        for(let i=0; i<ARRAY_ROW_HEIGHT_REQUIREMENT; i++){
            //column
            for(let j=0; j<ARRAY_ROW_WIDTH_REQUIREMENT; j++){
                row.push(flatArray[indexCounter]);
                indexCounter++;
            }
            grid.push(row);
            row = [];
        }
        console.log('Returning grid: ', grid);
        return grid;
    }
}

//Array.prototype.flat is not compatible with
//certain browsers or certain NodeJs versions
//this polyfill will allow the flattening
//of a 2D array into a 1D array
const flattenArray = array => {
    let flatArray = [];
    // array.forEach(subArray => subArray.forEach(item=>flatArray.push(item)));
    // nested arrays are objects?
    array.forEach(subArray =>{
        for(item in subArray){
            flatArray.push(subArray[item]);
        }
    });
    return flatArray;
}

const getItemMoneyPerSecond = itemID => {

}

module.exports = {
    getEmptySpaceCount,
    gridHasSpace,
    getIndexOfFirstFree,
    addItemToGrid,
}