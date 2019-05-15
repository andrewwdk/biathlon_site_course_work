var express = require('express');
var router = express.Router();
var database = require('./database');
var file = require('./files');
var fs = require("fs");
var p = require('pdfreader');
var deasync = require('deasync');

let isAuthorized = false;
let isAdmin = false;
let name = 'User';
let notSamePassword = false;
let loginAlreadyExists = false;
let notCorrectPasswordOrLogin = false;
let notEnoughData = false;
let raceAlreadyExists = false;
let placeAlreadyExists = false;
let biathletDoesNotExist = false;
let biathlet = {};
let biathletIsFound = false;
let races = [];
let seasons = [];
let biathlets = [];

/* GET home page. */
router.get('/', function(req, res, next) {
  let html = file.readHtml('./views/history.hbs');
  res.render('index', { body: html({name}), isAdmin, isAuthorized });
});

router.get('/main', function(req, res, next) {
  res.redirect('/');
});

router.get('/registration', function(req, res) {
  let html = file.readHtml('./views/registration.hbs');
  res.render('index', { body: html({notSamePassword, loginAlreadyExists, notEnoughData}), isAdmin, isAuthorized});
  notSamePassword = false;
  loginAlreadyExists =false;
  notEnoughData = false;
});

router.post('/registrationSubmit', function(req, res){
  if(req.body.password != '' && req.body.repeatedPassword != '' && req.body.login != ''){
    if(req.body.password == req.body.repeatedPassword){
     if(!database.ifLoginExists(req.body.login)){
       isAuthorized = true;
       name = req.body.login;
       database.insertUser(req.body.login, req.body.password);
       res.redirect('/');
      }else{
       loginAlreadyExists= true;
       res.redirect('/registration');
      }
    }else{
      notSamePassword = true;
      res.redirect('/registration');
    }
  }else{
    notEnoughData = true;
    res.redirect('/registration');
  }
});

router.get('/logout',function(req, res){
  name = 'User';
  isAuthorized = false;
  isAdmin = false;
  res.redirect('/');
});

router.get('/authorization', function(req, res) {
  let html = file.readHtml('./views/authorization.hbs');
  res.render('index', { body: html({notCorrectPasswordOrLogin}), isAdmin, isAuthorized});
  notCorrectPasswordOrLogin = false;
});

router.post('/authorizationSubmit', function(req, res){
  if(database.ifLoginAndPasswordCorrect(req.body.login, req.body.password)){
    isAuthorized = true;
    name = req.body.login;
    if(name == 'Admin'){
      isAdmin = true;
    }
    res.redirect('/');
  }else{
    notCorrectPasswordOrLogin = true;
    res.redirect('/authorization');
  }
});

router.get('/parseFile', function(req, res) {
  let html = file.readHtml('./views/parseFile.hbs');
  res.render('index', { body: html({raceAlreadyExists}), isAdmin, isAuthorized});
  raceAlreadyExists = false;
});

router.post('/parseFileSubmit', function(req, res){
var result = '';
var done = false;
var pdfBuffer = fs.readFileSync('/home/andrew/Documents/biathlon_results/' + req.body.fileToParse);
var items = [];

new p.PdfReader().parseBuffer(pdfBuffer, function(err, item) {
  if (item != undefined){
    items.push(item);
    result += ' ';
    result += item.text;
    result += ' ';
  }else{
    done = true;
  }
});
 
while(!done)
    {
         deasync.runLoopOnce();
    }

  parseString(result, items);
  res.redirect('/parseFile');
});

