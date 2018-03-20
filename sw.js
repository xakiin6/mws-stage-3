importScripts('idb-min.js');
//Data server hostname
const dataHost = 'localhost:1337';
const pathNames = ['restaurants', 'reviews','pending_reviews'];
// Static cache files
var CACHE_NAME = 'mws-restaurant-cache-v22';
var urlsToCache = [
  '/', '/index.html',
  '/favicon.ico',
  '/restaurant.html',
  '/css/styles.css','/css/restaurant.css',
  '/js/worker-min.js',
  '/js/index-min.js',
  '/js/restaurant-min.js'
];
self.addEventListener('install', function (event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        // Add Urls to cache
        cache.addAll(urlsToCache.map(function (urlToPrefetch) {
          return new Request(urlToPrefetch, { mode: 'no-cors' });
        })).then(function () {
          console.log('All resources have been fetched and cached.');
        }).catch(function () {
          console.log('Faild to cache resource');
        });
      })
  )
});
var lastdate = new Date(new Date(Date.now()).getTime() + (60*1000));
self.addEventListener('fetch', function (event) {
  // Start Caching Data
  const url = new URL(event.request.url);

  const param = url.pathname.split('/');
  if (url.host === dataHost) {
    processPendingReviews();
    const dataRequest = event.request.clone();
    return event.respondWith(fetch(dataRequest).then(function (dataRes) {
      if (dataRes) {
        var res = dataRes.clone();
        if (url.pathname.indexOf(pathNames[0]) === 1) {
          CacheRestaurants(res.json(), pathNames[0]);
        } else if (url.pathname.indexOf(pathNames[1]) === 1) {
          CacheRestaurants(res.json(), pathNames[1]);
        }
        return dataRes;
      }
    }).catch(function (error) {
      console.log(`Could not find url :${url} from the network`);
      if (event.request.method === 'POST') {
        event.request.clone().text().then((body)=>{
          CacheRestaurants(Promise.resolve(JSON.parse(body)), pathNames[2]);
        })
        
        
      }
      return getRestaurantData(param, url.pathname, url.search);
    }));
    return;
  }
  //End of Caching Data
  if (url.origin === location.origin) {
    return event.respondWith(
      caches.match(event.request)
        .then(function (response) {
          // Cache hit - return response
          if (response) {
            return response;
          }
          // IMPORTANT: Clone the request.
          var fetchRequest = event.request.clone();
          return fetch(fetchRequest).then(
            function (response) {
              // Check if we received a valid response
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              // IMPORTANT: Clone the response. A response is a stream;
              var responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(function (cache) {
                  cache.put(event.request, responseToCache);
                });
              return response;
            }
          ).catch(function (error) { console.log(`error : ${url}`); return new Response('error'); })
        }).catch(function (error) { console.log(`error : ${url}`); return new Response('error'); })
    );
  }
});
self.addEventListener('activate', function (event) {
  // Create IDB
  createDB();
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheNames.indexOf(CACHE_NAME) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
function getRestaurantData(param, pathname, search) {
  
  if (pathname.indexOf(pathNames[0]) === 1) {
    if (param && param.length > 2) {
      const id = param[2];
      return fetchRestaurantsFromIDBPerId(id).then(function (res) {
        return new Response(JSON.stringify(res), {
          headers: { 'Content-Type': 'application/json' }
        });
      });
    }
    else {
      return fetchRestaurantsFromIDB().then(function (res) {
        return new Response(JSON.stringify(res), {
          headers: { 'Content-Type': 'application/json' }
        });
      });
    }
  } else if (pathname.indexOf(pathNames[1]) === 1) {
    var id = search.split('=');
    
    if (id) {
      return fetchReviewsFromIDB(id[1]).then(function (res) {
        return new Response(JSON.stringify(res), {
          headers: { 'Content-Type': 'application/json' }
        });
      });
    }
  }
}

/**
 *  Starting IndexedDb Functions 
 */
function openDatabase() {
  // If the browser doesn't support service worker,
  // we don't care about having a database
  if (!navigator.serviceWorker && !idb) {
    return Promise.resolve();
  }
  return idb.open('restaurant', 1);
}
function CacheRestaurants(data, type) {
  WriteToIDB(data, type);
  lastdate = new Date(new Date(Date.now()).getTime() + (60*1000));
}
function createDB() {
  idb.open('restaurant', 1, function (upgradeDb) {
    var restaurants = upgradeDb.createObjectStore('restaurants', {
      keyPath: 'id'
    });
    var reviews = upgradeDb.createObjectStore('reviews', {
      keyPath: 'id'
    });
    var pending_reviews = upgradeDb.createObjectStore('pending_reviews', {
      keyPath:'id', autoIncrement:true 
    });
    restaurants.createIndex('id', 'id');
    reviews.createIndex('restaurant_id', 'restaurant_id');

  });
}
function WriteToIDB(data, type) {
  data.then(function (response) {
    const dbpromise = self.openDatabase();
    if (!dbpromise)
      return;
    dbpromise.then(db => {
      const tx = db.transaction(type, 'readwrite');
      try {
        if (response && response.length > 0) {
          response.forEach(value => {
            tx.objectStore(type).put(value);
          });
        } else {
          tx.objectStore(type).put(response);
        }
      } catch (e) {
      
      }
      return tx.complete;
    });
  });
}
function fetchRestaurantsFromIDB() {
  const dbpromise = self.openDatabase();
  if (!dbpromise)
    return;
  return dbpromise.then(db => {
    return db.transaction('restaurants')
      .objectStore('restaurants').getAll();
  }).then(function (response) {
    return response;
  });
}
function fetchRestaurantsFromIDBPerId(id) {
  const dbpromise = self.openDatabase();
  if (!dbpromise)
    return;
  return dbpromise.then(db => {
    return db.transaction('restaurants')
      .objectStore('restaurants').get(parseInt(id));
  }).then(function (response) {
    return response;
  });
}

function submitPendingReviews(reviews){
  if(navigator.onLine && reviews.length > 0) {
    
    reviews.forEach(function(review) {
    
      fetch(`http://${dataHost}/reviews/`, {
            method: 'POST',
            body: JSON.stringify(review)
        }).then(clearPendingReviews())
    });
    
}
}
function clearPendingReviews() {
  const dbpromise = self.openDatabase();
  if (!dbpromise)
    return;
    return dbpromise.then(db => {
      return db.transaction(pathNames[2],'readwrite')
        .objectStore(pathNames[2]).clear();
    }); 
}

function processPendingReviews() {
  if(navigator.onLine){
  const dbpromise = self.openDatabase();
  if (!dbpromise)
    return;
  return dbpromise.then(db => {
    return db.transaction(pathNames[2])
      .objectStore(pathNames[2]).getAll();
  }).then(function (response) {
    
    submitPendingReviews(response);
  });
}
}
function fetchReviewsFromIDB(id) {
  const dbpromise = self.openDatabase();
  if (!dbpromise)
    return;
  return dbpromise.then(db => {
    return db.transaction('reviews')
      .objectStore('reviews').getAll();
  }).then(function (response) {
    return response.filter(r=> r.restaurant_id==parseInt(id));
  }).catch(error=> console.log(error));
}