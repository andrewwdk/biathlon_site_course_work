var mysql = require('mysql');
var deasync = require('deasync');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Domracheva2',
    database: 'biathlon'
});

connection.connect(function(error){
    if(!!error){ 
        console.log('Error');
    }else{
        console.log('Connected')
    }
});

var ifLoginExists = (login) => {
    return ifSmthExists("`Users`", "`login`", login);
}

var ifLoginAndPasswordCorrect = (login, password) => {
    let result = false;
    let done = false;

    connection.query("SELECT * FROM `Users`", (error, rows) =>{
        if(!!error){ 
            console.log('Error');
        }else{
            console.log('Successful');
            rows.forEach(function(row){
                if(row.login == login && row.password == password){
                    result = true;
                    return;
                }
            });
        }
        done = true;
    });

    while(!done)
    {
         deasync.runLoopOnce();
    }

    return result;
}

var insertUser = (login, password) =>{
    var sql = "INSERT INTO `Users` (login, password) VALUES (?, ?)";

    let toinsert = [login, password];

    connection.query(sql, toinsert, (error) =>{
        if(!!error){ 
            console.log(error);
        }else{
            console.log('Successful');
        }
    });
}

function ifSmthExists(table, field, value){
    let result = false;
    let done = false;

    connection.query("SELECT * FROM " + table + " WHERE " + field + " = '" + value + "'", (error, rows) =>{
        if(!!error){ 
            console.log('Error');
        }else{
            console.log('Successful');
            if(rows.length != 0){
                result = true;
            }
        }
        done = true;
    });

    while(!done)
    {
         deasync.runLoopOnce();
    }

    return result;
}

function getFieldsByValue(table, field, value){
    let result = false;
    let done = false;

    connection.query("SELECT * FROM " + table + " WHERE " + field + " = '" + value + "'", (error, rows) =>{  
        if(!!error){ 
            console.log('Error');
        }else{
            console.log('Successful');
            result = rows;
        }
        done = true;
    });

    while(!done)
    {
         deasync.runLoopOnce();
    }

    return result;
}

var getRaceTypeIdByName = function(name){
    var rows = getFieldsByValue('`Kinds of races`', '`name`', name);
    return rows[0].kind_of_race_id;
}

var getSeasonIdByYear = function(year){
    var rows = getFieldsByValue('`Seasons`', '`first_year`', year);
    return rows[0].season_id;
}

var getPlaceIdByName = function(name){
    var rows = getFieldsByValue('`Places`', '`name`', name);
    return rows[0].place_id;
}

var insertRace = (kind_of_race_id, season_id, place_id) =>{
    var sql = "INSERT INTO `Races` (kind_of_race_id, season_id, place_id) VALUES (?, ?, ?)";

    let toinsert = [kind_of_race_id, season_id, place_id];

    connection.query(sql, toinsert, (error) =>{
        if(!!error){ 
            console.log(error);
        }else{
            console.log('Successful');
        }
    });
}

function ifRaceExists(kind_of_race_id, season_id, place_id){
    let result = false;
    let done = false;

    connection.query("SELECT * FROM `Races` WHERE `kind_of_race_id` = '" + kind_of_race_id + "' AND `season_id` = '" + season_id + "' AND `place_id` = '" + place_id + "'", (error, rows) =>{
        if(!!error){ 
            console.log('Error');
        }else{
            console.log('Successful');
            if(rows.length != 0){
                result = true;
            }
        }
        done = true;
    });

    while(!done)
    {
         deasync.runLoopOnce();
    }

    return result;
}

function getRaceId(kind_of_race_id, season_id, place_id){
    let result = false;
    let done = false;

    connection.query("SELECT * FROM `Races` WHERE `kind_of_race_id` = '" + kind_of_race_id + "' AND `season_id` = '" + season_id + "' AND `place_id` = '" + place_id + "'", (error, rows) =>{
        if(!!error){ 
            console.log('Error');
        }else{
            console.log('Successful');
            result = rows[0].race_id;
        }
        done = true;
    });

    while(!done)
    {
         deasync.runLoopOnce();
    }

    return result;
}

function ifBiathletExists(name, surname){
    let result = false;
    let done = false;

    connection.query("SELECT * FROM `Biathlets` WHERE `name` = '" + name + "' AND `surname` = '" + surname + "'", (error, rows) =>{
        if(!!error){ 
            console.log('Error');
        }else{
            if(rows.length != 0){
                result = true;
            }
        }
        done = true;
    });

    while(!done)
    {
         deasync.runLoopOnce();
    }

    return result;
}

var insertBiathlet = (name, surname, sex, country_id) =>{
    var sql = "INSERT INTO `Biathlets` (name, surname, sex, country_id) VALUES (?, ?, ?, ?)";

    let toinsert = [name, surname, sex, country_id];

    connection.query(sql, toinsert, (error) =>{
        if(!!error){ 
            console.log(error);
        }else{
            console.log('Successful');
        }
    });
}

var getCountryIdByName = function(name){
    var rows = getFieldsByValue('`Country`', '`name`', name);
    return rows[0].country_id;
}

function getBiathletIdByNameAndSurname(name, surname){
    let result = false;
    let done = false;

    connection.query("SELECT * FROM `Biathlets` WHERE `name` = '" + name + "' AND `surname` = '" + surname + "'", (error, rows) =>{  
        if(!!error){ 
            console.log('Error');
        }else{
            console.log('Successful');
            result = rows[0].biathlet_id;
        }
        done = true;
    });

    while(!done)
    {
         deasync.runLoopOnce();
    }

    return result;
}

