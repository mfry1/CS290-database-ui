var express = require('express');
var handlebars = require('express-handlebars').create({defaultLayout: 'main'});
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

// Connect to database
var mysql = require('mysql');
var pool = mysql.createPool({
  host            : 'mysql.eecs.oregonstate.edu',
  user            : 'cs290_fryma',
  password        : '6490',
  database        : 'cs290_fryma'
});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port',1301);

app.use(express.static(__dirname + '/public'));

// Home page
app.get('/', function(req,res){
  var context = {};
  res.render('home', context);
});

// Returns database data
app.get('/get-data', function(req,res,next){
  sendTableData(req,res,next);
});

// Gets data from client to add new completed exercise
app.post('/add', function(req,res,next){
  pool.query("INSERT INTO workouts (`name`, `date`,`reps`,`weight`,`lbs`) VALUES (?,?,?,?,?)", [req.body.name,req.body.date,req.body.reps,req.body.weight,req.body.unit], function(err, result){
    if(err){
      next(err);
      return;
    }
    sendTableData(req,res,next);
  });
});


app.post('/delete', function(req, res, next){
  pool.query("DELETE FROM workouts WHERE id = ?", [req.body.id], function(err, result){
    if(err){
      next(err);
      return;
    }
    sendTableData(req,res,next);
  });
});

// Queries database for all data in it and sends to client
function sendTableData(req,res, next){
  pool.query('SELECT * FROM workouts ORDER BY name', function(err, rows, fields){
  if(err){
    next(err);
    return;
  }
  res.type('application/json');
  res.send(rows);
  });

}

// Update an entry in the database with the new data from client
app.post('/update',function(req,res,next){
  pool.query("UPDATE workouts SET name=?, date=?, reps=?, weight=?, lbs=? WHERE id = ?", [req.body.name, req.body.date, req.body.reps, req.body.weight, req.body.unit, req.body.id], function(err, result){
    if(err){
      next(err);
      return;
    }
    sendTableData(req,res,next);
  });
});

// Resets data in workouts database
app.get('/reset-table',function(req,res,next){
  var context = {};
  pool.query("DROP TABLE IF EXISTS workouts", function(err){
    var createString = "CREATE TABLE workouts("+
    "id INT PRIMARY KEY AUTO_INCREMENT,"+
    "name VARCHAR(255) NOT NULL,"+
    "reps INT,"+
    "weight INT,"+
    "date DATE,"+
    "lbs BOOLEAN)";
    pool.query(createString, function(err){
      context.results = "Table reset";
      res.render('home',context);
    })
  });
});

//404 Page;
app.use(function(req, res){
  res.status(404);
  res.render('404');
});

//500 Page
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.type('plain/text');
  res.status(500);
  res.render('500');
});

app.listen(app.get('port'),function(){
  console.log("Server is running...")
});
