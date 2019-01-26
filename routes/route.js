var bcrypt = require('bcrypt-nodejs'),
	async = require('async');
module.exports = (app,knex,upload) => {

	app.get('/',(req,res)=>{
		res.render('login',{mess:req.flash('mess')});
	})
	app.get('/home',auth,(req,res)=>{
		async.parallel({
			user : (cb) => { 
				knex('user').select('id','username','deskripsi','fotoProfile','online').orderBy('online','desc')
				.then((rows)=> cb( null, rows) ) 
			},
			conversation : (cb) => { 
				knex('conversation').where({'to_id':req.session.user.id,unread:1})
				.then( (row)=> cb( null, row) ) 
			}
		}, (err,result) => {
			var obj = {
				mess:req.flash('mess'),
				error:req.flash('err'),
				alluser:result.user,
				users:JSON.stringify(result.user),
				read:JSON.stringify(result.conversation),
			}
			res.render('index',obj);
		})
	})
	app.get('/logout',(req,res)=>{
		var io = req.io;
		async.parallel({
			update : (cb) => {
				knex('user').where('username',req.session.user.username).update('online',0).then(()=>cb(null))
			},
			user : (cb) => {
				knex('user').select('id','username','deskripsi','fotoProfile','online').orderBy('online','desc').then((rows)=>cb(null,rows))
			}
		},(err,result)=>{
			io.emit('updateAlluser',result.user);
			console.log(req.session.user.username,'meninggalkan chat')
			req.session.destroy((error)=>{
				if(!error) {
					res.redirect('/')
				}
			})
		});
	})

	app.post('/upload',upload.single('avatar'), (req,res) => {
		var path = (req.file.path).split('\\');
		var namaFoto = path[path.length - 1];
		var io = req.io;
		knex('user').where('username',req.session.user.username).update({fotoProfile : namaFoto}).then( (rows) => {
			req.flash('mess','Berhasil upload foto profil !');
			req.flash('err','false');
			// console.log(rows[0]);
			req.session.user.fotoProfile = namaFoto;
			knex('user').select('id','username','deskripsi','fotoProfile','online').orderBy('online','desc').then((users)=>{
				io.emit('updateAlluser',users);
				res.redirect('/home');
			})
		},(err)=>{
			console.log(err);
		})
	})
	app.post('/update',(req,res)=>{
		var body = req.body;
		var io = req.io;
		knex('user').where('username',req.session.user.username).update({username:body.username,deskripsi:body.deskripsi}).then((rows)=>{
			req.flash('mess','Berhasil Update profil mu !');
			req.flash('err','false');

			req.session.user.username = body.username;
			req.session.user.deskripsi = body.deskripsi;
			knex('user').select('id','username','deskripsi','fotoProfile','online').orderBy('online','desc').then((users)=>{
				io.emit('updateAlluser',users);
				res.redirect('/home');
			})
		})
	})

	app.post('/register',(req,res)=>{
		var body = req.body;
        knex('user').where('username',body.username).orWhere('email',body.email).then( (rows) => {
            if(rows.length){
                req.flash('mess', 'USERNAME atau EMAIL sudah digunakan')
                res.redirect('/')
            } else {
                var newUserMysql = {
                    username: body.username,
                    password: bcrypt.hashSync(body.password, null, null),
                    email:body.email,
                    deskripsi:body.deskripsi
                };
                knex.insert(newUserMysql).into('user').then( (rows) => {
                	knex('user').where('username',body.username).then( (user) => {
	                    req.session.user = user[0];
	                    res.redirect('/home');
                	})
                })
            }
        }, (err) => {
            return err
    	})
	})
	app.post('/login',(req,res)=>{
		var io = req.io;
		async.waterfall([
			(cb) => {
				knex('user').where('username',req.body.username).then( (rows) => {
	                if(!rows.length){
	                	req.flash('mess','user belum terdaftar')
	                    res.redirect('/')
	                }
	                if (!bcrypt.compareSync(req.body.password, rows[0].password)){
	                    req.flash('mess','Oops! Password anda salah.')
	                	res.redirect('/')
	                }
	                req.session.user = rows[0];
	                cb(null);
                })
			},
			(cb) => {
				knex('user').where('username',req.session.user.username).update('online',1).then( (row) => cb(null))
			},
			(cb) => {
				knex('user').select('id','username','deskripsi','fotoProfile','online').orderBy('online','desc').then( (row) => cb(null,row))
			}
		],(err,result)=>{
			// console.log(result);
			io.emit('updateAlluser',result);
            res.redirect('/home');
		})
	})
}

var auth = (req,res,next) => {
	if(!req.session.user){
		req.flash('mess','Login dulu bro!');
		res.redirect('/')
	} else {
		next();
	}
}