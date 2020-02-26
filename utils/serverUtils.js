const { Item } = require('../db/items.model');

const ITEM_VALUES = new Map();


const getItemValues = async () => {
    try{
        const items = await Item.find({});
        for(item of items){
            const { itemID, moneyPerSecond } = item;
            ITEM_VALUES.set(itemID, moneyPerSecond);
        }
    }catch(err){
        console.error('Get item values error: ', err.message);
    }
}


module.exports = { ITEM_VALUES, getItemValues };