import React, { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, Plus, Save, Loader2, X, ChevronRight, CheckCircle, Lock, ChevronDown, ChevronUp } from 'lucide-react';
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
const cardLabelClass = 'block text-sm font-bold text-slate-800 mb-2';
const fieldClass =
  'w-full rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 shadow-inner focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-300 transition-all';
const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all';

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
  const [diagnosisTags, setDiagnosisTags] = useState<string[]>([]);
  const [treatmentTags, setTreatmentTags] = useState<string[]>([]);
  const [diagnosisInput, setDiagnosisInput] = useState('');
  const [treatmentInput, setTreatmentInput] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // ── Prescription state ──
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [newMedicine, setNewMedicine] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newFrequency, setNewFrequency] = useState('');
  const [newDuration, setNewDuration] = useState('');

  const [saving, setSaving] = useState(false);

  // ── Active appointment + treatment gating ──
  const { appointments, updateAppointment } = useAppointmentStore();
  const activeAppointment = useMemo(
    () =>
      appointments.find(
        (a: Appointment) =>
          a.patientId?._id === patient._id &&
          (a.status === 'pending' || a.status === 'confirmed')
      ),
    [appointments, patient._id]
  );
  const assignedDoctor = activeAppointment?.doctorId?.name
    ? `Dr. ${activeAppointment.doctorId.name}`
    : '—';

  // A confirmed appointment means treatment is already underway.
  const [started, setStarted] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  // Medical fields are editable once treatment has started (doctor only).
  const medicalLocked = isDoctor && !started && activeAppointment?.status !== 'confirmed';

  // Reset when patient changes
  useEffect(() => {
    setEditedName(patient.name);
    setEditedPhone(patient.phone);
    setEditedGender(patient.gender);
    setEditedAddress(patient.address || '');
    setEditedAdditionalPersonal('');

    const med = patient.medicalInfo || EMPTY_MEDICAL;
    setDiagnosisTags(med.diagnosisTags || []);
    setTreatmentTags(med.treatmentTags || []);
    setDiagnosisInput('');
    setTreatmentInput('');
    setAdditionalNotes(med.additionalInfo || '');
    setPrescriptionItems(parsePrescription(med.prescription || ''));

    setNewMedicine('');
    setNewDosage('');
    setNewFrequency('');
    setNewDuration('');
    setStarted(false);
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

  // Commit the current text in a tag input as a chip (on Enter or comma).
  const addTag = (
    raw: string,
    setTags: React.Dispatch<React.SetStateAction<string[]>>,
    clearInput: () => void
  ) => {
    const value = raw.trim().replace(/,$/, '').trim();
    if (!value) return;
    setTags((prev) => (prev.includes(value) ? prev : [...prev, value]));
    clearInput();
  };

  const buildPayload = () => {
    const medicalInfo = {
      diagnosisTags,
      treatmentTags,
      prescription: serializePrescription(prescriptionItems),
      additionalInfo: additionalNotes.trim(),
    };

    // Doctors only update medical info — personal fields stay untouched.
    if (isDoctor) return { medicalInfo };

    // Receptionists may only update personal fields (backend rejects medicalInfo).
    return {
      name: editedName.trim(),
      phone: editedPhone.trim(),
      gender: editedGender,
      address: editedAddress.trim(),
    };
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(patient._id, buildPayload());
    } finally {
      setSaving(false);
    }
  };

  // Doctor begins the visit — unlocks the medical fields and moves the
  // appointment into "In Treatment" (confirmed) so it stays in sync with
  // the Appointments tab.
  const handleStartTreatment = async () => {
    setStarted(true);
    if (activeAppointment && activeAppointment.status !== 'confirmed') {
      setUpdatingStatus(true);
      try {
        await updateAppointment(activeAppointment._id, { status: 'confirmed' });
      } finally {
        setUpdatingStatus(false);
      }
    }
  };

  // Doctor finishes the visit — persists the medical info and marks the
  // appointment completed.
  const handleComplete = async () => {
    setSaving(true);
    try {
      const payload: any = buildPayload();
      
      // Save current medical info to history, then clear current medical info
      if (isDoctor) {
        const historyEntry = {
          ...payload.medicalInfo,
          visitDate: new Date().toISOString()
        };
        payload.history = [...(patient.history || []), historyEntry];
        payload.medicalInfo = EMPTY_MEDICAL;
      }

      await onUpdate(patient._id, payload);
      
      if (activeAppointment) {
        await updateAppointment(activeAppointment._id, { status: 'completed' });
      }
      setStarted(false);
    } finally {
      setSaving(false);
    }
  };

  const actionButtons = isDoctor ? (
    medicalLocked ? (
      <button
        onClick={handleStartTreatment}
        disabled={updatingStatus}
        className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all disabled:opacity-50"
      >
        {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
        Start Treatment
      </button>
    ) : (
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-bold shadow-sm transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </button>
        <button
          onClick={handleComplete}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Complete
        </button>
      </div>
    )
  ) : (
    <button
      onClick={handleSave}
      disabled={saving}
      className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all disabled:opacity-50"
    >
      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      Save & Update
    </button>
  );

  const [expandedHistory, setExpandedHistory] = useState<Set<number>>(new Set());

  const toggleHistory = (index: number) => {
    const newExpanded = new Set(expandedHistory);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedHistory(newExpanded);
  };

  return (
    <div className="h-full overflow-hidden flex flex-col bg-slate-100 fixed top-0 w-[80%] -ml-[40px]">
      {/* ─── Top Row: Back + title ─── */}
      <div className="flex items-center justify-between px-6 sm:px-10 pt-6 pb-2 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-700 hover:text-slate-900 transition-colors group"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-full bg-white shadow-sm border border-slate-100 group-hover:-translate-x-0.5 transition-transform">
            <ArrowLeft className="w-4 h-4" />
          </span>
          <span className="text-base font-semibold">Back</span>
        </button>

        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Patient Details</h2>
      </div>

      {/* ─── Section Row: heading + actions ─── */}
      <div className="flex items-center justify-between px-6 sm:px-10 pt-3 pb-4 shrink-0">
        <h3 className="text-lg font-extrabold text-slate-800">Patient Information</h3>
        {actionButtons}
      </div>

      {/* ─── Scrollable Content ─── */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-6 sm:px-10 pb-6 space-y-6">
        {/* ══════════════════════════════════════════
            PATIENT INFORMATION SECTION
           ══════════════════════════════════════════ */}
        <section>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 pb-[2rem] ">
            {/* Patient ID */}
            <p className="text-sm font-bold text-slate-700 mb-5">
              ID: <span className="text-slate-500 font-mono">{patient.patientId?.replace('PAT-', '') || patient.patientId}</span>
            </p>

            {/* Form Grid — left column is one wide field per row; right column
                holds Age+Gender, then Assigned Doctor, then Additional Info. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              {/* Full Name */}
              <div>
                <label className={labelClass}>Full Name</label>
                <input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Full Name"
                  readOnly={isDoctor}
                  className={cn(inputClass, isDoctor && 'bg-slate-50 cursor-default')}
                />
              </div>

              {/* Age + Gender */}
              <div className="grid grid-cols-2 gap-x-5">
                <div>
                  <label className={labelClass}>Age</label>
                  <input
                    value={getAge(patient.dateOfBirth)}
                    readOnly
                    className={cn(inputClass, 'bg-slate-50 cursor-default')}
                  />
                </div>
                <div>
                  <label className={labelClass}>Gender</label>
                  <select
                    value={editedGender}
                    onChange={(e) => setEditedGender(e.target.value as any)}
                    disabled={isDoctor}
                    className={cn(inputClass, isDoctor && 'bg-slate-50 cursor-default appearance-none')}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className={labelClass}>Phone Number</label>
                <input
                  value={editedPhone}
                  onChange={(e) => setEditedPhone(e.target.value)}
                  placeholder="Phone Number"
                  readOnly={isDoctor}
                  className={cn(inputClass, isDoctor && 'bg-slate-50 cursor-default')}
                />
              </div>

              {/* Assigned Doctor */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">Assigned Doctor</label>
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
                  readOnly={isDoctor}
                  className={cn(inputClass, isDoctor && 'bg-slate-50 cursor-default')}
                />
              </div>

              {/* Additional Information */}
              <div>
                <label className={labelClass}>Additional Information (Optional)</label>
                <input
                  value={editedAdditionalPersonal}
                  onChange={(e) => setEditedAdditionalPersonal(e.target.value)}
                  placeholder="Additional Information"
                  readOnly={isDoctor}
                  className={cn(inputClass, isDoctor && 'bg-slate-50 cursor-default')}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            MEDICAL INFORMATION SECTION — doctors only
           ══════════════════════════════════════════ */}
        {isDoctor && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-slate-800">Medical Information</h3>
            {medicalLocked && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-600 text-xs font-semibold">
                <Lock className="w-3.5 h-3.5" />
                Start treatment to edit
              </span>
            )}
          </div>

          <fieldset
            disabled={medicalLocked}
            className={cn(
              'grid grid-cols-1 lg:grid-cols-2 gap-6 transition-opacity',
              medicalLocked && 'opacity-60 pointer-events-none select-none'
            )}
          >
            {/* ─── LEFT CARD: Diagnosed + Prescription ─── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-6 sm:p-7 space-y-6">
              {/* Diagnosed */}
              <div>
                <label className={cardLabelClass}>Diagnosed</label>
                <input
                  value={diagnosisInput}
                  onChange={(e) => setDiagnosisInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addTag(diagnosisInput, setDiagnosisTags, () => setDiagnosisInput(''));
                    }
                  }}
                  onBlur={() => addTag(diagnosisInput, setDiagnosisTags, () => setDiagnosisInput(''))}
                  placeholder="Type a diagnosis and press Enter"
                  className={fieldClass}
                />
                {diagnosisTags.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide mt-3 pb-1">
                    {diagnosisTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 shrink-0 rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => setDiagnosisTags((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Prescription */}
              <div>
                <label className={cardLabelClass}>Prescription</label>

                {/* Added prescription items as chips */}
                {prescriptionItems.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-3 pb-1">
                    {prescriptionItems.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-2 shrink-0 rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600"
                      >
                        <span className="font-semibold text-slate-700">{item.medicineName}</span>
                        {item.dosage && <span className="text-slate-400">{item.dosage}</span>}
                        {item.frequency && <span className="text-slate-400">{item.frequency}</span>}
                        {item.duration && <span className="text-slate-400">{item.duration}</span>}
                        <button
                          type="button"
                          onClick={() => removePrescriptionItem(idx)}
                          className="text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Medicine name + Add */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      value={newMedicine}
                      onChange={(e) => setNewMedicine(e.target.value)}
                      placeholder="Medicine Name"
                      className={fieldClass}
                    />
                    <p className="text-xs text-slate-400 mt-1.5 ml-1">Medicine Name</p>
                  </div>
                  <button
                    type="button"
                    onClick={addPrescriptionItem}
                    className="h-[46px] flex items-center gap-1.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>

                {/* Dosage / Frequency / Duration */}
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <input
                    value={newDosage}
                    onChange={(e) => setNewDosage(e.target.value)}
                    placeholder="Dosage (e.g. 500mg)"
                    className={fieldClass}
                  />
                  <input
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value)}
                    placeholder="Frequency (e.g. 2x/day)"
                    className={fieldClass}
                  />
                  <input
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    placeholder="Duration (e.g. 5 days)"
                    className={fieldClass}
                  />
                </div>

                {prescriptionItems.length > 0 && (
                  <div className="mt-4">
                    <span className="inline-block px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-bold">
                      Total Prescriptions: {prescriptionItems.length}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ─── RIGHT CARD: Treatment + Additional Notes ─── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-6 sm:p-7 flex flex-col">
              {/* Treatment */}
              <div>
                <label className={cardLabelClass}>Treatment</label>
                <input
                  value={treatmentInput}
                  onChange={(e) => setTreatmentInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addTag(treatmentInput, setTreatmentTags, () => setTreatmentInput(''));
                    }
                  }}
                  onBlur={() => addTag(treatmentInput, setTreatmentTags, () => setTreatmentInput(''))}
                  placeholder="Type a treatment and press Enter"
                  className={fieldClass}
                />
                {treatmentTags.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide mt-3 pb-1">
                    {treatmentTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 shrink-0 rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => setTreatmentTags((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Additional Notes */}
              <div className="mt-6 flex-1 flex flex-col">
                <label className={cardLabelClass}>Additional Notes (Optional)</label>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Any additional notes..."
                  className={cn(fieldClass, 'flex-1 min-h-[260px] resize-none')}
                />
              </div>
            </div>
          </fieldset>
        </section>
        )}

        {/* ══════════════════════════════════════════
            MEDICAL HISTORY SECTION
           ══════════════════════════════════════════ */}
        {patient.history && patient.history.length > 0 && (
          <section className="mt-8">
            <h3 className="text-base font-extrabold text-slate-800 mb-4">Medical History</h3>
            <div className="space-y-4">
              {[...patient.history].reverse().map((entry, idx) => {
                const isExpanded = expandedHistory.has(idx);
                const visitDate = new Date(entry.visitDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });
                const pastPrescriptions = parsePrescription(entry.prescription || '');

                return (
                  <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all">
                    <button
                      onClick={() => toggleHistory(idx)}
                      className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                          {patient.history!.length - idx}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-slate-800">Visit on {visitDate}</p>
                          <p className="text-xs text-slate-500">
                            {entry.diagnosisTags?.length || 0} Diagnoses • {pastPrescriptions.length} Prescriptions
                          </p>
                        </div>
                      </div>
                      <div className="text-slate-400">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-5 pt-0 border-t border-slate-100 mt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Diagnosed</p>
                            {entry.diagnosisTags && entry.diagnosisTags.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {entry.diagnosisTags.map((tag, i) => (
                                  <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium border border-slate-200">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500 italic">None</p>
                            )}
                          </div>

                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Treatments</p>
                            {entry.treatmentTags && entry.treatmentTags.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {entry.treatmentTags.map((tag, i) => (
                                  <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium border border-slate-200">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500 italic">None</p>
                            )}
                          </div>

                          <div className="md:col-span-2">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Prescriptions</p>
                            {pastPrescriptions.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {pastPrescriptions.map((item, i) => (
                                  <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="font-bold text-slate-700 text-sm">{item.medicineName}</p>
                                    <div className="text-xs text-slate-500 mt-1 space-x-2">
                                      {item.dosage && <span>{item.dosage}</span>}
                                      {item.frequency && <span>• {item.frequency}</span>}
                                      {item.duration && <span>• {item.duration}</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500 italic">None</p>
                            )}
                          </div>

                          {entry.additionalInfo && (
                            <div className="md:col-span-2">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Additional Notes</p>
                              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap">
                                {entry.additionalInfo}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default PatientDetailPage;
