const express = require(`express`);
const app = express();
const userModel = require('./models/user')
const postModel = require('./models/post')

const path = require(`path`);
const bcrypt = require(`bcrypt`);
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

app.set('view engine','ejs')
app.use(express.urlencoded({extended:true}));
app.use(express.json())
app.use(cookieParser())
app.set(express.static(path.join(__dirname,'public')));

app.get('/',(req, res)=>{
  res.render('index')
});

app.get('/login',( req, res)=>{
  res.render('login')
});

app.post('/register',async (req, res)=>{
  let { username, name, age, email, password} = req.body;
  let user = await userModel.findOne({email});
  if(user) return res.status(500).send('User already registered')

  bcrypt.genSalt(10,(err, salt)=>{
    bcrypt.hash(password,salt,async (err, hash)=>{
     let user = await userModel.create({
                        username,
                        name,
                        age,
                        email,
                        password: hash
                      });
      let token = jwt.sign({ email: user.name,userid: user._id }, 'shhhhh');
      res.cookie('token',token);
      res.send('registered')
    })
  });
});

app.get('/login',( req, res)=>{
  res.render('login')
});

app.post('/login',async (req, res)=>{
  let { email, password } = req.body;
  let user = await userModel.findOne({email});
  if(!user) return res.status(500).send('something went wrong email');

  bcrypt.compare(password,user.password,(err,result)=>{
    if(!result) return res.status(500).send('something went wrong pass');
    let token = jwt.sign({email,username: user._id},'shhhhh')
    res.status(200).send('You can login').cookie('token',token)
  })
});

app.get('/logout',(req, res)=>{
  res.cookie('token','')
  res.redirect('/login')
})

app.listen(3000);