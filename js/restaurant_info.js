let restaurant;
let reviews;
var map;
var modalOverlay; 
var modal; 
let focusedElementBeforeModal= document.activeElement;
const focusableElementsString = 'input:not([disabled]), textarea:not([disabled]), button:not([disabled])';
// Generate restaurant info 
 function initHtml() {
  fetchRestaurantFromURL();
  modalOverlay =document.querySelector('.modal-overlay');
  modal= document.querySelector('.modal');
  
};

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL().then(function(restaurant){
   console.log('test: '+restaurant);
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    });
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

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
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
    console.log(response);
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
    return;
  }
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}
/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');

  const name = renderHtml('p',review.name);
  name.setAttribute('class','reviews-list-title');
  li.appendChild(name);

  const date = renderHtml('p',review.createdAt);
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
const reviewer_name = renderForm('input','name','text');
const reviewer_name_Id = renderHtml('label','Name:');
const rating = renderForm('input','rating','number');
rating.min='1'; rating.max='10';
const rating_Id = renderHtml('label','Rating:');
const comment_text = renderForm('textarea','comments');
const comment_Id = renderHtml('label','Comment:');
const add_comment = renderForm('button','Add_Comment','button');
add_comment.innerHTML ='Add Review';
add_comment.addEventListener('click', addReview);
addChildsToElement(reviewForm,[reviewer_name_Id,reviewer_name,rating_Id,rating,comment_Id,comment_text,add_comment]);
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
    "comments": formInputs[2].value
};

  if(checkEmptyFields(formInputs)) {
    DBHelper.postReviews(JSON.stringify(review)).then(function (result){
    console.log(result);
    self.reviews.push(result);
    fillReviewsHTML();
  });
  closeModal();
} 
}

checkEmptyFields=(formInputs)=>{
  return true;
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
  console.log('breadcrumb :'+restaurant);
  if(restaurant) {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = renderHtml('li',restaurant.name);
  li.setAttribute('aria-current','page');
  breadcrumb.appendChild(li);
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
