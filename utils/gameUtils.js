const { Item } = require('../db/items.model');
const { ITEM_VALUES } = require('../utils/serverUtils');


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
    // console.log('Grid has space: ', gridHasSpace(flatGrid, true));
    if(gridHasSpace(flatGrid, true)){
        const freeIndex = getIndexOfFirstFree(flatGrid, true);
        flatGrid[freeIndex] = item;
        // console.log('Converting flat to grid!');
        let updatedGrid = convertFlatArrayToGrid(flatGrid);
        // debugger
        // console.log('Returning (updatedGrid): ',  updatedGrid);
        return {result:true, grid:updatedGrid};
    }else{
        return {result:false, grid}
    }
}

const moveItems = (grid, request) => {

    //todo: add result to return
    try{
        const { source, target} = request;
        const sourceItemId = grid[source.row][source.col];
        if(sourceItemId !== 0){
            if(grid[target.row][target.col] === 0){
                grid[source.row][source.col] = 0;
                grid[target.row][target.col] = sourceItemId;

                console.log('Item was moved!');
                return { result:true, grid };
            }
        }else{
            return { result:false, grid };
        }
    }catch(err){
        console.log('Move item error: ', err.message);
        return { result:false, grid };
    }
}

const mergeItems = (grid, request) => {
    try{
        //check that source and target are same item type
        //if not, deny request
        //else remove the source item (set to 0)
        //and increase the id of the target item
        //ensure target item id + 1 is less than or equal to max item rank
        const { source, target } = request;
        const sourceId = grid[source.row][source.col];
        const targetId = grid[target.row][target.col];

        //items match and can be merged
        if(sourceId === targetId){
            grid[source.row][source.col] = 0;
            //TODO:
            //change to variable instead of hardcoded value
            if(targetId + 1 <= 139){
                grid[target.row][target.col] = targetId + 1;
                return { result:true, grid };
            }else{
                console.log('Item is a max item, cannot merge');
                return { result:false, grid };
            }
        }else{
            //add status
            return { result:false, grid };
        }
    }catch(err){
        console.log('Merge items error: ', err.message);
        return { result:false, grid };
    }
}

const calcMoneyPerSecond = async (grid, modifier = 1) => {
    const flatArray = flattenArray(grid);
    debugger
    // const moneyPerSecondCalc = flatArray.reduce(async (acc,cur)=>{
    //     //check if item value is alread in value map
    //     const value = ITEM_VALUES.get(cur);
    //     if(value){
    //         return acc += value;
    //     }else{
    //         //get item value from db
    //         let { moneyPerSecond } = await Item.findOne({itemID:cur});
    //         ITEM_VALUES.set(item, moneyPerSecond);
    //         return acc += moneyPerSecond;
    //     }
    // },0);
    let mps = 0;
    for(let item of flatArray){
        let value = ITEM_VALUES.get(item);
        if(!value){
            let {moneyPerSecond} = await Item.findOne({ itemID:item });
            ITEM_VALUES.set(item, moneyPerSecond);
            value = moneyPerSecond;
        }
        mps += value;
    }
    console.log(`Got mps total as: ${mps}`);
    debugger
    const totalMPS = mps * modifier;
    console.log(`Calculated total MPS as ${totalMPS}`);
    return totalMPS;
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
        // console.log('Returning grid: ', grid);
        return grid;
    }
}

const convertCoordsToFlatIndex = coords => {
    try{
        const { 
            sourceItem: { row:sourceRow, col:sourceCol }, 
            target:{ row:targetRow, col:targetCol },
        } = coords;
    
        const sourceFlatIndex = ( 4 * sourceRow ) + sourceCol;
        const targetFlatIndex = ( 4 * targetRow ) + targetCol;
    
        const flatIndices = {
            sourceFlatIndex,
            targetFlatIndex
        };
    
        return flatIndices;

    }catch(err){
        console.log('Coords conversion error: ', err.message);
        return null;
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
    calcMoneyPerSecond,
    convertCoordsToFlatIndex,
    moveItems,
    mergeItems,
}