var insertBiathletInRace = (bib, rank, total, time, behind, race_id, biathlet_id) =>{
    var sql = "INSERT INTO `Biathlets in races` (`bib`, `rank`, `shooting`, `total`, `time`, `behind`, `race_id`, `biathlet_id`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

    let toinsert = [bib, rank, null, total, time, behind, race_id, biathlet_id];

    connection.query(sql, toinsert, (error) =>{
        if(!!error){ 
            console.log(error);
        }else{
            console.log('Successful');
        }
    });
}

var ifPlaceExists = (name) => {
    return ifSmthExists("`Places`", "`name`", name);
}

var insertPlace = (name) =>{
    var sql = "INSERT INTO `Places` (name) VALUES (?)";

    let toinsert = [name];

    connection.query(sql, toinsert, (error) =>{
        if(!!error){ 
            console.log(error);
        }else{
            console.log('Successful');
        }
    });
}

function getBiathletByNameAndSurname(name, surname){
    let result = false;
    let done = false;

    connection.query("SELECT * FROM `Biathlets` WHERE `name` = '" + name + "' AND `surname` = '" + surname + "'", (error, rows) =>{  
        if(!!error){ 
            console.log('Error');
        }else{
            console.log('Successful');
            result = rows[0];
        }
        done = true;
    });

    while(!done)
    {
         deasync.runLoopOnce();
    }

    return result;
}

var updateBiathlet = (date_of_birth, height, weight, career_begining, id) =>{
    var sql = "UPDATE `Biathlets` SET `date_of_birth` = ?, `height` = ?, `weight` = ?, `career_begining` = ? WHERE `biathlet_id` = ?";

    if(date_of_birth == ''){
        date_of_birth = null;
    }
    if(height == ''){
        height = null;
    }
    if(weight == ''){
        weight = null;
    }
    if(career_begining == ''){
        career_begining = null;
    }

    let toinsert = [date_of_birth, height, weight, career_begining, id];

    connection.query(sql, toinsert, (error) =>{
        if(!!error){ 
            console.log(error);
        }else{
            console.log('Successful');
        }
    });
}

var getCountryNameById = function(id){
    var rows = getFieldsByValue('`Country`', '`country_id`', id);
    return rows[0].name;
}

function getRaces(){
    let result = false;
    let done = false;

    connection.query("SELECT * FROM `Races`", (error, rows) =>{  
        if(!!error){ 
            console.log('Error');
        }else{
            console.log('Successful');
            result = rows;
        }
        done = true;
    });

    while(!done)
    {
         deasync.runLoopOnce();
    }

    return result;
}

var getRaceTypeNameById = function(id){
    var rows = getFieldsByValue('`Kinds of races`', '`kind_of_race_id`', id);
    return rows[0].name;
}

var getSeasonYearById = function(id){
    var rows = getFieldsByValue('`Seasons`', '`season_id`', id);
    return rows[0].first_year;
}

var getPlaceNameById = function(id){
    var rows = getFieldsByValue('`Places`', '`place_id`', id);
    return rows[0].name;
}

function getBiathletsInRace(id){
    let result = false;
    let done = false;

    connection.query("SELECT * FROM `Biathlets in races` WHERE `race_id` = '" + id + "'", (error, rows) =>{  
        if(!!error){ 
            console.log('Error');
        }else{
            console.log('Successful');
            result = rows;
        }
        done = true;
    });

    while(!done)
    {
         deasync.runLoopOnce();
    }

    return result;
}

var getBiathletById = function(id){
    var rows = getFieldsByValue('`Biathlets`', '`biathlet_id`', id);
    return rows[0];
}

module.exports.ifLoginExists = ifLoginExists;
module.exports.ifLoginAndPasswordCorrect = ifLoginAndPasswordCorrect;
module.exports.insertUser = insertUser;
module.exports.getRaceTypeIdByName = getRaceTypeIdByName;
module.exports.getSeasonIdByYear = getSeasonIdByYear;
module.exports.getPlaceIdByName = getPlaceIdByName;
module.exports.insertRace = insertRace;
module.exports.ifRaceExists = ifRaceExists;
module.exports.getRaceId = getRaceId;
module.exports.ifBiathletExists = ifBiathletExists;
module.exports.insertBiathlet = insertBiathlet;
module.exports.getCountryIdByName = getCountryIdByName;
module.exports.getBiathletIdByNameAndSurname = getBiathletIdByNameAndSurname;
module.exports.insertBiathletInRace = insertBiathletInRace;
module.exports.ifPlaceExists = ifPlaceExists;
module.exports.insertPlace = insertPlace;
module.exports.getBiathletByNameAndSurname = getBiathletByNameAndSurname;
module.exports.updateBiathlet = updateBiathlet;
module.exports.getCountryNameById = getCountryNameById;
module.exports.getRaces = getRaces;
module.exports.getRaceTypeNameById = getRaceTypeNameById;
module.exports.getSeasonYearById = getSeasonYearById;
module.exports.getPlaceNameById = getPlaceNameById;
module.exports.getBiathletsInRace = getBiathletsInRace;
module.exports.getBiathletById = getBiathletById;