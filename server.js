var express = require('express'),
	mysql = require('mysql'),
	bodyParser = require('body-parser'),
	path = require('path'),
	multer = require('multer'),
	session = require('express-session'),
	dbase = require('./config/dbconfig.js'),
	socket = require('socket.io'),
	socketHandshake = require('socket.io-handshake'),
	cookieParser = require('cookie-parser');
	// morgan = require('morgan');
	// swal = require('sweetalert2');

var app = express();

var flash    = require('connect-flash');

// koneksi
var knex = require('knex')({
	client : 'mysql',
	connection : dbase.connection
})
knex.raw('select 1').then(
	() => console.log('database connect!'), 
	(err) => console.log('error bah = '+err) 
)
knex('user').update('online',0).then(
	() => console.log('Updated!'),
	() => console.log('Error Updated')
)
// socket.io

// upload foto
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/fotoprofil/')   
    },
    filename: function (req, file, cb) {
        cb(null, req.session.user.username+Date.now())      
    }
})

var upload = multer({storage : storage});


// require('./config/passport')(passport,knex); // passport configuration

// set
app.set('views', path.join(__dirname, 'view')); /* set folder view untuk page-page yang dapat diakses */
app.set('view engine', 'ejs'); /* set view */


// use
app.use(bodyParser.urlencoded({
	extended: true
}));
// app.use(morgan('dev'));

app.use(bodyParser.json());
app.use(express.static(path.resolve( path.join(__dirname, 'public') ))); /* Cara set folder public untuk page page yang ada*/
app.use(cookieParser());
app.use( session({
	secret: 'madmoreverywhere',
	resave: false,
	saveUninitialized: false
} ));


app.use(flash()); // use connect-flash for flash messages stored in session
var server = app.listen(8000,(req,res)=>{ console.log('Good apps by mad dev in port 8000!')	})
var io = socket(server,{'connect timeout':1000});

app.use((req, res, next) => {
	res.locals.user = req.session.user;
	// res.locals.foto = req.session.foto;
	req.io = io;
	next();
});

// io.use((socket,next)=>{
// 	session(socket.request, socket.request.res, next)
// })
// io.use(socketHandshake({parser:cookieParser()}));

// Route
require('./routes/routeLamaGakAsync.js')(app,knex,upload);

// socket.io
require('./config/socketio.js')(socket,io,knex);