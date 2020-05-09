const mergeMapAndArray = (map, arr) => {
    let packagedData = [];
    let idx = 0;
    
    for(let [k,v] of map){
      let data = {...v, ...arr[idx]}
      packagedData.push(data);
      idx++;
    }
    return packagedData;
  }

  module.exports = {
      mergeMapAndArray,
  }