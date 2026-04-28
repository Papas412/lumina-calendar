import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lumina-calendar';

app.use(cors());
app.use(bodyParser.json());

// MongoDB Schema
const appointmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String, required: true },
  slot: { type: String, enum: ['whole-day', 'am', 'pm'], required: true },
  color: { type: String, required: true },
  description: String,
  time: String
});

// Convert _id to id when sending to frontend
appointmentSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

const AppointmentModel = mongoose.model('Appointment', appointmentSchema);

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// API Routes
app.get('/api/appointments', async (req, res) => {
  try {
    const appointments = await AppointmentModel.find({});
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const newAppointment = new AppointmentModel(req.body);
    const saved = await newAppointment.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create appointment' });
  }
});

app.put('/api/appointments/:id', async (req, res) => {
  try {
    const updated = await AppointmentModel.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).send('Not found');
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update appointment' });
  }
});

app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const deleted = await AppointmentModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).send('Not found');
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

// Deployment logic: Serve static files from the React app
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.get('/{*path}', (req, res) => {
  const indexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('Lumina Calendar API is running. Build frontend to see the UI.');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
