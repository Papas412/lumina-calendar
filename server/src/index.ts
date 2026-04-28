import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Appointment, CreateAppointmentDto } from '../../client/src/shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;
const DATA_FILE = path.join(__dirname, 'appointments.json');

app.use(cors());
app.use(bodyParser.json());

// Load data from file
const loadAppointments = (): Appointment[] => {
  if (!fs.existsSync(DATA_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

// Save data to file
const saveAppointments = (appointments: Appointment[]) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(appointments, null, 2));
};

let appointments: Appointment[] = loadAppointments();

// API Routes
app.get('/api/appointments', (req, res) => {
  res.json(appointments);
});

app.post('/api/appointments', (req, res) => {
  const dto: CreateAppointmentDto = req.body;
  const newAppointment: Appointment = {
    ...dto,
    id: Math.random().toString(36).substr(2, 9)
  };
  appointments.push(newAppointment);
  saveAppointments(appointments);
  res.status(201).json(newAppointment);
});

app.put('/api/appointments/:id', (req, res) => {
  const { id } = req.params;
  const updatedData: Partial<Appointment> = req.body;
  const index = appointments.findIndex(a => a.id === id);
  
  if (index !== -1) {
    appointments[index] = { ...appointments[index], ...updatedData };
    saveAppointments(appointments);
    res.json(appointments[index]);
  } else {
    res.status(404).send('Appointment not found');
  }
});

app.delete('/api/appointments/:id', (req, res) => {
  const { id } = req.params;
  appointments = appointments.filter(a => a.id !== id);
  saveAppointments(appointments);
  res.status(204).send();
});

// Deployment logic: Serve static files from the React app
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// For any other request, send the index.html from the frontend
app.get('*', (req, res) => {
  if (fs.existsSync(path.join(clientDistPath, 'index.html'))) {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  } else {
    res.send('Lumina Calendar API is running. Frontend not built yet.');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