function parseString(text, items){
 var firstindex = text.indexOf('FINAL RESULTS');
 var lastindex = text.indexOf('SPORTS CENTRE');
 var raceName = text.substring(firstindex + 15, lastindex - 2);
 var raceNameId = database.getRaceTypeIdByName(raceName);

 firstindex = text.indexOf('START TIME');
 var year = parseInt(text.substring(firstindex - 6, firstindex - 2), 10);
 var month = text.substring(firstindex - 10, firstindex - 7);
 if(month != 'DEC' && month != 'NOV'){
   year--;
 }
 var seasonId = database.getSeasonIdByYear(year);

 firstindex = text.indexOf('World Cup') + 11;
 lastindex = firstindex;
 while(text[lastindex+1] != ' '){
   lastindex++;
 }
 lastindex++;
 var place = text.substring(firstindex, lastindex);
 var placeId = database.getPlaceIdByName(place);

 var shootingCount = 1;
 var sex;
 var array = [1, 2, 5, 6, 7, 8];
 if (array.indexOf(raceNameId) != -1){
   shootingCount = shootingCount + 3;
 }
 array = [1, 3, 5, 7];
 if(array.indexOf(raceNameId) != -1){
   sex = 'woman';
 }else{
   sex = 'man';
 }
 
 if(!database.ifRaceExists(raceNameId, seasonId, placeId)){
  database.insertRace(raceNameId, seasonId, placeId);
  var race_id = database.getRaceId(raceNameId, seasonId, placeId);
  var biathlets = makeList(items, shootingCount);
  var biathlet_id;
  biathlets.forEach(biathlet => {
    if(!database.ifBiathletExists(biathlet.name, biathlet.surname)){
      var country_id = database.getCountryIdByName(biathlet.country);
      database.insertBiathlet(biathlet.name, biathlet.surname, sex, country_id);
    }
    biathlet_id = database.getBiathletIdByNameAndSurname(biathlet.name, biathlet.surname);
    database.insertBiathletInRace(parseInt(biathlet.bib, 10), parseInt(biathlet.rank, 10), 
      parseInt(biathlet.total, 10), biathlet.time, biathlet.behind, race_id, biathlet_id);
  });
 } else{
   raceAlreadyExists = true;
 }
}

function makeList(items, shootingCount){
  var biathlets = [];
  var index = 0;
  items.forEach(item =>{
    if(isCountry(item.text)){
    if(!isNaN(items[index - 2].text) && !isNaN(items[index - 3].text)){
      var words = items[index-1].text.split(" ");
      if(words.length == 2){
      var s = items[index-1].text.substring(0, items[index-1].text.lastIndexOf(' '));
      var n = items[index-1].text.substring(items[index-1].text.lastIndexOf(' ') + 1, items[index-1].text.length);
      }else{
        s = words[0];
        n = words[2];
        if(words[1][1] == words[1][1].toUpperCase()){
          s = s + ' ' + words[1];
        }else{
          n = n + ' ' + words[1];
        }
      }
      if(s.indexOf('\'') != -1){
        s = s.substring(0, s.indexOf('\'')) + s.substring(s.indexOf('\'') + 1, s.length);
      }
      biathlets.push({bib: items[index - 2].text, rank: items[index - 3].text,
      name: n, surname: s, country: item.text, total: items[index + shootingCount + 1].text,
      time: items[index + shootingCount + 3].text, behind: items[index + shootingCount + 4].text});
    }
    }
    index++;
  });
  return biathlets;
}

function isCountry(value){
  var array = ['RUS', 'NOR', 'GER', 'FRA', 'UKR', 'FRA', 'CZE', 'SUI', 'SWE', 'ITA', 'CAN', 'BLR',
    'USA', 'BUL', 'CHN', 'FIN', 'EST', 'POL', 'BEL', 'ROU', 'KAZ', 'LAT', 'SRB', 'LTU', 'SVK', 'KOR',
    'JPN', 'HUN', 'GBR', 'CRO', 'GRE', 'SLO', 'ESP', 'MDA', 'MKD', 'DEN', 'BIH', 'AUS',
    'MGL', 'BRA', 'IRL', 'AUT'];
  if (array.indexOf(value) != -1){
    return true;
  }else{
    return false;
  }
}

router.get('/addPlace', function(req, res) {
  let html = file.readHtml('./views/addPlace.hbs');
  res.render('index', { body: html({placeAlreadyExists, notEnoughData}), isAdmin, isAuthorized});
  placeAlreadyExists = false;
  notEnoughData = false;
});

