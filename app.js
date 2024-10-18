const express= require ('express')
const app=express()
const port =process.env.port||5000



// Create Mongoose connection



//gridfs to upload and serve files in chunks
const grid= require('gridfs-stream')
const {GridFSBucket}= require('mongodb')


const mongoose = require('mongoose');
const uri = "mongodb+srv://filexmbogo:filexmbogo.691@cluster0.rff4u.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

let gfs, gridfsbuccket;
let isConnected = false; // Track connection state

const connectDB = async () => {
    if (!isConnected) {
        try {
            const conn = await mongoose.createConnection(uri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });

            conn.once('open', () => {
                gridfsbucket = new GridFSBucket(conn.db, { bucketName: 'pdfs' });
                gfs = grid(conn.db, mongoose.mongo);
                isConnected = true; // Set connection state to true
                console.log("MongoDB connection established!");
            });
            return conn;
        } catch (error) {
            console.error("Error connecting to MongoDB:", error);
            throw error; // Re-throw to handle it in the main route
        }
    }
};

// Initialize connection
connectDB();

//multer for file upload
const multer=require('multer')
const storage=multer.memoryStorage()
const upload=multer({storage})

//handle paths
const crypto= require('crypto')
const path=require ('path')

const methodoveride=require('method-override')

//router
const loginrouter= require('./src/routes/login')
const  register= require('./src/routes/register')
app.use(loginrouter)
app.use(register)
//middlewares
app.use(express.json())
app.use(express.static('./public'))
app.use(methodoveride('_method'))
app.set('view engine','ejs')
app.set('views','src/views')





//homepage
app.get("/",(req,res)=>{
    res.render('login',{})
})
app.get('/pdf/:id', async(req, res) => {
    const key = new mongoose.Types.ObjectId(req.params.id);
  
    let file = await gfs.files.findOne({ _id: key })
    
        if (!file || file.length === 0) {
          return res.status(404).json({ message: 'File not found' });
        }
    
        
    
        if (file.contentType === 'application/pdf') {
          res.set({'Content-Type':file.contentType,
            'Content-Disposition': `attachment; filename="${file.filename}"`
          });
          
          // Stream the file from GridFS to the client
          const downloadStream = gridfsbuccket.openDownloadStream(key);
          downloadStream.pipe(res);
   
          
          

        } else {
          res.status(404).json({ message: 'Not a PDF file' });
        }
      
  });


app.get("/upload", async (req, res) => {
    try {
        let files = await gfs.files.find().toArray();
        res.render('index',{files})
    } catch (err) {
        res.json({err})
    }
 });
   

app.post('/docs/upload',upload.single('pdf'),(req,res)=>{
const {buffer}=req.file
const filename=crypto.randomBytes(16).toString('hex') +path.extname(req.file.originalname)
//use grid fs uploadstream to save data
const uploadstream=gridfsbuccket.openUploadStream(filename,
    {_id:req.file.originalname,
        contentType:req.file.mimetype,
        metadata:{
            originalname:req.file.originalname
        }
    })
    uploadstream.end(buffer)
    uploadstream.on('finish',()=>{res.redirect('/upload')})
console.log(req.file.originalname);


})








app.listen(port,()=>{console.log('serve is listening at port 10000');
})



