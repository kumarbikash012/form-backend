const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
const app = express();


app.use(cors());
app.use(express.json());
app.use(express.static('uploads')); 

mongoose.connect('mongodb+srv://kumarsmbikash:2pCxdvZ1DYgtk62C@submissionform.he0lz.mongodb.net/?retryWrites=true&w=majority&appName=submissionform', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch((err) => console.error(err));

const userSubmissionSchema = new mongoose.Schema({
  name: String,
  socialMediaHandle: String,
  images: [String] 
});

const UserSubmission = mongoose.model('UserSubmission', userSubmissionSchema);

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const Admin = mongoose.model('Admin', adminSchema); 
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); 
  }
});

const upload = multer({ storage });

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const newAdmin = new Admin({ username, password }); 
    await newAdmin.save();
    res.status(201).json({ message: 'Admin registered successfully!' });
  } catch (error) {
    console.error('Error registering admin:', error);
    res.status(500).json({ message: 'Error registering admin' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid username' });
    }

    if (password !== admin.password) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ id: admin._id }, 'your_jwt_secret', { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});


const auth = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, 'your_jwt_secret', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.post('/api/submit', upload.array('images', 10), async (req, res) => {
  try {
    const { name, socialMediaHandle } = req.body;
    const images = req.files.map((file) => file.path); 

    const newSubmission = new UserSubmission({
      name,
      socialMediaHandle,
      images
    });

    await newSubmission.save();
    res.status(201).json({ message: 'Submission successful!' });
  } catch (error) {
    console.error('Error saving submission:', error);
    res.status(500).json({ message: 'Error saving submission' });
  }
});

app.get('/api/submissions', auth, async (req, res) => {
  try {
    const submissions = await UserSubmission.find();
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ message: 'Error fetching submissions' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
