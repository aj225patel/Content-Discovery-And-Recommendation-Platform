let client = new Typesense.Client({
  'nodes': [{
    'host': 'localhost',
    'port': '8108',
    'protocol': 'http',
  }],
  'apiKey': 'Vj4arfNZhnzAyozksYNB5g7hqe8xym3s',
  'connectionTimeoutSeconds': 2
})
// This api key provided here is having access for only search operation 

console.log(search_text);

let searchParameters = {
  'q'         : search_text,
  'query_by'  : 'title',
  // remove this sort by after adding default sort field in typesense schema
  'sort_by'   : 'popularity:desc,rating:desc,original_release_year:desc',
  'per_page'  :  16
}

client.collections("movies")
    .documents()
    .search(searchParameters)
    .then(function(searchResults){
      for (var i = 0; i < searchResults.found && i <= 15; i++) {
         
         if(searchResults.hits[i].document.poster){
           var poster_url = 'https://images.justwatch.com' + searchResults.hits[i].document.poster.replace("{profile}","s592");
         }
         else{
           var poster_url = 'ui/images/default_poster.jpg';
         }
         
         if(searchResults.hits[i].document.scoring){
          if(searchResults.hits[i].document.scoring.find( obj => obj.provider_type === "imdb:score")){
            var imdb_score = searchResults.hits[i].document.scoring.find( obj => obj.provider_type === "imdb:score").value;
          }
          else{
            var imdb_score = "---";
          }
         }else{
          var imdb_score = "---";
         }

         $("#movieCard")
         .append(
           `<div class="movie-item-style-2 movie-item-style-1">
                <img src=${poster_url} onerror="this.src='ui/images/default_poster.jpg'" alt="image not found">
                <div class="hvr-inner">
                  <a  href="/movies/${searchResults.hits[i].document.jw_entity_id}"> Read more <i class="ion-android-arrow-dropright"></i> </a>
                </div>
                <div class="mv-item-infor">
                  <h6><a href="/movies/${searchResults.hits[i].document.jw_entity_id}"> ${searchResults.hits[i].document.title} </a></h6>
                  <p class="rate"><i class="ion-android-star"></i><span> ${imdb_score} </span> /10</p>
                </div>
            </div>`);
      }

      $("#found").append(`<span id="found-span">${searchResults.found} movies</span>`);

      // selecting required element
      let totalPages = Math.ceil(searchResults.found/16);
      let page = searchResults.page || 1;

      //calling function with passing parameters and adding inside element which is ul tag
      element.innerHTML = createPagination(totalPages, page);
         
    });


const element = document.querySelector(".pagination2 ul");

function createPagination(totalPages, page){
  console.log(totalPages, page);
  let liTag = '';
  let active;
  let beforePage = page - 1;
  let afterPage = page + 1;
  if(page > 1){ //show the next button if the page value is greater than 1
    liTag += `<button id="prev" class="btn prev" onclick="searchMovie(${page - 1})" value="${page - 1}"><i class="ion-arrow-left-b"></i></button>`;
  }
    
  if(page > 2){ //if page value is less than 2 then add 1 after the previous button
    liTag += `<button id="1" onclick="searchMovie(1)" value="1">1</button>`;
    if(page > 3){ //if page value is greater than 3 then add this (...) after the first li or page
      liTag += `<button class="dots">...</button>`;
    }
  }
    
  // how many pages or li show before the current li
  if (page == totalPages && ((beforePage - 2)>0)) {
    beforePage = beforePage - 2;
  } else if (page == totalPages - 1 && ((beforePage - 2)>0)) {
    beforePage = beforePage - 1;
  }
  // how many pages or li show after the current li
  if (page == 1 && totalPages > 4) {
    afterPage = afterPage + 2;
  } else if (page == 2 && totalPages > 4) {
    afterPage  = afterPage + 1;
  }
    
  for (var plength = beforePage, n = 1; plength <= afterPage; plength++, n++) {
    if (plength > totalPages) { //if plength is greater than totalPage length then continue
      continue;
    }
    if (plength == 0) { //if plength is 0 than add +1 in plength value
      plength = plength + 1;
    }
    if(page == plength){ //if page is equal to plength than assign active string in the active variable
      active = "active";
    }else{ //else leave empty to the active variable
      active = "";
    }
    liTag += `<button onclick="searchMovie(${plength})" id="middle${n}" class=${active} value="${plength}">${plength}</button>`;
  }
    
  if(page < totalPages - 1){ //if page value is less than totalPage value by -1 then show the last li or page
    if(page < totalPages - 2){ //if page value is less than totalPage value by -2 then add this (...) before the last li or page
      liTag += `<button class="dots">...</button>`;
    }
    liTag += `<button id="last" onclick="searchMovie(${totalPages})" id="middle${n}" value="${totalPages}">${totalPages}</button>`;
  }
    
  if (page < totalPages) { //show the next button if the page value is less than totalPage(20)
    liTag += `<button id="next" class="btn next" onclick="searchMovie(${page + 1})" value="${page + 1}"><i class="ion-arrow-right-b"></i></button>`;
  }
  element.innerHTML = liTag; //add li tag inside ul tag
  return liTag; //reurn the li tag
}