router.post('/addPlaceSubmit', function(req, res){
if(req.body.placeName != ''){
  if(!database.ifPlaceExists(req.body.placeName.toUpperCase())){
    database.insertPlace(req.body.placeName.toUpperCase());
  }else{
    placeAlreadyExists = true;
  }
}else{
  notEnoughData = true;
}
  res.redirect('/addPlace');
});

router.get('/updateProfiles', function(req, res) {
  let html = file.readHtml('./views/updateProfiles.hbs');
  res.render('index', { body: html({biathletDoesNotExist, notEnoughData, biathlet, biathletIsFound}), isAdmin, isAuthorized});
  biathletDoesNotExist = false;
  notEnoughData = false;
  biathlet = {};
  biathletIsFound = false;
});

router.post('/findProfileSubmit', function(req, res){
  if (req.body.name != '' && req.body.surname != ''){
  var name = req.body.name.charAt(0).toUpperCase() + req.body.name.slice(1);
  var surname = req.body.surname.toUpperCase();
  if(database.ifBiathletExists(name, surname)){
    biathletIsFound = true;
    var b = database.getBiathletByNameAndSurname(name, surname);
    biathlet = {date_of_birth: b.date_of_birth, height: b.height, weight: b.weight,
       career_begining: b.career_begining, name: b.name, surname: b.surname, rifle: b.rifle, 
       skis: b.skis, poles: b.poles, glooves: b.glooves, glasses: b.glasses, 
       first_year_in_team: b.first_year_in_team, coaches: b.coaches, hobbies: b.hobbies,
       place_of_birth: b.place_of_birth};
  }else{
    biathletDoesNotExist = true;
  }
  }else{
    notEnoughData = true;
  }
  res.redirect('/updateProfiles');
});

router.post('/updateProfileSubmit', function(req, res){
  var biathletId = database.getBiathletIdByNameAndSurname(req.body.name, req.body.surname);
  database.updateBiathlet(req.body.date_of_birth, req.body.height, req.body.weight, 
    req.body.career_begining, biathletId, req.body.rifle, req.body.skis, req.body.poles,
    req.body.glooves, req.body.glasses, req.body.first_year_in_team, req.body.coaches, req.body.hobbies,
    req.body.place_of_birth);
  res.redirect('/updateProfiles');
});

router.get('/profiles', function(req, res) {
  let html = file.readHtml('./views/findBiathlets.hbs');
  res.render('index', { body: html({biathletDoesNotExist, notEnoughData, biathlet, biathletIsFound}), isAdmin, isAuthorized});
  biathletDoesNotExist = false;
  notEnoughData = false;
  biathlet = {};
  biathletIsFound = false;
});

router.post('/findBiathletSubmit', function(req, res){
  if (req.body.name != '' && req.body.surname != ''){
  var name = req.body.name.charAt(0).toUpperCase() + req.body.name.slice(1);
  var surname = req.body.surname.toUpperCase();
  if(database.ifBiathletExists(name, surname)){
    biathletIsFound = true;
    var b = database.getBiathletByNameAndSurname(name, surname);
    var country = database.getCountryNameById(b.country_id);
    biathlet = {date_of_birth: b.date_of_birth, height: b.height, weight: b.weight,
       career_begining: b.career_begining, name: b.name, surname: b.surname, country, rifle: b.rifle, 
       skis: b.skis, poles: b.poles, glooves: b.glooves, glasses: b.glasses, 
       first_year_in_team: b.first_year_in_team, coaches: b.coaches, hobbies: b.hobbies,
       place_of_birth: b.place_of_birth};
  }else{
    biathletDoesNotExist = true;
  }
  }else{
    notEnoughData = true;
  }
  res.redirect('/profiles');
});

