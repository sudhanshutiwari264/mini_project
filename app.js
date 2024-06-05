const express = require(`express`);
const app = express();
const userModel = require('./models/user')
const postModel = require('./models/post')

const path = require(`path`);
const bcrypt = require(`bcrypt`);
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const user = require('./models/user');

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
      res.render('profile')
    })
  });
});

app.get('/profile', isLoggedIn,async ( req, res)=>{
  let user =  await userModel.findOne({email: req.user.email}).populate('posts')
  //console.log(user.posts)
  res.render('profile',{user})
});

app.get('/like/:id', isLoggedIn, async ( req, res)=>{
  let post =  await postModel.findOne({_id: req.params.id}).populate('user')
  if(post.likes.indexOf(req.user.userid) === -1){
    post.likes.push(req.user.userid)
  }else{
    post.likes.splice(post.likes.indexOf(req.user.userid),1)
  }
  await post.save()
  res.redirect('/profile')
});

app.get('/edit/:id', isLoggedIn, async ( req, res)=>{
  let post =  await postModel.findOne({_id: req.params.id}).populate('user')

  res.render('edit',{post})
});

app.post ('/update/:postid', isLoggedIn, async ( req, res)=>{
  let post =  await postModel.findOneAndUpdate({_id: req.params.postid},{content:req.body.content})
  res.redirect('/profile')
});

app.post('/post', isLoggedIn,async ( req, res)=>{
  let user =  await userModel.findOne({email: req.user.email})
  let {content} = req.body 
  let post = await postModel.create({
    user: user._id,
    content,
  })
  user.posts.push(post._id)
  await user.save();
  res.redirect('/profile')
});

app.post('/login',async (req, res)=>{
  let { email, password } = req.body;
  let user = await userModel.findOne({email});
  if(!user) return res.status(500).send('something went wrong email');

  bcrypt.compare(password,user.password,(err,result)=>{
    if(result){ 
    let token = jwt.sign({ email: user.email,userid: user._id }, 'shhhhh');
    res.cookie('token',token);
    res.status(200).redirect('/profile')   
    }else{
       res.status(500).send('something went wrong pass')}
  })
});

app.get('/logout',(req, res)=>{
  res.cookie('token','')
  res.redirect('/login')
})


function isLoggedIn(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).redirect('/login');
  }

  jwt.verify(token, 'shhhhh', (err, decoded) => {
    if (err) {
      return res.status(401).send('Invalid token');
    }

    req.user = decoded;
    next();
  });
}


app.listen(3000);