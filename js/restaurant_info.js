let restaurant;
let reviews;
var map;
let is_favorite;
var modalOverlay; 
var modal,mapMobileInit=false,mapDesktopInit=false; 
let focusedElementBeforeModal= document.activeElement;
const focusableElementsString = 'input:not([disabled]), textarea:not([disabled]), button:not([disabled])';
// Generate restaurant info 
 function initHtml() {
  fetchRestaurantFromURL();
  modalOverlay =document.querySelector('.modal-overlay');
  modal= document.querySelector('.modal');
};
window.addEventListener('resize',()=>{
  self.startMaps();
});
window.startMaps=()=>{
  if(window.innerWidth < 817) {
    self.InitMobileMap();
    
      
    } else {
      
      self.initDesktopMap();
    }
}

/**
 * Initialize Google map, called from HTML.
 */
window.InitMobileMap=() => {
  if(self.InitMobileMap===true) {
    return;
  }
  fetchRestaurantFromURL().then(function(restaurant){
  var mapImage = document.querySelector('.static_map');
  mapImage.setAttribute('src',`https://maps.googleapis.com/maps/api/staticmap?center=${restaurant.latlng.lat},${restaurant.latlng.lng}&markers=size:large|color:red|${restaurant.latlng.lat},${restaurant.latlng.lng}&zoom=16&size=400x400&maptype=roadmap&key=AIzaSyAsggoUe5zy3jLXhAo-kYQ8xmgpTi377Ec`);
  mapImage.addEventListener('click',function(e){
    e.preventDefault(); 
    
    mapImage.style.display ='none'; 
    self.initDesktopMap();})
});
}
window.initDesktopMap = () => {
  if(self.mapDesktopInit===true) {
    return;
  }
  fetchRestaurantFromURL().then(function(restaurant){
   var mapdiv =document.getElementById('map');
   mapdiv.style.display ='block'; 
      self.map = new google.maps.Map(mapdiv, {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    });
    self.mapDesktopInit =true;
}

/**
 * Get current restaurant from page URL.
 */
function fetchRestaurantFromURL() {
  if (self.restaurant) { // restaurant already fetched!
  return Promise.resolve(self.restaurant);
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
     console.error('No restaurant id in URL');
     return Promise.reject('No restaurant id in URL');
  } else {
  return  DBHelper.fetchRestaurantById(id).then(function(restaurant){
      if (!restaurant) {
        console.error('No restaurant data');
        return Promise.reject('No restaurant data');
      }
      
      self.restaurant = restaurant;
      fillRestaurantHTML();
      fillBreadcrumb();
     return Promise.resolve(self.restaurant);
  });
}
}

markFavorite=(element)=>{

  if(self.is_favorite ==='true') {
  element.classList.remove('favorite');
  element.classList.add('un_favorite');
  self.restaurant.is_favorite ='false';
  self.is_favorite ='false';
  element.removeAttribute('aria-label');
  element.setAttribute('aria-label','Mark as favorite');
  
} else {
  self.restaurant.is_favorite ='true';
  self.is_favorite ='true';
  element.removeAttribute('aria-label');
  element.setAttribute('aria-label','Remove favorite mark');
  element.classList.remove('un_favorite');
  element.classList.add('favorite');
}

DBHelper.markAsFavorite(self.restaurant);
}
/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  self.is_favorite = restaurant.is_favorite;
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  if(restaurant.is_favorite==='true') {
  name.innerHTML+=`<button tabindex="0" aria-label="Remove favorite mark" onclick="markFavorite(this)" class="favorite"></button>`;
  } else {
    name.innerHTML+=`<button tabindex="0" aria-label="Mark as favorite" onclick="markFavorite(this)" class="un_favorite"></button>`;
  }
  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;
  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.setAttribute('alt',restaurant.name+ ' restaurant');
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.srcset = DBHelper.imageUrlsForSrcSet(restaurant.photograph);
  image.sizes ='(max-width: 430px) 25vw, (min-width: 650px) calc((100vw - 65px)/2)';
  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;
  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = renderHtml('td',key);
    day.setAttribute("tabindex",0);
    row.appendChild(day);

    const time = renderHtml('td',operatingHours[key]);
    time.setAttribute("tabindex",0);
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.reviews) => {
  if(!reviews) {
  DBHelper.fetchReviewsByRestaurant(self.restaurant.id).then(function(response){
    self.reviews =response;
    fillReviewsHTML();
  });
}
  const container = document.getElementById('reviews-container');
  container.innerHTML ='';
  const title = renderHtml('h3','Reviews');
  const add_review = renderHtml('button','Add Review');
    add_review.addEventListener('click',openReviewModal);
    add_review.style ='float:right';
    title.appendChild(add_review);
  container.appendChild(title);
  const ul = renderHtml('ul',null);
  ul.id='reviews-list';
  if (!reviews) {
  const noReviews = renderHtml('p','No reviews yet!');
    container.appendChild(noReviews);
    self.startMaps();
    return;
  }
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
  self.startMaps();
}
/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');

  const name = renderHtml('p',review.name);
  name.setAttribute('class','reviews-list-title');
  li.appendChild(name);
  const date = renderHtml('p',new Date(review.createdAt).toGMTString().slice(0,16));
  date.setAttribute('class','reviews-list-date');
  li.appendChild(date);
  
  const rating = renderHtml('p',`Rating: ${review.rating}`);
  rating.setAttribute('class','reviews-list-rating');
  li.appendChild(rating);

  const comments = renderHtml('p',review.comments);
  comments.setAttribute('class','reviews-list-review');
  li.appendChild(comments);
  return li;
}
openReviewModal =()=>{
focusedElementBeforeModal = document.activeElement;
modal.innerHTML='';

modalOverlay.addEventListener('click',closeModal);
const reviewForm = renderHtml('form',null);
const review_header = renderHtml('h1','Add Review Form');
  review_header.id='review_header';
  modal.setAttribute('aria-labelledby','review_header');
const reviewer_name = renderForm('input','name','text');
const reviewer_name_Id = renderHtml('label','Name:');
reviewer_name_Id.setAttribute('for','name');
const rating = renderForm('input','rating','number');
rating.min='1'; rating.max='5';
const rating_Id = renderHtml('label','Rating:');
rating_Id.setAttribute('for', 'rating');
const comment_text = renderForm('textarea','comments');
const comment_Id = renderHtml('label','Comment:');
comment_Id.setAttribute('for','comments');
const add_comment = renderForm('button','Add_Comment','button');
add_comment.innerHTML ='Add Review';
add_comment.addEventListener('click', addReview);
const message_container = renderHtml('div','');
  message_container.id='message_container';
addChildsToElement(reviewForm,[review_header,reviewer_name_Id,reviewer_name,rating_Id,rating,comment_Id,comment_text,message_container,add_comment]);
modal.appendChild(reviewForm);
modal.style.display ='block';
modalOverlay.style.display ='block';

// Listen for and trap the keyboard
  modal.addEventListener('keydown', trapTabKey);
  var focusableElements = modal.querySelectorAll(focusableElementsString);
  // Convert NodeList to Array
  focusableElements = Array.prototype.slice.call(focusableElements);
  focusableElements[0].focus();
}

