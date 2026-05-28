import React, { useEffect, useState } from 'react';
import useAdminStore from '../../stores/useAdminStore';
import StaffRegistrationModal from '../../components/StaffRegistrationModal';
import EditStaffModal from '../../components/EditStaffModal';
import { Users, Stethoscope, UserCheck, Calendar, UserPlus, Pencil } from 'lucide-react';
import { User } from '../../types';

export const AdminDashboard: React.FC = () => {
  const { staff, stats, loading, fetchStaff, fetchStats, registerStaff, updateStaff } = useAdminStore();
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);

  useEffect(() => {
    fetchStaff();
    fetchStats();
  }, []);

  const handleRegisterStaff = async (data: any) => {
    await registerStaff(data);
    fetchStats(); // Refresh stats after adding staff
  };

  const handleUpdateStaff = async (id: string, data: any) => {
    await updateStaff(id, data);
  };

  const openEditModal = (user: User) => {
    setSelectedStaff(user);
    setShowEditModal(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Admin Dashboard</h2>
          <p className="text-slate-500 text-sm">Manage clinic staff and monitor system activity</p>
        </div>
        <button onClick={() => setShowRegisterModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-md transition-all">
          <UserPlus className="w-4 h-4" />
          <span>Register Staff</span>
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase">Doctors</p>
              <p className="text-2xl font-bold text-slate-800">{stats.totalDoctors}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase">Receptionists</p>
              <p className="text-2xl font-bold text-slate-800">{stats.totalReceptionists}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-sky-50 text-sky-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase">Patients</p>
              <p className="text-2xl font-bold text-slate-800">{stats.totalPatients}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase">Appointments</p>
              <p className="text-2xl font-bold text-slate-800">{stats.totalAppointments}</p>
            </div>
          </div>
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Staff Members</h3>
        </div>

        {loading ? (
          <p className="text-slate-400 text-center py-8">Loading staff...</p>
        ) : staff.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No staff members registered yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <th className="text-left px-6 py-3 font-semibold">Name</th>
                  <th className="text-left px-6 py-3 font-semibold">Email</th>
                  <th className="text-left px-6 py-3 font-semibold">Role</th>
                  <th className="text-left px-6 py-3 font-semibold">Specialization</th>
                  <th className="text-left px-6 py-3 font-semibold">Phone</th>
                  <th className="text-center px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {staff.map((member) => (
                  <tr key={member._id || member.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{member.name}</td>
                    <td className="px-6 py-4 text-slate-600">{member.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${member.role === 'doctor'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{member.specialization || '—'}</td>
                    <td className="px-6 py-4 text-slate-600">{member.phone || '—'}</td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => openEditModal(member)}
                        className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors inline-flex items-center justify-center"
                        title="Edit Staff"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Staff Registration Modal */}
      <StaffRegistrationModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSubmit={handleRegisterStaff}
      />

      {/* Edit Staff Modal */}
      <EditStaffModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedStaff(null);
        }}
        onSubmit={handleUpdateStaff}
        initialData={selectedStaff}
      />
    </div>
  );
};

export default AdminDashboard;
