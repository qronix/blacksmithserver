const { Item } = require('../db/items.model');
const { Upgrade } = require('../db/upgrades.model');
const { Effect } = require('../db/effects.model');

const ITEM_VALUES = new Map();
const UPGRADE_VALUES = new Map();
const EFFECT_VALUES = new Map();


const getItemValues = async () => {
    try{
        const items = await Item.find({});
        for(item of items){
            const { itemID, moneyPerSecond } = item;
            ITEM_VALUES.set(itemID, moneyPerSecond);
        }
        return console.log(`Got ${ ITEM_VALUES.size } items from DB`);
    }catch(err){
        console.error('Get item values error: ', err.message);
    }
}

const getUpgradeValues = async () => {
    try{
        const upgrades = await Upgrade.find({});
        for(upgrade of upgrades){
            // console.log('Upgrade is: ', upgrade);
            const { 
                upgradeID, 
                effects, 
                cost, 
                maxRank, 
                costDelta,
                icon,
                description,
                name,
             } = upgrade;
                // console.log('Upgrade id: ', upgradeID);
                UPGRADE_VALUES.set(upgradeID, {effects, cost, maxRank, costDelta, icon, description, name});
        }
        return console.log(`Got ${ UPGRADE_VALUES.size } upgrades from DB`);
    }catch(err){
        console.error('An error occured when getting upgrade values: ', err.message);
    }
}

const getEffectValues = async () => {
    try{
        const effects = await Effect.find({});

        for(effect of effects){
            const { effectID, modifier } = effect;
            EFFECT_VALUES.set(effectID, modifier);
        }
        return console.log(`Got ${ EFFECT_VALUES.size } effects from DB`);
    }catch(err){
        console.error('An error occured when getting effect values: ', err.message);
    }
}

module.exports = { 
    ITEM_VALUES, 
    getItemValues,
    UPGRADE_VALUES,
    getUpgradeValues,
    EFFECT_VALUES,
    getEffectValues,
 };