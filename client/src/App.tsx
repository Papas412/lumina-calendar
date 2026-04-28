import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useCalendar } from './hooks/useCalendar';
import type { Appointment, CreateAppointmentDto } from './shared/types';
import './App.css';

const API_URL = window.location.origin === 'http://localhost:5173' 
  ? 'http://localhost:5001/api' 
  : '/api';

const COLORS = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Sky', value: '#0ea5e9' },
];

function App() {
  const { currentDate, daysInMonth, nextMonth, prevMonth, goToToday } = useCalendar();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  
  const [newTitle, setNewTitle] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0].value);
  const [newSlot, setNewSlot] = useState<'whole-day' | 'am' | 'pm'>('whole-day');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await fetch(`${API_URL}/appointments`);
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    }
  };

  const openAddModal = (date: Date) => {
    setSelectedDate(date);
    setEditingAppointment(null);
    setNewTitle('');
    setNewColor(COLORS[0].value);
    setNewSlot('whole-day');
    setShowModal(true);
  };

  const openEditModal = (e: React.MouseEvent, app: Appointment) => {
    e.stopPropagation();
    setSelectedDate(new Date(app.date));
    setEditingAppointment(app);
    setNewTitle(app.title);
    setNewColor(app.color);
    setNewSlot(app.slot);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !newTitle.trim()) return;

    const dto: CreateAppointmentDto = {
      title: newTitle,
      date: selectedDate.toISOString(),
      color: newColor,
      slot: newSlot,
    };

    try {
      if (editingAppointment) {
        const response = await fetch(`${API_URL}/appointments/${editingAppointment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dto),
        });
        const updated = await response.json();
        setAppointments(appointments.map(a => a.id === updated.id ? updated : a));
      } else {
        const response = await fetch(`${API_URL}/appointments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dto),
        });
        const saved = await response.json();
        setAppointments([...appointments, saved]);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save appointment:', error);
    }
  };

  const handleDelete = async () => {
    if (!editingAppointment) return;
    
    try {
      await fetch(`${API_URL}/appointments/${editingAppointment.id}`, {
        method: 'DELETE',
      });
      setAppointments(appointments.filter(a => a.id !== editingAppointment.id));
      setShowModal(false);
    } catch (error) {
      console.error('Failed to delete appointment:', error);
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(app => {
      const appDate = new Date(app.date);
      return appDate.getDate() === date.getDate() &&
        appDate.getMonth() === date.getMonth() &&
        appDate.getFullYear() === date.getFullYear();
    });
  };

  const getSlotLabel = (slot: string) => {
    switch (slot) {
      case 'am': return 'AM';
      case 'pm': return 'PM';
      default: return '';
    }
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  return (
    <div className="app-container">
      <div className="calendar-card">
        <div className="calendar-header">
          <div className="current-month">
            {monthName} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{year}</span>
          </div>
          <div className="nav-buttons">
            <button className="btn" onClick={goToToday}>Today</button>
            <button className="btn" onClick={prevMonth}><ChevronLeft size={20} /></button>
            <button className="btn" onClick={nextMonth}><ChevronRight size={20} /></button>
          </div>
        </div>

        <div className="calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="weekday-header">{day}</div>
          ))}
          {daysInMonth.map((dayObj, index) => {
            const dayAppointments = getAppointmentsForDay(dayObj.date);
            return (
              <div 
                key={index} 
                className={`day-cell ${!dayObj.currentMonth ? 'other-month' : ''} ${isToday(dayObj.date) ? 'today' : ''}`}
                onClick={() => openAddModal(dayObj.date)}
              >
                <span className="day-number">{dayObj.date.getDate()}</span>
                <div className="appointments-list">
                  {dayAppointments.slice(0, 3).map(app => (
                    <div 
                      key={app.id} 
                      className="appointment-pill"
                      style={{ backgroundColor: app.color }}
                      onClick={(e) => openEditModal(e, app)}
                    >
                      {getSlotLabel(app.slot) && (
                        <span style={{ fontWeight: 'bold', marginRight: '4px', opacity: 0.8 }}>
                          {getSlotLabel(app.slot)}
                        </span>
                      )}
                      {app.title}
                    </div>
                  ))}
                  {dayAppointments.length > 3 && (
                    <div className="appointment-pill" style={{ backgroundColor: '#94a3b8', fontSize: '0.6rem' }}>
                      + {dayAppointments.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingAppointment ? 'Edit Appointment' : 'Add Appointment'}</h3>
              <button className="btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input 
                  autoFocus
                  type="text" 
                  value={newTitle} 
                  onChange={e => setNewTitle(e.target.value)} 
                  placeholder="What are you planning?"
                  required
                />
              </div>
              <div className="form-group">
                <label>Time Slot</label>
                <select 
                  value={newSlot} 
                  onChange={e => setNewSlot(e.target.value as any)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                >
                  <option value="whole-day">Whole Day</option>
                  <option value="am">AM (Morning)</option>
                  <option value="pm">PM (Afternoon)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="text" value={selectedDate?.toLocaleDateString()} disabled />
              </div>
              <div className="form-group">
                <label>Color Tag</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {COLORS.map(c => (
                    <div 
                      key={c.value}
                      onClick={() => setNewColor(c.value)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: c.value,
                        cursor: 'pointer',
                        border: newColor === c.value ? '2px solid #334155' : '2px solid transparent',
                        boxSizing: 'border-box'
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="form-actions">
                {editingAppointment && (
                  <button 
                    type="button" 
                    className="btn" 
                    onClick={handleDelete}
                    style={{ marginRight: 'auto', color: '#f43f5e' }}
                  >
                    Delete
                  </button>
                )}
                <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingAppointment ? 'Save Changes' : 'Save Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