// Event Handlers
const form = document.getElementById('search-form');
form.addEventListener('submit', async function(event){
  event.preventDefault();
  searchMovie('1');
});

/*
const first = document.getElementById('1');
first.addEventListener('click', async function(event){
  event.preventDefault();
  searchMovie(document.getElementById('1').value);
});

const mid1 = document.getElementById('middle1');
mid1.addEventListener('click', async function(event){
  event.preventDefault();
  console.log("Hello");
  searchMovie(document.getElementById('middle1').value);
});

const mid2 = document.getElementById('middle2');
mid2.addEventListener('click', async function(event){
  event.preventDefault();
  searchMovie(document.getElementById('middle2').value);
});

const mid3 = document.getElementById('middle3');
mid3.addEventListener('click', async function(event){
  event.preventDefault();
  searchMovie(document.getElementById('middle3').value);
});

const last = document.getElementById('last');
last.addEventListener('click', async function(event){
  event.preventDefault();
  searchMovie(document.getElementById('last').value);
});

const next = document.getElementById('next');
next.addEventListener('click', async function(event){
  event.preventDefault();
  searchMovie(document.getElementById('next').value);
});

const prev = document.getElementById('prev');
prev.addEventListener('click', async function(event){
  event.preventDefault();
  searchMovie(document.getElementById('prev').value);
});
*/


