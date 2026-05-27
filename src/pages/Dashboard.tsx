import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import appointmentService from '../services/appointment.service';
import { Appointment } from '../types';
import { Calendar, CheckCircle, Clock, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const data = await appointmentService.getAppointments();
        setAppointments(data);
      } catch (error) {
        console.error('Failed to load appointments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const nextAppointment = appointments.find(
    (app) => app.status === 'confirmed' && new Date(app.appointmentDate) > new Date()
  );

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-sky-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg">
        <h2 className="text-3xl font-bold">Hello, {user?.name}!</h2>
        <p className="text-sky-100 mt-2">
          {user?.role === 'patient' 
            ? 'Manage your health schedules and book appointments with ease.' 
            : 'Review your clinic schedule and update patient notes.'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center gap-5">
          <div className="p-4 rounded-lg bg-sky-50 text-sky-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-sm font-semibold">Total Appointments</p>
            <p className="text-2xl font-bold text-slate-800">{loading ? '...' : appointments.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center gap-5">
          <div className="p-4 rounded-lg bg-yellow-50 text-yellow-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-sm font-semibold">Pending Approvals</p>
            <p className="text-2xl font-bold text-slate-800">
              {loading ? '...' : appointments.filter(a => a.status === 'pending').length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center gap-5">
          <div className="p-4 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-sm font-semibold">Completed Visits</p>
            <p className="text-2xl font-bold text-slate-800">
              {loading ? '...' : appointments.filter(a => a.status === 'completed').length}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Next Appointment Card */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Upcoming Schedule</h3>
          
          {nextAppointment ? (
            <div className="p-4 rounded-lg bg-sky-50 border border-sky-100 flex justify-between items-start">
              <div>
                <p className="font-semibold text-sky-900 capitalize">
                  {user?.role === 'patient' 
                    ? `Doctor: Dr. ${nextAppointment.doctorId.name}` 
                    : `Patient: ${nextAppointment.patientId.name}`}
                </p>
                <p className="text-sky-700 text-sm mt-1">Reason: {nextAppointment.reason}</p>
                <p className="text-xs text-sky-600 mt-2 font-medium">
                  {new Date(nextAppointment.appointmentDate).toLocaleString()}
                </p>
              </div>
              <span className="px-2 py-1 bg-sky-200 text-sky-800 text-xs font-semibold rounded-full uppercase">
                {nextAppointment.status}
              </span>
            </div>
          ) : (
            <p className="text-slate-400 text-sm py-4">No upcoming confirmed appointments scheduled.</p>
          )}

          <div className="mt-6 flex gap-4">
            <Link 
              to="/appointments" 
              className="flex items-center gap-2 text-sky-600 hover:text-sky-700 text-sm font-bold transition-all"
            >
              <span>View all appointments</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Tasks</h3>
            <p className="text-slate-500 text-sm mb-6">
              Schedule or coordinate new bookings for medical consultations.
            </p>
          </div>
          
          {user?.role === 'patient' ? (
            <Link 
              to="/appointments"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-md transition-all text-sm"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Book Appointment</span>
            </Link>
          ) : (
            <Link 
              to="/appointments"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold shadow-md transition-all text-sm"
            >
              <Calendar className="w-5 h-5" />
              <span>Manage Appointments</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
