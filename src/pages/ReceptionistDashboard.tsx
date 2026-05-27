import React, { useEffect, useState, useCallback } from 'react';
import usePatientStore from '../stores/usePatientStore';
import useAppointmentStore from '../stores/useAppointmentStore';
import SearchBar from '../components/SearchBar';
import AppointmentModal from '../components/AppointmentModal';
import PatientRegistrationModal from '../components/PatientRegistrationModal';
import { formatDate } from '../utils/format';
import { Stethoscope, UserPlus, CalendarPlus, Users } from 'lucide-react';

export const ReceptionistDashboard: React.FC = () => {
  const { patients, searchResults, fetchPatients, searchPatients, createPatient } = usePatientStore();
  const { appointments, doctorsWithCounts, fetchAppointments, fetchDoctorsWithCounts, createAppointment } = useAppointmentStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);

  // For appointment modal patient search
  const [modalPatientSearch, setModalPatientSearch] = useState<typeof searchResults>([]);

  useEffect(() => {
    fetchPatients();
    fetchAppointments();
    fetchDoctorsWithCounts();
  }, []);

  // Debounced search for main table
  useEffect(() => {
    const timer = setTimeout(() => {
      searchPatients(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleModalPatientSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setModalPatientSearch([]);
      return;
    }
    const q = query.toLowerCase();
    const filtered = patients.filter(
      (p) => p.name.toLowerCase().includes(q) || p.phone.includes(q) || p.patientId.toLowerCase().includes(q)
    );
    setModalPatientSearch(filtered);
  }, [patients]);

  const handleCreateAppointment = async (data: any) => {
    await createAppointment(data);
    fetchAppointments();
  };

  const handleCreatePatient = async (data: any) => {
    await createPatient(data);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Receptionist Dashboard</h2>
          <p className="text-slate-500 text-sm">Manage patients and appointments</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowPatientModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all">
            <UserPlus className="w-4 h-4" />
            <span>Register Patient</span>
          </button>
          <button onClick={() => setShowAppointmentModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-md transition-all">
            <CalendarPlus className="w-4 h-4" />
            <span>New Appointment</span>
          </button>
        </div>
      </div>

      {/* Doctor Availability */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-indigo-600" />
          Available Doctors
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctorsWithCounts.length === 0 ? (
            <p className="text-slate-400 text-sm col-span-full">No doctors registered yet.</p>
          ) : (
            doctorsWithCounts.map((doc) => (
              <div key={doc._id || doc.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <Stethoscope className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">Dr. {doc.name}</p>
                  <p className="text-xs text-slate-500">{doc.specialization || 'General'}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      doc.activePatientCount === 0
                        ? 'bg-emerald-50 text-emerald-700'
                        : doc.activePatientCount <= 5
                        ? 'bg-sky-50 text-sky-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {doc.activePatientCount} active patients
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Patient List */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" />
            Patients ({searchResults.length})
          </h3>
          <div className="w-full md:w-80">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          {searchResults.length === 0 ? (
            <p className="text-slate-400 text-center py-8">
              {searchQuery ? 'No patients match your search.' : 'No patients registered yet.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <th className="text-left px-6 py-3 font-semibold">Patient ID</th>
                    <th className="text-left px-6 py-3 font-semibold">Name</th>
                    <th className="text-left px-6 py-3 font-semibold">Phone</th>
                    <th className="text-left px-6 py-3 font-semibold">Gender</th>
                    <th className="text-left px-6 py-3 font-semibold">Date of Birth</th>
                    <th className="text-left px-6 py-3 font-semibold">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {searchResults.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-mono font-semibold">{p.patientId}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">{p.name}</td>
                      <td className="px-6 py-4 text-slate-600">{p.phone}</td>
                      <td className="px-6 py-4 text-slate-600 capitalize">{p.gender}</td>
                      <td className="px-6 py-4 text-slate-600">{new Date(p.dateOfBirth).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-slate-600">{p.email || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Appointment List */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Appointments</h3>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          {appointments.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No appointments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <th className="text-left px-6 py-3 font-semibold">Patient</th>
                    <th className="text-left px-6 py-3 font-semibold">Doctor</th>
                    <th className="text-left px-6 py-3 font-semibold">Date</th>
                    <th className="text-left px-6 py-3 font-semibold">Reason</th>
                    <th className="text-left px-6 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {appointments.slice(0, 20).map((a) => (
                    <tr key={a._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-800">{a.patientId?.name}</p>
                        <p className="text-xs text-slate-400">{a.patientId?.patientId}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-600">Dr. {a.doctorId?.name}</td>
                      <td className="px-6 py-4 text-slate-600 text-xs">{formatDate(a.appointmentDate)}</td>
                      <td className="px-6 py-4 text-slate-600">{a.reason}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                          a.status === 'confirmed' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                          a.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          a.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                          'bg-yellow-50 text-yellow-700 border border-yellow-100'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AppointmentModal
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        onSubmit={handleCreateAppointment}
        patients={modalPatientSearch}
        doctors={doctorsWithCounts}
        onSearchPatient={handleModalPatientSearch}
        onRegisterNewPatient={() => {
          setShowAppointmentModal(false);
          setShowPatientModal(true);
        }}
      />

      <PatientRegistrationModal
        isOpen={showPatientModal}
        onClose={() => setShowPatientModal(false)}
        onSubmit={handleCreatePatient}
      />
    </div>
  );
};

export default ReceptionistDashboard;
