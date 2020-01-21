const { Item } = require('../db/user.model');

const getNonEmptySpaces = grid => {
    const count = grid.flat().filter(id => id !== 0).length;
    return count;
}

const getEmptySpaceCount = grid => {
    const count = grid.flat().filter(id => id === 0).length;
    return count
}

const gridHasSpace = grid => {
    return grid.flat().some(id => id === 0);
}

const getIndexOfFirstFree = grid => {
    return grid.flat().reduce((acc, current) => {(grid[current] === 0) ? ()=> acc+=1 : acc+=1 },0);
}

const getItemMoneyPerSecond = itemID => {

}