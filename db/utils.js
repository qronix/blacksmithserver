const { Item } = require('./items.model');
const { Upgrade } = require('./upgrades.model');
const { Effect } = require('./effects.model');

const ITEMS = require('./defaultDocuments/item-data.json');
const UPGRADES = require('./defaultDocuments/upgrade-data.json');
const EFFECTS = require('./defaultDocuments/effect-data.json');

const installItemDocument = async () => {
    for(let i=0; i<ITEMS.length; i++){
        try{
            await addNewItem(ITEMS[i]);
        }catch(err){
            break;
        }
    }
}

const installUpgradeDocument = async () => {
    for(let i=0; i<UPGRADES.length; i++){
        try{
            await addNewUpgrade(UPGRADES[i]);
        }catch(err){
            break;
        }
    }
}

const installEffectDocument = async () =>{
    for(let i=0; i<EFFECTS.length; i++){
        try{
            await addNewEffect(EFFECTS[i]);
        }catch(err){
            break;
        }
    }
}

const addNewItem = itemData => {
    const item = new Item({...itemData});
    return new Promise(async (res, rej)=>{
        try{
            await item.save();
            res(true);
            
        }catch(err){
            rej(false);
        }
    });
}

const addNewEffect = effectData => {
    const effect = new Effect({...effectData});
    return new Promise(async (res, rej)=>{
        try{
            await effect.save();
            res(true);
            
        }catch(err){
            rej(false);
        }
    });
}

const addNewUpgrade = upgradeData => {
    const upgrade = new Upgrade({ ...upgradeData });
    return new Promise(async (res, rej) => {
        try{
            await upgrade.save();
            res(true);
            
        }catch(err){
            console.log('Upgrade install error: ', err.message);
            rej(false);
        }
    });
}

const getItemInfoById = itemID => {
    return new Promise(async (res, rej) => {
        try{
            const item = await Item.find({ itemID });
            rej(item);
        }catch(err){
            console.log('Get item error: ', err.message);
            res(null);
        }
    });
}

module.exports = { 
    installItemDocument, 
    installUpgradeDocument, 
    installEffectDocument,
    getItemInfoById,
 };