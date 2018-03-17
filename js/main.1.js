
let restaurants,allRestaurants,
  neighborhoods,
  cuisines;
var map,myWorker;
var markers = [];
let ul,neighborhoods_select,cuisines_select;
document.addEventListener('DOMContentLoaded',function(event){
  requestAnimationFrame(function() { myInit();});
});
function myInit() {
  neighborhoods_select = document.getElementById('neighborhoods-select');
  cuisines_select = document.getElementById('cuisines-select');
  ul = document.getElementById('restaurants-list');
  if (window.Worker) { // Check if Browser supports the Worker api.
    // Requires script name as input
    self.myWorker = new Worker("js/worker-min.js");
    self.myWorker.postMessage({method:'N'});
    requestAnimationFrame(function() {  self.myWorker.onmessage = function(e) {
     
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
      
    };});
  }
};
fetchNeighborhoods = (res) => {
    self.neighborhoods= res;
    fillNeighborhoodsHTML();
}
let observer;
observeImages =()=>{
const images = document.querySelectorAll('img[data-src]');
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
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  neighborhoods.forEach(neighborhood => {
    neighborhoods_select.insertAdjacentHTML('beforeend',`<option value="${neighborhood}">${neighborhood}</option>`);
  });
}
fetchCuisines = (cuisines) => {
  self.cuisines = cuisines;
  fillCuisinesHTML();
  updateRestaurants();
}
fillCuisinesHTML = (cuisines = self.cuisines) => {
  cuisines.forEach(cuisine => {
    cuisines_select.insertAdjacentHTML('beforeend',`<option value="${cuisine}">${cuisine}</option>`);
  });
}
window.initMap = () => {
   let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  
  requestAnimationFrame(function() { addMarkersToMap();});
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
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  if (!restaurants || restaurants.length ===0) {
    ul.innerHTML = `<li style="width:100% !important"><p>No restaurants found!</p></li>`;
    return;
  }
  
//  var i=0,len =2; //restaurants.length;    
//  for (i=0;i< len; i++) {
//   ul.append(createRestaurantHTML(restaurants[i]));
//   }
// restaurants.map(restaurant => {
//     ul.append(createRestaurantHTML(restaurant));
//   });
  //observeImages();

if(self.map) {
  addMarkersToMap();
}
}
createRestaurantHTML = (restaurant) => {
  const li = renderHtml('li', null);
  const imgsrc=DBHelper.imageUrlForRestaurant(restaurant);
  const image =`<img class="restaurant-img" alt="${restaurant.name} restaurant" src="${imgsrc}" srcset="${imgsrc} 600w" sizes="(max-width: 430px) 25vw, (min-width: 650px) calc((100vw - 65px)/2)">`; 
  li.insertAdjacentHTML('beforeend',image);
  renderHtml('h2', restaurant.name,li);
  renderHtml('p', restaurant.neighborhood,li);
  renderHtml('p', restaurant.address,li);
  const more = renderHtml('a', 'View Details');
  more.setAttribute('aria-label', `View Details ${restaurant.name} Restaurant`);
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  return li;
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