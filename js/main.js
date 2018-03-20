
let restaurants,allRestaurants,
  neighborhoods,
  cuisines;
var map,myWorker;
var markers = [];
let ul,neighborhoods_select,cuisines_select;
let isMobileMap=false,isDesktopMap=false;
function myInit() {
  neighborhoods_select = document.getElementById('neighborhoods-select');
  cuisines_select = document.getElementById('cuisines-select');
  ul = document.getElementById('restaurants-list');
  if (window.Worker) { // Check if Browser supports the Worker api.
    // Requires script name as input
    self.myWorker = new Worker("/js/worker-min.js");
    self.myWorker.postMessage({method:'N'});
 requestAnimationFrame(()=>{self.myWorker.onmessage = function(e) {
     
      var res = JSON.parse(e.data);
      switch(res.method) {
        case 'N': 
        fetchNeighborhoods(res.data);
        self.myWorker.postMessage({method:'C',data:res.N});
        self.allRestaurants =res.N;
        break;
        case 'C':
        fetchCuisines(res.data);
        break;
        case 'NC':
        resetRestaurants(res.data);
        fillRestaurantsHTML();
    break;
      }
    }
  });
  }
}
let observer;
observeImages =()=>{
const images = document.querySelectorAll('#restaurants-list li img[data-src]');
const config = {
  rootMargin: '50px 0px',
  threshold: 0.01
};
if ('IntersectionObserver' in window) {
  observer = new IntersectionObserver(onChange, config);
  images.forEach(img => observer.observe(img));
} else {
  images.forEach(image => loadImage(image));
}
}
const loadImage = image => {
  image.src = image.dataset.src;
}

function onChange(changes, observer) {
  changes.forEach(change => {
    if (change.intersectionRatio > 0) {
      // Stop watching and load the image
      loadImage(change.target);
      observer.unobserve(change.target);
    }
  });
}
fetchNeighborhoods = (res) => {
    self.neighborhoods= res;
    fillNeighborhoodsHTML();
}
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  neighborhoods.forEach(neighborhood => {
    neighborhoods_select.insertAdjacentHTML('beforeend',`<option value="${neighborhood}">${neighborhood}</option>`);
  });
}
fetchCuisines = (cuisines) => {
  self.cuisines = cuisines;
  fillCuisinesHTML();
  updateRestaurants();
  self.startMaps();
}
fillCuisinesHTML = (cuisines = self.cuisines) => {
  cuisines.forEach(cuisine => {
    cuisines_select.insertAdjacentHTML('beforeend',`<option value="${cuisine}">${cuisine}</option>`);
  });
}
window.addEventListener('resize',()=>{
  self.startMaps();
});
window.startMaps=()=>{
  if(window.innerWidth < 464) {
    var mapdiv =document.getElementById('map');
  mapdiv.style.display ='none';
  self.isDesktopMap =false;  
  self.InitMobileMap();
    
      
    } else {
      
      var mapImage = document.querySelector('.static_map');
      mapImage.style.display ='none';
      self.isMobileMap =false;
      self.initDesktopMap();
    }
}

window.InitMobileMap=() => {
  var mapImage = document.querySelector('.static_map');
  mapImage.style.display ='block'; 
  if(self.isMobileMap===true) {
    return;
  }
  self.isMobileMap =true;
  self.isDesktopMap =false;
  
  var maplocations =addMarkersToMobileMap(true);
  mapImage.setAttribute('src',`https://maps.googleapis.com/maps/api/staticmap?center=40.722216,-73.987501&markers=size:large|color:red|${maplocations}&zoom=12&size=458x400&maptype=roadmap&key=AIzaSyAsggoUe5zy3jLXhAo-kYQ8xmgpTi377Ec`);
  mapImage.addEventListener('click',function(e){
    e.preventDefault(); 
    mapImage.style.display ='none'; 
    self.initDesktopMap();
  
  });

}

window.initDesktopMap = () => {
  var mapdiv =document.getElementById('map');
  mapdiv.style.display ='block';
  if(self.isDesktopMap===true) {
    return;
  }
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  
  self.map = new google.maps.Map(mapdiv, {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
   self.isDesktopMap=true;
   
  addMarkersToMap();
}
updateRestaurants = () => {
  const cIndex = cuisines_select.selectedIndex;
  const nIndex = neighborhoods_select.selectedIndex;

  const cuisine = cuisines_select[cIndex].value;
  const neighborhood = neighborhoods_select[nIndex].value;
  self.myWorker.postMessage({method:'NC',param:[cuisine,neighborhood],data:self.allRestaurants});
}
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  ul.innerHTML = '';
  // Remove all map markers
  if(self.map)
    self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  if (!restaurants) {
    ul.innerHTML = `<li style="width:100% !important"><p>No restaurants found!</p></li>`;
    return;
  }
  var ul_temp = renderHtml('ul',null);
  restaurants.forEach(restaurant => {ul_temp.append(createRestaurantHTML(restaurant));});
  ul.innerHTML=ul_temp.innerHTML;
  if(window.innerWidth < 464) {
    
      addMarkersToMobileMap(false);
  }
    else {
   if(self.map) {addMarkersToMap();}
  
  }
   observeImages();
 
}
createRestaurantHTML = (restaurant) => {
  const li = renderHtml('li', null);
  const image =`<img class="restaurant-img" alt="${restaurant.name} restaurant" data-src="img/${restaurant.photograph||'10'}.jpg">`; 
  li.innerHTML=image;
  var title =renderHtml('h2', restaurant.name,li);
  if(restaurant.is_favorite==='true')
      title.innerHTML+=' <span class="favorite"></span>';
  renderHtml('p', restaurant.neighborhood,li);
  renderHtml('p', restaurant.address,li);
  const more = renderHtml('a', 'View Details');
  more.setAttribute('aria-label', `View Details ${restaurant.name} Restaurant`);
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  return li;
}

addMarkersToMobileMap = (firstRun,restaurants = self.restaurants) => {
  if(restaurants) {
    let MobileMarkers ='';
  restaurants.forEach(restaurant => {
    // Add marker to the map
    MobileMarkers += `${restaurant.latlng.lat},${restaurant.latlng.lng}|`;
    });
   if(firstRun===false) {
    var mapImage = document.querySelector('.static_map');
    mapImage.style.display ='block'; 
    mapImage.src=`https://maps.googleapis.com/maps/api/staticmap?center=40.722216,-73.987501&markers=size:large|color:red|${MobileMarkers}&zoom=12&size=458x400&maptype=roadmap&key=AIzaSyAsggoUe5zy3jLXhAo-kYQ8xmgpTi377Ec`;
   } 
  return MobileMarkers;
}
}

addMarkersToMap = (restaurants = self.restaurants) => {
  if(restaurants) {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}
}
renderHtml = (name, value,parent=null) => {
  var element = document.createElement(name);
  if (value) {
    element.innerHTML = value;
  }
  if(parent) {
  parent.append(element);
  }
  return element;
}