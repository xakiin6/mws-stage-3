self.onmessage = function(e) {
    switch(e.data.method) {
      case 'N':
        n();
        break;
        case 'C':
        c(e.data.data);
        break;
        case 'NC':
        nc(e.data.param[0],e.data.param[1],e.data.data);
        break;
        default:
        this.console.log('hello');
      }
    }
  
  c=(res)=>{
    // Get all cuisines from all restaurants
        let cuisines = res.map((v, i) => res[i].cuisine_type);
        // Remove duplicates from cuisines
        cuisines= cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        self.postMessage(`{"method":"C","data":${JSON.stringify(cuisines)}}`);
  }
  n=()=>{
    fu(' ').then(function(res){
        let nhoods = res.map((v, i) => res[i].neighborhood);
        nhoods=  nhoods.filter((v, i) => nhoods.indexOf(v) == i);
       self.postMessage(`{"method":"N","data":${JSON.stringify(nhoods)},"N":${JSON.stringify(res)}}`);
      });
  }

nc=(cuisine, neighborhood,res)=>  {
        let results = res;
        if (cuisine != 'all') {
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') {
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        self.postMessage(`{"method":"NC","data":${JSON.stringify(results)}}`);
  }
fu =(url)=> {return  fetch('http://localhost:1337/restaurants').then(res=> res.json());}