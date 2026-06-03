import React, { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, Plus, Save, Loader2, X, Trash2 } from 'lucide-react';
import { Patient, MedicalInfo, Appointment } from '../types';
import { cn } from '../utils/cn';
import useAppointmentStore from '../stores/useAppointmentStore';

interface Props {
  patient: Patient;
  role: 'doctor' | 'receptionist';
  onBack: () => void;
  onUpdate: (id: string, data: any) => Promise<void>;
}

interface PrescriptionItem {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
}

const getAge = (dateOfBirth: string): number => {
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
};

const EMPTY_MEDICAL: MedicalInfo = {
  diagnosisTags: [],
  treatmentTags: [],
  prescription: '',
  additionalInfo: '',
};

const labelClass = 'block text-xs font-medium text-slate-400 mb-1.5';
const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all';
const textareaClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all resize-none';

// Parse prescription text into structured items
const parsePrescription = (prescription: string): PrescriptionItem[] => {
  if (!prescription?.trim()) return [];
  try {
    const parsed = JSON.parse(prescription);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // fallback: treat as plain text, show as single item
    if (prescription.trim()) {
      return [{ medicineName: prescription.trim(), dosage: '', frequency: '', duration: '' }];
    }
  }
  return [];
};

const serializePrescription = (items: PrescriptionItem[]): string => {
  if (items.length === 0) return '';
  return JSON.stringify(items);
};

