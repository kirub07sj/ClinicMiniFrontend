import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import usePatientStore from '../../stores/usePatientStore';
import useAppointmentStore from '../../stores/useAppointmentStore';
import SearchBar from '../../components/SearchBar';
import AppointmentModal from '../../components/AppointmentModal';
import PageTransition from '../../components/ui/PageTransition';
import { formatDate } from '../../utils/format';
import { Stethoscope, CalendarPlus, Users, Loader2 } from 'lucide-react';
import { Patient, DoctorWithCount, Appointment } from '../../types';

export const ReceptionistDashboard: React.FC = () => {
  const { patients, searchResults, fetchPatients, searchPatients, createPatient, loading: patientsLoading } = usePatientStore();
  const { appointments, doctorsWithCounts, fetchAppointments, fetchDoctorsWithCounts, createAppointment, loading: appointmentsLoading } = useAppointmentStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

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
      (p: Patient) => p.name.toLowerCase().includes(q) || p.phone.includes(q) || p.patientId.toLowerCase().includes(q)
    );
    setModalPatientSearch(filtered);
  }, [patients]);

  const handleCreateAppointment = async (appointmentData: any, patientData?: any) => {
    try {
      let finalPatientId = appointmentData.patientId;
      if (patientData) {
        const newPatient = await createPatient(patientData);
        finalPatientId = newPatient._id;
      }
      await createAppointment({ ...appointmentData, patientId: finalPatientId });
      fetchAppointments();
    } catch (err) {
      throw err;
    }
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Receptionist Dashboard</h2>
            <p className="text-slate-500 text-sm mt-1">Manage patients and appointments efficiently</p>
          </div>
          <div className="flex gap-3">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAppointmentModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-md transition-colors"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>New Appointment</span>
            </motion.button>
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
              doctorsWithCounts.map((doc: DoctorWithCount, i: number) => (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={doc._id || doc.id} 
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow group"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                    <Stethoscope className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">Dr. {doc.name}</p>
                    <p className="text-xs text-slate-500">{doc.specialization || 'General'}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        doc.activePatientCount === 0
                          ? 'bg-emerald-50 text-emerald-700'
                          : doc.activePatientCount <= 5
                          ? 'bg-sky-50 text-sky-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {doc.activePatientCount} active
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Patient List */}
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-600" />
              Patients
            </h3>
            <div className="w-full md:w-80">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {patientsLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-3 text-sky-600" />
                <p className="text-sm font-medium">Loading patients...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <p className="text-slate-400 text-center py-16 font-medium">
                {searchQuery ? 'No patients match your search.' : 'No patients registered yet.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="text-left px-6 py-4 font-semibold">Patient ID</th>
                      <th className="text-left px-6 py-4 font-semibold">Name</th>
                      <th className="text-left px-6 py-4 font-semibold">Phone</th>
                      <th className="text-left px-6 py-4 font-semibold">Gender</th>
                      <th className="text-left px-6 py-4 font-semibold">Date of Birth</th>
                      <th className="text-left px-6 py-4 font-semibold">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {searchResults.map((p: Patient) => (
                      <tr key={p._id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-mono font-bold group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-200">{p.patientId}</span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">{p.name}</td>
                        <td className="px-6 py-4 text-slate-600 font-medium">{p.phone}</td>
                        <td className="px-6 py-4 text-slate-600 capitalize">{p.gender}</td>
                        <td className="px-6 py-4 text-slate-600">{new Date(p.dateOfBirth).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-slate-500">{p.email || '—'}</td>
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
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {appointmentsLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-3 text-sky-600" />
                <p className="text-sm font-medium">Loading appointments...</p>
              </div>
            ) : appointments.length === 0 ? (
              <p className="text-slate-400 text-center py-16 font-medium">No appointments yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="text-left px-6 py-4 font-semibold">Patient</th>
                      <th className="text-left px-6 py-4 font-semibold">Doctor</th>
                      <th className="text-left px-6 py-4 font-semibold">Date</th>
                      <th className="text-left px-6 py-4 font-semibold">Reason</th>
                      <th className="text-left px-6 py-4 font-semibold">Status</th>
                      <th className="text-left px-6 py-4 font-semibold">Created By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {appointments.slice(0, 20).map((a: Appointment) => (
                      <tr key={a._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{a.patientId?.name}</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5 font-medium">{a.patientId?.patientId}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-semibold">Dr. {a.doctorId?.name}</td>
                        <td className="px-6 py-4 text-slate-600 font-medium text-xs">{formatDate(a.appointmentDate)}</td>
                        <td className="px-6 py-4 text-slate-600">{a.reason}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            a.status === 'confirmed' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                            a.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            a.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                            'bg-yellow-50 text-yellow-700 border border-yellow-100'
                          }`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-xs font-medium">
                          {a.createdBy?.name || '—'}
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
        />
      </div>
    </PageTransition>
  );
};

export default ReceptionistDashboard;
