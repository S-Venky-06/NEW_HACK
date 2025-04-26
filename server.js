const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
const mongoURI = 'mongodb://127.0.0.1:27017/ambulanceApp';


mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Mongoose Schema & Model
const bookingSchema = new mongoose.Schema({
    fullName: String,
    phone: String,
    pickup: String,
    destination: String,
    bookedAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model('Booking', bookingSchema);

// Routes
app.get('/', (req, res) => {
    res.send('🚑 Ambulance Booking Backend is Running');
});

app.post('/book-ambulance', async (req, res) => {
    const { fullName, phone, pickup, destination } = req.body;

    if (!fullName || !phone || !pickup || !destination) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const newBooking = new Booking({ fullName, phone, pickup, destination });
        await newBooking.save();
        console.log('📦 Saved booking:', newBooking);
        res.json({ message: 'Ambulance booked and saved successfully!' });
    } catch (err) {
        console.error('❌ Error saving booking:', err);
        res.status(500).json({ error: 'Server error, booking failed.' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
