require("dotenv").config();

const Typesense = require("typesense");

const BASE_IMAGE_PATH = "https://images.justwatch.com";

module.exports = (async () => {
  const TYPESENSE_CONFIG = {
    nodes: [
      {
        host: process.env.TYPESENSE_HOST,
        port: process.env.TYPESENSE_PORT,
        protocol: process.env.TYPESENSE_PROTOCOL,
      },
    ],
    apiKey: process.env.TYPESENSE_ADMIN_API_KEY,
  };

  console.log("Config: ", TYPESENSE_CONFIG);

  const typesense = new Typesense.Client(TYPESENSE_CONFIG);
  
  /*
  const schema = {
    name: "movies",
    num_documents: 0,
    fields: [
      {
        name: "title",
        type: "string",
        facet: false,
      },
      {
        name: "overview",
        type: "string",
        facet: false,
      },
      {
        name: "genres",
        type: "string[]",
        facet: true,
      },
      {
        name: "genres.lvl0",
        type: "string[]",
        facet: true,
      },
      {
        name: "genres.lvl1",
        type: "string[]",
        facet: true,
        optional: true,
      },
      {
        name: "genres.lvl2",
        type: "string[]",
        facet: true,
        optional: true,
      },
      {
        name: "release_date",
        type: "string",
        facet: true,
      },
      {
        name: "popularity",
        type: "float",
        facet: true,
      },
      {
        name: "vote_average",
        type: "float",
        facet: true,
      },
      {
        name: "image",
        type: "string",
        facet: true,
      },
    ],
    default_sorting_field: "popularity",
  };
  */
  
  
  const schema = {
    name: 'movies',
    //num_documents: 0,
    fields: [
      {name: 'title', type: 'string' },
      {name: 'short_description', type: 'string' },
      {name: 'original_release_year', type: 'int32', facet: true },
      {name: 'rating', type: 'float', optional:true , facet: true },
      {name: 'popularity', type: 'float', optional:true ,facet: true },
      {name: 'genre_ids', type: 'int32[]', optional:true ,facet: true }
    ],
    //default_sorting_field: 'popularity',
  };
  // {name: 'credits', type: 'auto' },  add this later
  // {name: 'scoring', type: 'auto' },  add this later

  const movies = require("./data/justMovies.json");
  console.log(Object.keys(movies).length);

  try {
    const collection = await typesense.collections("movies").retrieve();
    console.log("Found existing collection of movies");
    console.log(JSON.stringify(collection, null, 2));

    if (collection.num_documents !== movies.length) {
      console.log("Collection has different number of documents than data");
      console.log("Deleting collection");
      await typesense.collections("movies").delete();
    }
  } catch (err) {
    console.error(err);
  }

  console.log("Creating schema...");
  console.log(JSON.stringify(schema, null, 2));

  await typesense.collections().create(schema);

  console.log("Populating collection...");
  
  
  movies.forEach(async (movie, idx) => {
    //movie.image = BASE_IMAGE_PATH + movie.poster.replace("{profile}","s592");

    // delete movie.poster_path;
    // delete movie.original_language;
    // delete movie.original_title;
    // delete movie.video;
    // delete movie.backdrop_path;
    // delete movie.vote_count;
    delete movie.id;

    if(movie.full_path){
      delete movie.full_path;
    }

    if(movie.poster_blur_hash){
      delete movie.poster_blur_hash;
    }

    if(movie.full_paths){
      delete movie.full_paths;
    }

    if(movie.backdrops){
      delete movie.backdrops;
    }

    if(movie.object_type){
      delete movie.object_type;
    }

    delete movie.original_title;

    if(movie.offers){
      delete movie.offers;
    }

    if(movie.clips){
      delete movie.clips;
    }

    if(movie.credits){
      delete movie.credits;
    }

    if(movie.external_ids){
      delete movie.external_ids;
    }

    if(movie.runtime){
      delete movie.runtime;
    }

    if(movie.production_countries){
      delete movie.production_countries
    }

    if(movie.localized_release_date){
      delete movie.localized_release_date;
    }

    if(movie.permanent_audiences){
      delete movie.permanent_audiences;
    }

    if(movie.age_certification){
      delete movie.age_certification;
    }
    
  
    if(movie.scoring){
      movies[idx] = {...movie, "popularity": movie.scoring.find( obj => obj.provider_type === "tmdb:popularity").value};
    }

    if(movie.scoring){
      if(movie.scoring.find( obj => obj.provider_type === "imdb:score")){
        movies[idx] = {...movies[idx], "rating": movie.scoring.find( obj => obj.provider_type === "imdb:score").value};
      }
    }

    // else{
    //   movies.splice(idx, 1)
    //   idx--;
    // }

    // movie.scoring.forEach((element)=>{
    //   if(element.provider_type !== "tmdb:popularity"){

    //   }
    // });


    // delete movie.adult;
    // delete movie.genre_ids;

    // movie.genres.forEach((genre, idx) => {
    //   movie[`genres.lvl${idx}`] = [movie.genres.slice(0, idx + 1).join(">")];
    // });

    //[Science Fiction], [Science Fiction > Action], [Science Fiction > Action > Adventure], [Science Fiction > Action > Adventure > Western]
  });

  console.log('movies : '+JSON.stringify(movies,null,2), 'movie count: ',Object.keys(movies).length);
  

  try {
    const returnData = await typesense
      .collections("movies")
      .documents()
      .import(movies);

    console.log("Return data: ", returnData);
  } catch (err) {
    console.error(err);
  }
})();