router.get('/races', function(req, res) {
  let html = file.readHtml('./views/races.hbs');
  let r = database.getRaces();
  r.forEach(el => {
    var raceKind = database.getRaceTypeNameById(el.kind_of_race_id);
    var year = database.getSeasonYearById(el.season_id);
    var place = database.getPlaceNameById(el.place_id);
    var name = place + ' ' + raceKind + ' ' + year + '/' + (year+1);
    races.push({name: name, id: el.race_id});
  });
  res.render('index', { body: html({races}), isAdmin, isAuthorized});
  races = [];
});

router.get('/races/:id', function(req, res) {
  let html = file.readHtml('./views/race.hbs');
  var b = database.getBiathletsInRace(req.params.id);
  b.forEach(el =>{
    var biathlet = database.getBiathletById(el.biathlet_id);
    var country = database.getCountryNameById(biathlet.country_id);
    biathlets.push({rank: el.rank, bib: el.bib, total: el.total, time: el.time,
      behind: el.behind, country, name: biathlet.name, surname: biathlet.surname});
  });
  sortByRank(biathlets);
  res.render('index', { body: html({biathlets}), isAdmin, isAuthorized});
  biathlets = [];
});

function sortByRank(biathlets){
  for(var i = 0; i < biathlets.length; i++){
    for(var j = i + 1; j < biathlets.length; j++){
      if(biathlets[j].rank < biathlets[i].rank){
        var temp = biathlets[i];
        biathlets[i] = biathlets[j];
        biathlets[j] = temp;
      }
    }
  }
}

router.get('/womenWorldCup', function(req, res) {
  let html = file.readHtml('./views/seasons.hbs');
  let r = database.getSeasons();
  r.forEach(el => {
    var name = el.first_year + '/' + (el.first_year + 1);
    seasons.push({name, id: el.season_id, sex: 'woman'});
  });
  res.render('index', { body: html({seasons}), isAdmin, isAuthorized});
  seasons = [];
});

router.get('/menWorldCup', function(req, res) {
  let html = file.readHtml('./views/seasons.hbs');
  let r = database.getSeasons();
  r.forEach(el => {
    var name = el.first_year + '/' + (el.first_year + 1);
    seasons.push({name, id: el.season_id, sex: 'man'});
  });
  res.render('index', { body: html({seasons}), isAdmin, isAuthorized});
  seasons = [];
});

router.get('/seasons/:sex/:id', function(req, res) {
  let html = file.readHtml('./views/showWorldCup.hbs');
  var sex = req.params.sex;
  var season_id = req.params.id;
  var b = database.getUniqueBiathletsBySeasonAndId(sex, season_id);
  var index = 1;
  b.forEach(el =>{
    var ranks = database.getBiathletPlacesBySeasonIdAndBiathletID(el.biathlet_id, season_id);
    var points = calculatePoints(ranks);
    if(points>0){
      var biathlet = database.getBiathletById(el.biathlet_id);
      var country = database.getCountryNameById(biathlet.country_id);
      biathlets.push({index, points, country, name: biathlet.name, surname: biathlet.surname});
      index++;
    }
  });
  sortByPoints(biathlets);
  res.render('index', { body: html({biathlets}), isAdmin, isAuthorized});
  biathlets = [];
});

function calculatePoints(ranks){
  var sum = 0;
  var points = [60, 54, 48, 43, 40, 38, 36, 34, 32, 31, 30, 29, 28, 27, 26, 25, 24,
    23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

  ranks.forEach(rank=>{
    if(rank.rank < 41){
      sum+=points[rank.rank - 1];
    }
  });

  return sum;
}

function sortByPoints(biathlets){
  for(var i = 0; i < biathlets.length; i++){
    for(var j = i + 1; j < biathlets.length; j++){
      if(biathlets[j].points > biathlets[i].points){
        var temp = biathlets[i];
        biathlets[i] = biathlets[j];
        biathlets[j] = temp;
        var temp = biathlets[i].index;
        biathlets[i].index = biathlets[j].index;
        biathlets[j].index = temp;
      }
    }
  }
}

module.exports = router;