export const PatientDetailPage: React.FC<Props> = ({ patient, role, onBack, onUpdate }) => {
  const isDoctor = role === 'doctor';

  // ── Personal info state ──
  const [editedName, setEditedName] = useState(patient.name);
  const [editedPhone, setEditedPhone] = useState(patient.phone);
  const [editedGender, setEditedGender] = useState<'male' | 'female' | 'other'>(patient.gender);
  const [editedAddress, setEditedAddress] = useState(patient.address || '');
  const [editedAdditionalPersonal, setEditedAdditionalPersonal] = useState('');

  // ── Medical info state ──
  const [medical, setMedical] = useState<MedicalInfo>(patient.medicalInfo || EMPTY_MEDICAL);
  const [diagnosisText, setDiagnosisText] = useState('');
  const [treatmentText, setTreatmentText] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // ── Prescription state ──
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [newMedicine, setNewMedicine] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newFrequency, setNewFrequency] = useState('');
  const [newDuration, setNewDuration] = useState('');

  const [saving, setSaving] = useState(false);

  // ── Assigned Doctor lookup ──
  const { appointments } = useAppointmentStore();
  const assignedDoctor = useMemo(() => {
    const appt = appointments.find(
      (a: Appointment) =>
        a.patientId?._id === patient._id &&
        (a.status === 'pending' || a.status === 'confirmed')
    );
    return appt?.doctorId?.name ? `Dr. ${appt.doctorId.name}` : '—';
  }, [appointments, patient._id]);

  // Reset when patient changes
  useEffect(() => {
    setEditedName(patient.name);
    setEditedPhone(patient.phone);
    setEditedGender(patient.gender);
    setEditedAddress(patient.address || '');
    setEditedAdditionalPersonal('');

    const med = patient.medicalInfo || EMPTY_MEDICAL;
    setMedical(med);
    setDiagnosisText((med.diagnosisTags || []).join(', '));
    setTreatmentText((med.treatmentTags || []).join(', '));
    setAdditionalNotes(med.additionalInfo || '');
    setPrescriptionItems(parsePrescription(med.prescription || ''));

    setNewMedicine('');
    setNewDosage('');
    setNewFrequency('');
    setNewDuration('');
  }, [patient]);

  const addPrescriptionItem = () => {
    if (!newMedicine.trim()) return;
    setPrescriptionItems((prev) => [
      ...prev,
      {
        medicineName: newMedicine.trim(),
        dosage: newDosage.trim(),
        frequency: newFrequency.trim(),
        duration: newDuration.trim(),
      },
    ]);
    setNewMedicine('');
    setNewDosage('');
    setNewFrequency('');
    setNewDuration('');
  };

  const removePrescriptionItem = (idx: number) => {
    setPrescriptionItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const diagnosisTags = diagnosisText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const treatmentTags = treatmentText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload: any = {
        name: editedName.trim(),
        phone: editedPhone.trim(),
        gender: editedGender,
        address: editedAddress.trim(),
        medicalInfo: {
          diagnosisTags,
          treatmentTags,
          prescription: serializePrescription(prescriptionItems),
          additionalInfo: additionalNotes.trim(),
        },
      };

      await onUpdate(patient._id, payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-hidden flex flex-col bg-slate-50/50">
      {/* ─── Top Header ─── */}
      <div className="flex items-center justify-between px-6 sm:px-8 py-5 bg-white border-b border-slate-100 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm font-semibold">Back</span>
        </button>

        <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Patient Details</h2>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save & Update
        </button>
      </div>

      {/* ─── Scrollable Content ─── */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-6 sm:px-8 py-6 space-y-6">
        {/* ══════════════════════════════════════════
            PATIENT INFORMATION SECTION
           ══════════════════════════════════════════ */}
        <section>
          <h3 className="text-base font-extrabold text-slate-800 mb-4">Patient Information</h3>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 sm:p-6">
            {/* Patient ID */}
            <p className="text-sm font-bold text-slate-700 mb-5">
              ID: <span className="text-slate-500 font-mono">{patient.patientId?.replace('PAT-', '') || patient.patientId}</span>
            </p>

            {/* Form Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-4">
              {/* Full Name */}
              <div>
                <label className={labelClass}>Full Name</label>
                <input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Full Name"
                  className={inputClass}
                />
              </div>

              {/* Age */}
              <div>
                <label className={labelClass}>Age</label>
                <input
                  value={getAge(patient.dateOfBirth)}
                  readOnly
                  className={cn(inputClass, 'bg-slate-50 cursor-default')}
                />
              </div>

              {/* Gender */}
              <div>
                <label className={labelClass}>Gender</label>
                <select
                  value={editedGender}
                  onChange={(e) => setEditedGender(e.target.value as any)}
                  className={inputClass}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Phone Number */}
              <div>
                <label className={labelClass}>Phone Number</label>
                <input
                  value={editedPhone}
                  onChange={(e) => setEditedPhone(e.target.value)}
                  placeholder="Phone Number"
                  className={inputClass}
                />
              </div>

              {/* Assigned Doctor */}
              <div className="sm:col-span-2">
                <label className={labelClass}>Assigned Doctor</label>
                <input
                  value={assignedDoctor}
                  readOnly
                  className={cn(inputClass, 'bg-slate-50 cursor-default')}
                />
              </div>

              {/* Address */}
              <div>
                <label className={labelClass}>Address (Optional)</label>
                <input
                  value={editedAddress}
                  onChange={(e) => setEditedAddress(e.target.value)}
                  placeholder="Address"
                  className={inputClass}
                />
              </div>

              {/* Additional Information */}
              <div className="sm:col-span-2">
                <label className={labelClass}>Additional Information (Optional)</label>
                <input
                  value={editedAdditionalPersonal}
                  onChange={(e) => setEditedAdditionalPersonal(e.target.value)}
                  placeholder="Additional Information"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            MEDICAL INFORMATION SECTION
           ══════════════════════════════════════════ */}
        <section>
          <h3 className="text-base font-extrabold text-slate-800 mb-4">Medical Information</h3>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 sm:p-6 space-y-5">
            {/* Diagnosed + Treatment Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Diagnosed</label>
                <textarea
                  value={diagnosisText}
                  onChange={(e) => setDiagnosisText(e.target.value)}
                  placeholder="Enter diagnosis (comma-separated)..."
                  rows={4}
                  className={textareaClass}
                />
              </div>
              <div>
                <label className={labelClass}>Treatment</label>
                <textarea
                  value={treatmentText}
                  onChange={(e) => setTreatmentText(e.target.value)}
                  placeholder="Enter treatment (comma-separated)..."
                  rows={4}
                  className={textareaClass}
                />
              </div>
            </div>

            {/* Treatment + Additional Notes Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Treatment</label>
                <textarea
                  value={treatmentText}
                  onChange={(e) => setTreatmentText(e.target.value)}
                  placeholder="Treatment details..."
                  rows={4}
                  className={textareaClass}
                />
              </div>
              <div>
                <label className={labelClass}>Additional Notes (Optional)</label>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Additional notes..."
                  rows={4}
                  className={textareaClass}
                />
              </div>
            </div>

            {/* ── Prescription Section ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className={cn(labelClass, 'mb-0')}>Prescription</label>
                <button
                  type="button"
                  onClick={addPrescriptionItem}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>

              {/* Existing prescription items */}
              {prescriptionItems.length > 0 && (
                <div className="space-y-2 mb-4">
                  {prescriptionItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-slate-50 rounded-lg px-3.5 py-2.5 text-sm border border-slate-100"
                    >
                      <span className="font-semibold text-slate-700 flex-1 min-w-0 truncate">
                        {item.medicineName}
                      </span>
                      {item.dosage && (
                        <span className="text-slate-500 text-xs shrink-0">{item.dosage}</span>
                      )}
                      {item.frequency && (
                        <span className="text-slate-500 text-xs shrink-0">{item.frequency}</span>
                      )}
                      {item.duration && (
                        <span className="text-slate-500 text-xs shrink-0">{item.duration}</span>
                      )}
                      <button
                        onClick={() => removePrescriptionItem(idx)}
                        className="text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* New prescription input row */}
              <div className="space-y-3">
                <input
                  value={newMedicine}
                  onChange={(e) => setNewMedicine(e.target.value)}
                  placeholder="Medicine Name"
                  className={inputClass}
                />

                <div className="grid grid-cols-3 gap-3">
                  <input
                    value={newDosage}
                    onChange={(e) => setNewDosage(e.target.value)}
                    placeholder="Dosage (e.g. 100mg)"
                    className={inputClass}
                  />
                  <input
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value)}
                    placeholder="Frequency (e.g. 3x/day)"
                    className={inputClass}
                  />
                  <input
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    placeholder="Duration (e.g. 4 weeks)"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Total Prescriptions button */}
              {prescriptionItems.length > 0 && (
                <div className="mt-4">
                  <span className="inline-block px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-bold">
                    Total Prescriptions: {prescriptionItems.length}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PatientDetailPage;