async function searchMovie(page) {
    
    if(document.getElementById("search").value !== ""){
      var search_text = document.getElementById("search").value;
    }
    else{
      var search_text = "*";
    }
    //console.log(document.getElementById('search').value);
    
    const moviePerPage = document.getElementById("movies-per-page").value;
    const from = document.getElementById('from').value;
    const to = document.getElementById('to').value;
    var Filter = `original_release_year:[${from}..${to}]`;
    
    
    if(document.getElementsByClassName("ui label transition visible").length !== 0){
      let genreElements = document.getElementsByClassName("ui label transition visible");
      let genres = [];
      for(let i=0; i < genreElements.length; i++){
        genres.push(parseInt(genreElements.item(i).attributes[1].value));
      }
      Filter = `${Filter} && genre_ids:=${JSON.stringify(genres)}`;
    }

    if( document.getElementById('input-slider').value !== "0"){
      Filter = `${Filter} && rating:>${document.getElementById('input-slider').value}`
    }
    //console.log(`rating = `, typeof document.getElementById("input-slider").value);
    console.log(Filter);
   
    const sorting = document.getElementById('sorting').value;

    $("#movieCard").empty();
    
    await fetch('/search', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				search_text,
        page,
        moviePerPage,
        Filter,
        sorting
			})
		}).then((res) => res.json())
		.then((data) => {
      console.log(data);
      
      if(data.found === 0){
        $("#movieCard").append(`<h4> Sorry, Couldn't find the results for , </h4><br>
                                <h3>${search_text}</h3>`);
      }
      else{
        
        for (var i = 0; i < data.hits.length; i++) {
          //if(searchResults.hits[i].document.scoring){
           //let poster_url = 'https://images.justwatch.com' + searchResults.hits[i].document.poster.replace("{profile}","s592");
           //let imdb_score = searchResults.hits[i].document.scoring.find( obj => obj.provider_type === "imdb:score").value;
           
           if(data.hits[i].document.poster){
             var poster_url = 'https://images.justwatch.com' + data.hits[i].document.poster.replace("{profile}","s592");
           }
           else{
             var poster_url = 'ui/images/default_poster.jpg'
           }
           
           if(data.hits[i].document.scoring){
             if(data.hits[i].document.scoring.find( obj => obj.provider_type === "imdb:score")){
                var imdb_score = data.hits[i].document.scoring.find( obj => obj.provider_type === "imdb:score").value;
             }
             else{
                var imdb_score = "---";
             }
           }
           else{
                var imdb_score = "---";
           }

           $("#movieCard")
           .append(
             `<div class="movie-item-style-2 movie-item-style-1">
                  <img src=${poster_url} onerror="this.src='ui/images/default_poster.jpg'" alt="image not found">
                  <div class="hvr-inner">
                    <a  href="/movies/${data.hits[i].document.jw_entity_id}"> Read more <i class="ion-android-arrow-dropright"></i> </a>
                  </div>
                  <div class="mv-item-infor">
                    <h6><a href="/movies/${data.hits[i].document.jw_entity_id}"> ${data.hits[i].document.title} </a></h6>
                    <p class="rate"><i class="ion-android-star"></i><span> ${imdb_score} </span> /10</p>
                  </div>
              </div>`);
        }

        $("#found-span").remove();
        $("#found").append(`<span id="found-span">${data.found} movies</span>`);
        
        
        $("#pagination2 ul").empty();
        // selecting required element
        let totalPages = Math.ceil(data.found/moviePerPage);
        let page = data.page || 1;

        //calling function with passing parameters and adding inside element which is ul tag
        element.innerHTML = createPagination(totalPages, page);

      }
    })
    .catch(e =>{
      console.log(e);
		});
}
    // let searchParameters = {
    //     'q'         : search_text,
    //     'query_by'  : 'title,short_description',
    //     'query_by_weights' : '4,2',
    //     'per_page'  :  16
        
    // }
    // Add sort_by param later after getting right json data for imdb rating

    /*
    client.collections("movies")
        .documents()
        .search(searchParameters)
        .then(function (searchResults) {
          
          if(searchResults.found === 0){
            $("#movieCard").append(`<h4> Sorry, Couldn't find the results for , </h4><br>
                                    <h3>${search_text}</h3>`);
          }
          else{
            
            for (var i = 0; i < searchResults.found && i <= 15; i++) {
              //if(searchResults.hits[i].document.scoring){
               //let poster_url = 'https://images.justwatch.com' + searchResults.hits[i].document.poster.replace("{profile}","s592");
               //let imdb_score = searchResults.hits[i].document.scoring.find( obj => obj.provider_type === "imdb:score").value;
               
               if(searchResults.hits[i].document.poster){
                 var poster_url = 'https://images.justwatch.com' + searchResults.hits[i].document.poster.replace("{profile}","s592");
               }
               else{
                 var poster_url = 'https://www.reelviews.net/resources/img/default_poster.jpg'
               }

               if(searchResults.hits[i].document.scoring.find( obj => obj.provider_type === "imdb:score")){
                 var imdb_score = searchResults.hits[i].document.scoring.find( obj => obj.provider_type === "imdb:score").value;
               }
               else{
                 var imdb_score = "---"
               }

               $("#movieCard")
               .append(
                 `<div class="movie-item-style-2 movie-item-style-1">
                      <img src=${poster_url} alt="image not found">
                      <div class="hvr-inner">
                        <a  href="moviesingle.html"> Read more <i class="ion-android-arrow-dropright"></i> </a>
                      </div>
                      <div class="mv-item-infor">
                        <h6><a href="#"> ${searchResults.hits[i].document.title} </a></h6>
                        <p class="rate"><i class="ion-android-star"></i><span> ${imdb_score} </span> /10</p>
                      </div>
                  </div>`);
               }
               
              //  else{
              //   //let poster_url = 'https://images.justwatch.com' + searchResults.hits[i].document.poster.replace("{profile}","s592");
              //   $("#movieCard")
              //   .append(
              //     `<div class="movie-item-style-2 movie-item-style-1">
              //          <img src=${poster_url} alt="image not found">
              //          <div class="hvr-inner">
              //            <a  href="moviesingle.html"> Read more <i class="ion-android-arrow-dropright"></i> </a>
              //          </div>
              //          <div class="mv-item-infor">
              //            <h6><a href="#"> ${searchResults.hits[i].document.title} </a></h6>
              //          </div>
              //      </div>`);

              //   }
            
          }
        });
        */





// Adding Movie Card html element

/*

<div class="flex-wrap-movielist mv-grid-fw">
  <div class="movie-item-style-2 movie-item-style-1">
	  <img src="images/uploads/mv1.jpg" alt="">
		  <div class="hvr-inner">
	      <a  href="moviesingle.html"> Read more <i class="ion-android-arrow-dropright"></i> </a>
	    </div>
			<div class="mv-item-infor">
			  <h6><a href="#">oblivion</a></h6>
				<p class="rate"><i class="ion-android-star"></i><span>8.1</span> /10</p>
	    </div>
  </div>
</div>

*/






// let searchParameters = {
//     'q'         : 'harry potter',
//     'query_by'  : 'title',
//     'sort_by'   : 'ratings_count:desc'
//   }
  
// client.collections('books')
//     .documents()
//     .search(searchParameters)
//     .then(function (searchResults) {
//       console.log(searchResults)
// })
  