trapTabKey=(e)=> {
  var focusableElements = modal.querySelectorAll(focusableElementsString);
  // Convert NodeList to Array
  focusableElements = Array.prototype.slice.call(focusableElements);

  var firstTabStop = focusableElements[0];
  var lastTabStop = focusableElements[focusableElements.length - 1];
  // Check for TAB key press
  if (e.keyCode === 9) {

    // SHIFT + TAB
    if (e.shiftKey) {
      if (document.activeElement === firstTabStop) {
        e.preventDefault();
        lastTabStop.focus();
      }

    // TAB
    } else {
      if (document.activeElement === lastTabStop) {
        e.preventDefault();
        firstTabStop.focus();
      }
    }
  }

  // ESCAPE
  if (e.keyCode === 27) {
    closeModal();
  }
}
closeModal= () => {
  modal.style.display ='none';
  modalOverlay.style.display ='none';
  focusedElementBeforeModal.focus();
}
addChildsToElement=(element,children) =>{
  children.forEach(child => {
  element.appendChild(child);
  });
}

addReview =(e) => {
 var formInputs=  modal.querySelectorAll(focusableElementsString);
  const review = {
    "restaurant_id":self.restaurant.id ,
    "name": formInputs[0].value,
    "rating": formInputs[1].value,
    "comments": formInputs[2].value,
    "createdAt" : Date.now()
};

  if(checkEmptyFields(formInputs)) {
    DBHelper.postReviews(JSON.stringify(review)).then(function (result){
    self.reviews.push(result);
    fillReviewsHTML();
  }).catch(function(error){
    self.reviews.push(review);
    fillReviewsHTML();
  });
  closeModal();
} 
}

checkEmptyFields=(formInputs)=>{
  let valid =true;
const  message_container= document.querySelector('#message_container');
message_container.innerHTML='';
if(formInputs[0].value ==='' || (formInputs[1].value <1 || formInputs[1].value >5 || formInputs[1].value ==='') || formInputs[2].value ==='')
 {  
   valid =false;
   message_container.innerHTML='Please fill above empty feild!';
   message_container.setAttribute('role','alert');
   message_container.setAttribute('aria-live','assertive');
}
 return valid;
}
/**
 * Create elements and return.
 */
renderHtml =(name,value) => {
  var element = document.createElement(name);
  if(value) {
    element.innerHTML = value;
  }
  return element;
}

renderForm =(name,id,type) => {
  const element = document.createElement(name);
  element.id=id;
  element.name =id;
  if(type) {
    element.type =type;
  }
  if(name==='input' || name==='textarea') {
    element.setAttribute('required','');
  }
  return element;
}
/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  
  if(restaurant) {
  const breadcrumb = document.getElementById('breadcrumb');
  if(breadcrumb.childNodes.length<2) {
  const li = renderHtml('li',restaurant.name);
  li.setAttribute('aria-current','page');
  breadcrumb.appendChild(li);
  }
  }
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
