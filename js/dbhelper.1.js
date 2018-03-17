/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static DATABASE_URL(byid) {
    const port = 1337; // Change this to your server port
    if (byid === null) {
      // Get all restaurant data
      return `http://localhost:${port}/restaurants`;
    }
    else {
      // Get restaurant by id
      return `http://localhost:${port}/restaurants/${byid}`;
    }
  }
  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {

    fetch(DBHelper.DATABASE_URL(null))
      .then(function (response) {
        if(response.ok) {
        return response.json();
        } else {
          return [{}];
        }
      })
      .then(function (response) {
        callback(null, response);
      }
      ).catch(function (e) {
        const error = (`Request failed. Returned status of ${e.status}`);
        callback(error, null);
      });

  }
  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    fetch(DBHelper.DATABASE_URL(id))
      .then(function (response) {
        if(response.ok) {
        return response.json();
        } else {
          return [{}];
        }
      })
      .then(function (response) {
        if (response) { // Got the restaurant
          callback(null, response);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
      ).catch(function (e) {
        const error = (`Request failed. Returned status of ${e.status}`);
        callback(error, null);
      });
  }
  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling

    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants

    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }
  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }
  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
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
  }
  static imageUrlsForSrcSet(photograph) {
    var image = `${photograph ? photograph : '10'}`;
    const imageExtention = "jpg";
    return (`/img/${image}.${imageExtention} 400w, /img/${image + '-650.' + imageExtention} 600w, /img/${image + '-800.' + imageExtention} 900w`);
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
        }
        );
        return marker;
      }
    } catch (e) { }
  }
}
/**
 * Register ServerWoker 
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw-min.js').then(function (registration) {
      // Registration was successful
    }, function (err) {
      // registration failed :(
    });
    //Add title attribute to the map iframe.
    var iframe = document.querySelector('iframe');
    if (iframe) {
      iframe.setAttribute('title', 'Google Maps');
    }
  });
}
