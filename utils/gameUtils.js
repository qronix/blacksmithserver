const { Item } = require('../db/items.model');
const { ITEM_VALUES } = require('../utils/serverUtils');
const { UPGRADE_VALUES } = require('../utils/serverUtils');
const { EFFECT_VALUES } = require('../utils/serverUtils');

// const getNonEmptySpaces = (grid, alreadyFlat = false) => {
//     let flatGrid = grid;
//     if(!alreadyFlat){
//         flatGrid = flattenArray(grid);
//     }
//     const count = flatGrid.filter(id => id !== 0).length;
//     return count;
// }

const getEmptySpaceCount = (grid, alreadyFlat = false) => {
    try{
        let flatGrid = grid;
        if(!alreadyFlat){
            flatGrid = flattenArray(grid);
        }
        const count = flatGrid.filter(id => id === 0).length;
        return count;
    }catch(err){
        console.error('Get empty space count error: ', err.message);
        return null;
    }
}

const gridHasSpace = (grid, alreadyFlat = false) => {
    try{
        let flatGrid = grid;
        if(!alreadyFlat){
            flatGrid = flattenArray(grid);
        }
        return flatGrid.some(id => id === 0);
    }catch(err){
        console.error('Grid has space error: ', err);
        return null;
    }
}

const getIndexOfFirstFree = (grid, alreadyFlat = false) => {
    try{
        let flatGrid = grid;
        if(!alreadyFlat){
            flatGrid = flattenArray(grid);
        }
        return flatGrid.indexOf(0);
    }catch(err){
        console.error('Get index of first free error: ', err.message);
        return null;
    }
}

const purchaseUpgrade = (id, playerMoney, currentRank, currentMods) => {
    const { effects, cost, maxRank, costDelta } = UPGRADE_VALUES.get(id);
    if(currentRank < maxRank){
        let totalCost;
        if(currentRank === 0){
            totalCost = cost;
        }else{
            totalCost = (cost * costDelta * currentRank);
        }
        console.log('Player money: ', playerMoney);
        console.log('Upgrade cost: ', totalCost);
        if(playerMoney >= totalCost){
            let updatedMods;
            for(effect in effects){
                updatedMods = updateModifiersWithEffectModifiers(currentMods, effects[effect]);
            }
            const upgradeData = {
                modifiers: updatedMods,
                rank:(currentRank + 1),
                playerMoney:(playerMoney - totalCost),
            };
            console.log('PlayerMoney after upgrade: ', playerMoney);
            return { status:true, msg:"Upgrade unlocked!", data:upgradeData  };
        }else{
            return { status:false, msg:"Not enough money for upgrade", }
        }
    }else{
        return { status:false, msg:"Already at max rank", };
    }
}

const updateModifiersWithEffectModifiers = (currentMods, effectID) => {
    console.log('Effect is: ', EFFECT_VALUES.get(effectID));

    const { 
        type,
        increase, 
        } = EFFECT_VALUES.get(effectID);

    for(mod in currentMods){
        if(mod === type){
            currentMods[mod] += increase
        }
    }

    return currentMods;
}

const addItemToGrid = (grid, item) => {
    try{
        const flatGrid = flattenArray(grid);
        if(gridHasSpace(flatGrid, true)){
            const freeIndex = getIndexOfFirstFree(flatGrid, true);
            flatGrid[freeIndex] = item;
            let updatedGrid = convertFlatArrayToGrid(flatGrid);
            return {result:true, grid:updatedGrid};
        }else{
            return {result:false, grid}
        }
    }catch(err){
        console.error('Add item to grid error: ', err.message);
    }
}

const moveItems = (grid, request) => {
    try{
        const { source, target} = request;
        const sourceItemId = grid[source.row][source.col];
        if(sourceItemId !== 0){
            if(grid[target.row][target.col] === 0){
                grid[source.row][source.col] = 0;
                grid[target.row][target.col] = sourceItemId;
                return { result:true, grid };
            }
        }else{
            return { result:false, grid };
        }
    }catch(err){
        console.error('Move item error: ', err.message);
        return { result:false, grid };
    }
}

//check that source and target are same item type
//if not, deny request
//else remove the source item (set to 0)
//and increase the id of the target item
//ensure target item id + 1 is less than or equal to max item rank

const mergeItems = (grid, request) => {
    try{
        const { source, target } = request;
        const sourceId = grid[source.row][source.col];
        const targetId = grid[target.row][target.col];
        //items match and can be merged
        if(sourceId === targetId){
            const removedItemId = sourceId;
            grid[source.row][source.col] = 0;
            //TODO:
            //change to variable instead of hardcoded value
            if(targetId + 1 <= 139){
                const newItemId = targetId + 1;
                grid[target.row][target.col] = newItemId;
                return { result:true, grid, newItemId, removedItemId};
            }else{
                console.log('Item is a max item, cannot merge');
                return { result:false, grid, newItemId:null, removedItemId:null };
            }
        }else{
            return { result:false, grid, newItemId:null, removedItemId:null};
        }
    }catch(err){
        console.error('Merge items error: ', err.message);
        return { result:false, grid, newItemId:null, removedItemId:null};
    }
}

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

const calcMoneyPerSecond = async (grid, modifier = 1) => {
    try{
        const flatArray = flattenArray(grid);
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
        const totalMPS = mps * modifier;
        return totalMPS;
    }catch(err){
        console.error('Calc MPS error: ', err.message);
        return null;
    }
}

const getItemMoneyPerSecond = itemID => {
    try{
        let value = ITEM_VALUES.get(itemID);
        return value;
    }catch(err){
        console.error('Get item MPS error: ', err.message);
        return null;
    }
}


const calcMergeMPS = (currentMPS, mpsModifier, addItemMPS, removeItemMPS) => {
    try{
        const baseMPS = (currentMPS / mpsModifier);
        const mpsLessMergedItem = (baseMPS - (removeItemMPS * 2));
        const correctBaseMPS = ( mpsLessMergedItem + addItemMPS);
        const totalMPS = (correctBaseMPS * mpsModifier);
    
        return totalMPS;
    }catch(err){
        console.error('Calc merge MPS error: ', err.message);
        return null;
    }
}

const calcAddItemMPS = (currentMPS, mpsModifier, addItemMPS) => {
    try{
        const baseMPS = (currentMPS / mpsModifier);
        const correctBaseMPS = (baseMPS + addItemMPS);
        const totalMPS = (correctBaseMPS * mpsModifier);
    
        return totalMPS;
    }catch(err){
        console.error('Calc add item MPS error: ', err.message);
    }
}

//take an array with length of 24 items
//to a 4 x 6 array
//TODO: remove hardcoded values and pull values from
//a config file
const convertFlatArrayToGrid = flatArray => {
    try{
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
            return grid;
        }
    }
    catch(err){
        console.error('Convert flat array to grid error: ', err.message);
        return null;
    }
}

//TODO:
//Remove hardcoded values
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
    try{
        let flatArray = [];
        // array.forEach(subArray => subArray.forEach(item=>flatArray.push(item)));
        // nested arrays are objects?
        array.forEach(subArray => {
            for(item in subArray){
                flatArray.push(subArray[item]);
            }
        });
        return flatArray;
    }catch(err){
        console.error('Flatten array error: ', err.message);
        return null;
    }
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
    getItemMoneyPerSecond,
    calcMergeMPS,
    calcAddItemMPS,
    purchaseUpgrade,
}