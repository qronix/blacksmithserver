const { Item } = require('./items.model');
const { Upgrade } = require('./upgrades.model');
const { Effect } = require('./effects.model');

const ITEMS = require('./defaultDocuments/item-data.json');
const UPGRADES = require('./defaultDocuments/upgrade-data.json');
const EFFECTS = require('./defaultDocuments/effect-data.json');

const installItemDocument = () => {
    return new Promise(async (res,rej)=>{
        for(let i=0; i < ITEMS.length; i++){
            try{
                await addNewItem(ITEMS[i]);
            }catch(err){
                rej('Install item document error: ', err.message);
            }
        }
        res('Install item document successful');
    });
}

const installUpgradeDocument = () => {
    return new Promise(async (res, rej)=>{
        for(let i=0; i < UPGRADES.length; i++){
            try{
                await addNewUpgrade(UPGRADES[i]);
            }catch(err){
                rej('Install upgrade document error: ', err.message);
            }
        }
        res('Install upgrade document successful');
    });
}

const installEffectDocument = () => {
    return new Promise(async (res,rej)=>{
        for(let i=0; i < EFFECTS.length; i++){
            try{
                await addNewEffect(EFFECTS[i]);
            }catch(err){
                rej('Install effect document error: ', err.message);
            }
        }
        res('Install effect document successful');
    });
}

const addNewItem = itemData => {
    return new Promise(async (res, rej) => {
        try{
            const item = new Item({ ...itemData });
            await item.save();
            res(true);
        }catch(err){
            console.error('Add item error: ', err.message);
            rej(false);
        }
    });
}

const addNewEffect = effectData => {
    return new Promise(async (res, rej) => {
        try{
            const effect = new Effect({ ...effectData });
            await effect.save();
            res(true);
        }catch(err){
            console.error('Add effect error: ', err.message);
            rej(false);
        }
    });
}

const addNewUpgrade = upgradeData => {
    return new Promise(async (res, rej) => {
        try{
            const upgrade = new Upgrade({ ...upgradeData });
            await upgrade.save();
            res(true);
        }catch(err){
            console.error('Add upgrade error: ', err.message);
            rej(false);
        }
    });
}

const getItemInfoById = itemID => {
    return new Promise(async (res, rej) => {
        try{
            const item = await Item.find({ itemID });
            res(item[0]);
        }catch(err){
            console.log('Get item error: ', err.message);
            rej(null);
        }
    });
}

module.exports = { 
    installItemDocument, 
    installUpgradeDocument, 
    installEffectDocument,
    getItemInfoById,
 };