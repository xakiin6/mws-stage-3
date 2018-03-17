
let restaurants,allRestaurants,
  neighborhoods,
  cuisines;
var map,myWorker;
var markers = [];
let ul,neighborhoods_select,cuisines_select;
let observer;
document.addEventListener('DOMContentLoaded',()=>{
//myInit();
},false);

function StartImageObserver(){
  const images = document.querySelectorAll('#restaurants-list li');
const config = {
  // If the image gets within 50px in the Y axis, start the download.
  rootMargin: '50px 0px',
  threshold: 0.01
};
  if (!('IntersectionObserver' in window)) {
    Array.from(images).forEach(image => populateImages(image));
  } else {
    // It is supported, load the images
    observer = new IntersectionObserver(onIntersection, config);
    images.forEach(image => observer.observe(image));
  }
}
function onIntersection(entries) {
  // Loop through the entries
  entries.forEach(entry => {
    // Are we in viewport?
    if (entry.intersectionRatio > 0) {
    // Stop watching and load the image
      observer.unobserve(entry.target);
      populateImages(entry.target);
      
    }
  });
}

function populateImages(image) {
  image.insertAdjacentHTML('afterbegin',image.dataset.image);
}
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

  //addMarkersToMap();
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
  restaurants.forEach(restaurant => {ul.append(createRestaurantHTML(restaurant));});
  if(self.map){addMarkersToMap();}
//StartImageObserver();
}
createRestaurantHTML = (restaurant) => {
  const li = renderHtml('li', null);
  //src="${restaurant.photograph}.jpg"
  const image =`<img class="restaurant-img" alt="${restaurant.name} restaurant" src="img/${restaurant.photograph||'10'}.jpg">`; 
  li.innerHTML=image;
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