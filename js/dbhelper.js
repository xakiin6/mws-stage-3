/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
 static  host(){ return 'http://localhost:1337'};
 static   endPoints() { 
  return {
    RESTAURANTS:0,
    RESTAURANTS_BY_ID:1,
    REVIEWS:3,
    REVIEWS_BY_RESTAURANT:4,
    POST_REVIEWS:5,
    MARK_FAVOURATES:6,
    UNMARK_FAVOURATES:7
  };
}
  static DATABASE_URL(endPoint,parameter) {
    const port = 1337; // Change this to your server port
    let url;
    switch (endPoint) {
      case 0: url= `${DBHelper.host()}/restaurants`;
      break;
      case 1:
      url= `${DBHelper.host()}/restaurants/${parameter}`;
      break;
      case 4:
      url= `${DBHelper.host()}/reviews/?restaurant_id=${parameter}`;
      break;
      case 5:
      url= `${DBHelper.host()}/reviews/`;
      break;
      case 6:
      url= `${DBHelper.host()}/restaurants/${parameter}/?is_favorite=true`;
      break;
      case 7:
      url= `${DBHelper.host()}/restaurants/${parameter}/?is_favorite=false`;
      break;
      default:
      url= DBHelper.host();
    }
    return url;
    
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id) {
   return fetch(DBHelper.DATABASE_URL(DBHelper.endPoints().RESTAURANTS_BY_ID,id))
      .then(function (response) {
        if(response.ok) {
        return response.json();
        } else {
          return [{}];
        }
      });
}

static markAsFavorite(restaurant) {
  var mark =(restaurant.is_favorite ==='true'?this.endPoints().MARK_FAVOURATES:this.endPoints().UNMARK_FAVOURATES);
  console.log(mark);
  return fetch(DBHelper.DATABASE_URL(mark,restaurant.id),{method:'PUT',body:restaurant})
     .then(function (response) {
       if(response.ok) {
       return response.json();
       } else {
         return [{}];
       }
     });
    }
static postReviews(review) {
  return fetch(DBHelper.DATABASE_URL(this.endPoints().POST_REVIEWS,null),{method:'post',body:review})
     .then(function (response) {
       if(response.ok) {
       return response.json();
       } else {
         return [{}];
       }
     });
    }

    static fetchReviewsByRestaurant(id) {
     return fetch(DBHelper.DATABASE_URL(DBHelper.endPoints().REVIEWS_BY_RESTAURANT,id))
        .then(function (response) {
          if(response.ok) {
          return response.json();
          } else {
            return [{}];
          }
        });
  }
  
  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }
  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph ? restaurant.photograph : '10'}.jpg`);
    //return `icon icon-${restaurant.photograph ? restaurant.photograph : '10'}`
  }
  static imageUrlsForSrcSet(photograph) {
    var image = `${photograph ? photograph : '10'}`;
    const imageExtention = "jpg";
    return (`/img/${image}.${imageExtention} 400w, /img/${image + '-650.' + imageExtention} 600w`);
  }
  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    try {
      if (google) {
        const marker = new google.maps.Marker({
          position: restaurant.latlng,
          title: restaurant.name + ' Restaurant',
          url: DBHelper.urlForRestaurant(restaurant),
          map: map,
          animation: google.maps.Animation.DROP
        });
        return marker;
      }
    } catch (e) { }
  }
}
/**
 * Register ServerWoker 
 */

  window.addEventListener('load', function () {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-min.js',{scope:'/'}).then(function (reg) {
        // Registration wa
      }, function (err) {
        // registration failed :(
      });
    }
    //Add title attribute to the map iframe.
    var iframe = document.querySelector('iframe');
    if (iframe) {
      iframe.setAttribute('title', 'Google Maps');
    }

window.addEventListener('online',(event)=>{
  event.preventDefault();
  displayToast(event.type);
});
window.addEventListener('offline',(event)=>{
  event.preventDefault();
  displayToast(event.type);
});   

function displayToast(type) {
  var message ='<span>Unable to connect. Retrying…</span>',isVisible ='none';
  if(type==='online') {
    isVisible ='none';
  } else {
    isVisible ='block';
  }
  var toast = document.querySelector('#toast');
  toast.innerHTML = message;
  toast.style.display =isVisible;
}
  });
