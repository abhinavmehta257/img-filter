const express = require('express');
const {engine} = require('express-handlebars');
const multer = require('multer');
const path = require('path');
const app = express();
const axios = require('axios')
const dotenv = require('dotenv').config()

const upload = multer({})


// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded());

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

// const imageStorage = multer.diskStorage({
//     // Destination to store image     
//     destination: 'images', 
//       filename: (req, file, cb) => {
//           cb(null, file.fieldname + '_' + Date.now() 
//              + path.extname(file.originalname))
//             // file.fieldname is name of the field (image)
//             // path.extname get the uploaded file extension
//     }
// });
// const imageUpload = multer({
//     storage: imageStorage,
//     limits: {
//       fileSize: 1000000 // 1000000 Bytes = 1 MB
//     },
//     fileFilter(req, file, cb) {
//       if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) { 
//          // upload only png and jpg format
//          return cb(new Error('Please upload a Image'))
//        }
//      cb(undefined, true)
//   }
// }) 

//express handlebars
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.get('/', async (req, res) => {
    let styles;
    await axios.get('https://api.deeparteffects.com/v1/noauth/styles',{headers:{"x-api-key":process.env.DEEP_ART_API_KEY}}).then((response) => {
        styles = response.data.styles
    });
    res.render('index',{styles:styles});
});
app.post('/img', async (req, res) => {
    console.log(req.body);
    
});
// For Single image upload
app.post('/uploadImage', upload.single('image'), (req, res) => {
    // res.send(req.file)
    const encoded = req.file.buffer.toString('base64');
    // console.log(encoded);
    let styles;
    axios.get('https://api.deeparteffects.com/v1/noauth/styles',{headers:{"x-api-key":process.env.DEEP_ART_API_KEY}}).then((response) => {
        styles = response.data.styles
    });
    axios.post('https://api.deeparteffects.com/v1/noauth/upload',{imageBase64Encoded:encoded,styleId:req.body.styleId},{headers:{"x-api-key":process.env.DEEP_ART_API_KEY}})
    .then((response) => {
        console.log(response.data);
        invterval = setInterval(
            () => {
                axios.get(`https://api.deeparteffects.com/v1/noauth/result?submissionId=${response.data.submissionId}`,{headers:{"x-api-key":process.env.DEEP_ART_API_KEY}}).then((response) => {
                    console.log(response.data);
                    if(response.data.status === 'finished'){
                        clearInterval(invterval);
                        styledimage = response.data.url;
                        res.render('index',{styles:styles,styledimage:styledimage});
                    }
                });
            }, 2000)
        
    });


}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})
app.listen(process.env.PORT||3000, () => {
    console.log('Server is running on port 3000');
});