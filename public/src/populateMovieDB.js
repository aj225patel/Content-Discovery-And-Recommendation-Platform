require('dotenv').config();

var mysql = require('mysql2');
var db = mysql.createConnection({
  host: '127.0.0.1', 
  user: 'root',      
  password: process.env.DB_VOLT,      
  database: process.env.database 
}); 
 
db.connect(function(err) {
  if (err) throw err;
  console.log('Database is connected successfully!!');
});


db.query(`SELECT COUNT(*) FROM movie`,( err, result) => {
  if(err){
    console.log(err);
  }
  else{
    console.log(result);
    if(result !== 0){
      db.query(`truncate table movie`, e => {
        if(e){
          console.log(e);
        }
        else{
          console.log('table all rows have truncated now!!');
        }
      });
    }
  }
});


const movies = require("./data/justMovies.json")
console.log(Object.keys(movies).length);
// movies[0].credits = movies[0].credits.map( obj => {
//     if ( obj.person_id === 2062){
//         return {...obj, character_name: "Leia''s Rebel Escort (uncredited)"}
//     }
//     return obj;
// });

// movies[0].credits = movies[0].credits.map( obj => {
//     if ( obj.person_id === 2100){
//         return {...obj, character_name: "Sai''torr Kal Fas (uncredited)"}
//     }
//     return obj;
// });

let credit = [];

//let close;


//movies.forEach(async (movie,id) => {
for( let i = 0; i < Object.keys(movies).length; i++){
  credit = [];
  //close = false;

  if(movies[i].credits){
    movies[i].credits.forEach((element,n) => {
      if(element.role === "ACTOR" || element.role === "DIRECTOR" || element.role === "WRITER" ){
      
        if(element.character_name){
          element.character_name = element.character_name.replace(/'/g,"''").replace(/"/g,"").replace(/\t/,"  ");
          element.name = element.name.replace(/'/g,"''").replace(/"/g,"").replace(/\t/,"  ");
          credit.push(element);
          //console.log(element);
        }
        else{
          element.name = element.name.replace(/'/g,"''").replace(/"/g,"").replace(/\t/,"  ");
          credit.push(element);
        }
      }
    });
  }

  if(movies[i].clips){
    movies[i].clips.forEach((element) => {
      element.name = element.name.replace(/'/g,"''").replace(/"/g,"").replace(/\t/,"  ");
    });
  }

  if(movies[i].short_description){
    movies[i].short_description = movies[i].short_description.replace(/'/g,"''").replace(/"/g,"").replace(/\t/,"  ");
  }
  
  
  //console.log(JSON.stringify(credit,undefined,4));
  
  //console.log(JSON.stringify(credit));
  
  //console.log(credit.find( obj => obj.person_id === 1680));
  if(movies[i].localized_release_date){
    var localReleaseDate = movies[i].localized_release_date.slice(0,10)
  }
  else{
    var localReleaseDate = '9999-12-31'
  }
  let ageCertification = movies[i].age_certification || '';
  let posterUrls = movies[i].poster || '';
  let Description = movies[i].short_description || '';
  let Runtime = movies[i].runtime || 'NULL';
  let Credits = JSON.stringify(credit);
  let Genres = JSON.stringify(movies[i].genre_ids) || '[]';
  let Clips = JSON.stringify(movies[i].clips) || '[]';
  
  db.query(`INSERT INTO movie (title, slug, poster_urls, description, release_year, original_title, local_release_date, age_certification, runtime, credits, genres, clips) VALUES ('${movies[i].title.replace(/'/g,"''")}', '${movies[i].jw_entity_id}', '${posterUrls}', '${Description}', ${movies[i].original_release_year}, '${movies[i].original_title.replace(/'/g,"''")}', '${localReleaseDate}', '${ageCertification}', ${Runtime}, '${Credits}', '${Genres}', '${Clips}')`, (err)=>{
    if(err){
      console.log(`Error occured in Row: ${i}`);
      console.log(err);
      //return true;
    }
    else{
      console.log(`Row: ${i+1} inserted successfully!!`);
      //return false;
    }
  });
}
