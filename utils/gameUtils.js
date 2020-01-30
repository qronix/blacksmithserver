const { Item } = require('../db/user.model');

const getNonEmptySpaces = grid => {
    const flatGrid = flattenArray(grid);
    const count = flatGrid.filter(id => id !== 0).length;
    return count;
}

const getEmptySpaceCount = grid => {
    const flatGrid = flattenArray(grid);
    const count = flatGrid.filter(id => id === 0).length;
    return count
}

const gridHasSpace = grid => {
    const flatGrid = flattenArray(grid);
    return flatGrid.some(id => id === 0);
}

const getIndexOfFirstFree = grid => {
    const flatGrid = flattenArray(grid);
    return flatGrid.indexOf(0);
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
    getIndexOfFirstFree
}