'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { NIGERIA_STATES, lgasForState } from '@/lib/nigeria-locations';
import {
  CUSTOMER_TITLES,
  EMPLOYMENT_STATUSES,
  GENDERS,
  INCOME_BANDS,
  MARITAL_STATUSES,
  REGISTRATION_STEP_TITLES,
  calculateAge,
  showsEmployerFields,
  showsEmploymentDate,
} from '@/lib/customer-registration-options';

export function CustomerRegistrationWizard() {
  const router = useRouter();
  const photoRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const [title, setTitle] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('SINGLE');
  const [gender, setGender] = useState('MALE');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [state, setState] = useState('Plateau');
  const [lga, setLga] = useState('');
  const [city, setCity] = useState('Jos');
  const [bvn, setBvn] = useState('');
  const [nin, setNin] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('UNEMPLOYED');
  const [employmentStatusNote, setEmploymentStatusNote] = useState('');
  const [employmentStartDate, setEmploymentStartDate] = useState('');
  const [incomeBand, setIncomeBand] = useState('');
  const [occupation, setOccupation] = useState('');
  const [employer, setEmployer] = useState('');
  const [employerPhone, setEmployerPhone] = useState('');
  const [employerEmail, setEmployerEmail] = useState('');
  const [employerAddress, setEmployerAddress] = useState('');
  const [natureOfBusiness, setNatureOfBusiness] = useState('');
  const [officeNumber, setOfficeNumber] = useState('');
  const [officePhone, setOfficePhone] = useState('');
  const [officeState, setOfficeState] = useState('');
  const [officeLga, setOfficeLga] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const age = useMemo(() => (dob ? calculateAge(dob) : null), [dob]);
  const residentialLgas = useMemo(() => lgasForState(state), [state]);
  const officeLgas = useMemo(() => lgasForState(officeState), [officeState]);
  const employerVisible = showsEmployerFields(employmentStatus);

  const onPhotoChange = useCallback((file: File | null) => {
    setPhotoFile(file);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(file ? URL.createObjectURL(file) : '');
  }, [photoPreview]);

  function validateStep(): string | null {
    switch (step) {
      case 0:
        if (!firstName.trim() || !lastName.trim()) return 'First name and surname are required';
        if (!dob) return 'Date of birth is required';
        if (age != null && age < 18) return 'Member must be at least 18 years old';
        return null;
      case 1:
        if (!phone.trim()) return 'Phone number is required';
        if (!address.trim() || !city.trim() || !state.trim()) return 'Complete residential address';
        return null;
      case 2:
        if (bvn.length !== 11) return 'BVN must be 11 digits';
        if (nin.length !== 11) return 'NIN must be 11 digits';
        return null;
      case 3:
        if (employmentStatus === 'OTHER' && !employmentStatusNote.trim()) {
          return 'Please specify employment status';
        }
        return null;
      case 4:
        if (!photoFile) return 'Member photo is required';
        return null;
      case 5:
        if (pin.length < 4 || pin.length > 6) return 'PIN must be 4–6 digits';
        if (pin !== confirmPin) return 'PINs do not match';
        return null;
      default:
        return null;
    }
  }

  function next() {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    if (step < REGISTRATION_STEP_TITLES.length - 1) {
      setStep((s) => s + 1);
    } else {
      void submit();
    }
  }

  async function submit() {
    setLoading(true);
    setError('');
    try {
      const form = new FormData();
      if (title) form.append('title', title);
      form.append('firstName', firstName.trim());
      form.append('lastName', lastName.trim());
      if (middleName.trim()) form.append('middleName', middleName.trim());
      form.append('maritalStatus', maritalStatus);
      form.append('dateOfBirth', dob);
      form.append('gender', gender);
      form.append('phone', phone.trim());
      if (alternatePhone.trim()) form.append('alternatePhone', alternatePhone.trim());
      if (email.trim()) form.append('email', email.trim());
      form.append('bvn', bvn);
      form.append('nin', nin);
      form.append('address', address.trim());
      if (lga) form.append('lga', lga);
      form.append('city', city.trim());
      form.append('state', state);
      form.append('employmentStatus', employmentStatus);
      if (employmentStatusNote.trim()) form.append('employmentStatusNote', employmentStatusNote.trim());
      if (employmentStartDate) form.append('employmentStartDate', employmentStartDate);
      if (incomeBand) form.append('incomeBand', incomeBand);
      if (occupation.trim()) form.append('occupation', occupation.trim());
      if (employer.trim()) form.append('employer', employer.trim());
      if (employerPhone.trim()) form.append('employerPhone', employerPhone.trim());
      if (employerEmail.trim()) form.append('employerEmail', employerEmail.trim());
      if (employerAddress.trim()) form.append('employerAddress', employerAddress.trim());
      if (natureOfBusiness.trim()) form.append('natureOfBusiness', natureOfBusiness.trim());
      if (officeNumber.trim()) form.append('officeNumber', officeNumber.trim());
      if (officePhone.trim()) form.append('officePhone', officePhone.trim());
      if (officeState) form.append('officeState', officeState);
      if (officeLga) form.append('officeLga', officeLga);
      form.append('pin', pin);
      if (photoFile) form.append('customerPhoto', photoFile);

      const res = await api.post<{ success: boolean; data: { id: string; phone: string } }>(
        '/teller/customers',
        form,
      );
      router.push(`/teller/customers/${res.data.id}`);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-3xl p-6">
      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <p className="text-sm text-gray-500">
        Step {step + 1} of {REGISTRATION_STEP_TITLES.length}: {REGISTRATION_STEP_TITLES[step]}
      </p>
      <div className="mb-6 mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full bg-brand-600 transition-all"
          style={{ width: `${((step + 1) / REGISTRATION_STEP_TITLES.length) * 100}%` }}
        />
      </div>

      {step === 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Select name="title" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} options={[
            { value: '', label: 'Select title' },
            ...CUSTOMER_TITLES.map((t) => ({ value: t.value, label: t.label })),
          ]} />
          <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          <Input label="Surname" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          <Input label="Other name" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
          <Select label="Marital status" value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} options={MARITAL_STATUSES.map((m) => ({ value: m.value, label: m.label }))} />
          <Select label="Gender" value={gender} onChange={(e) => setGender(e.target.value)} options={GENDERS.map((g) => ({ value: g.value, label: g.label }))} />
          <Input label="Date of birth" type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
          <Input label="Age" value={age != null ? String(age) : ''} readOnly placeholder="Auto-calculated" />
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <Input label="Alternate phone" value={alternatePhone} onChange={(e) => setAlternatePhone(e.target.value)} />
          <Input label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="md:col-span-2" />
          <Input label="Street / residential address" value={address} onChange={(e) => setAddress(e.target.value)} className="md:col-span-2" required />
          <Select label="State" value={state} onChange={(e) => { setState(e.target.value); setLga(''); }} options={NIGERIA_STATES.map((s) => ({ value: s, label: s }))} required />
          <Select label="Local government area" value={lga} onChange={(e) => setLga(e.target.value)} options={[
            { value: '', label: 'Select LGA' },
            ...residentialLgas.map((l) => ({ value: l, label: l })),
          ]} />
          <Input label="City / town" value={city} onChange={(e) => setCity(e.target.value)} required />
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="BVN (11 digits)" value={bvn} onChange={(e) => setBvn(e.target.value.replace(/\D/g, '').slice(0, 11))} maxLength={11} required />
          <Input label="NIN (11 digits)" value={nin} onChange={(e) => setNin(e.target.value.replace(/\D/g, '').slice(0, 11))} maxLength={11} required />
        </div>
      )}

      {step === 3 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Select label="Employment status" value={employmentStatus} onChange={(e) => setEmploymentStatus(e.target.value)} options={EMPLOYMENT_STATUSES.map((e) => ({ value: e.value, label: e.label }))} className="md:col-span-2" />
          {employmentStatus === 'OTHER' && (
            <Input label="Specify employment status" value={employmentStatusNote} onChange={(e) => setEmploymentStatusNote(e.target.value)} className="md:col-span-2" />
          )}
          {showsEmploymentDate(employmentStatus) && (
            <Input label="Date of employment" type="date" value={employmentStartDate} onChange={(e) => setEmploymentStartDate(e.target.value)} />
          )}
          <Select label="Annual salary / expected income" value={incomeBand} onChange={(e) => setIncomeBand(e.target.value)} options={[
            { value: '', label: 'Select range' },
            ...INCOME_BANDS.map((b) => ({ value: b.value, label: b.label })),
          ]} className="md:col-span-2" />
          {employerVisible && (
            <>
              <Input label="Employer / business name" value={employer} onChange={(e) => setEmployer(e.target.value)} />
              <Input label="Nature of business" value={natureOfBusiness} onChange={(e) => setNatureOfBusiness(e.target.value)} />
              <Input label="Employer phone" value={employerPhone} onChange={(e) => setEmployerPhone(e.target.value)} />
              <Input label="Employer email" type="email" value={employerEmail} onChange={(e) => setEmployerEmail(e.target.value)} />
              <Input label="Employer address" value={employerAddress} onChange={(e) => setEmployerAddress(e.target.value)} className="md:col-span-2" />
              <Input label="Occupation / job title" value={occupation} onChange={(e) => setOccupation(e.target.value)} />
              <Input label="Office number" value={officeNumber} onChange={(e) => setOfficeNumber(e.target.value)} />
              <Input label="Office phone" value={officePhone} onChange={(e) => setOfficePhone(e.target.value)} />
              <Select label="Office state" value={officeState} onChange={(e) => { setOfficeState(e.target.value); setOfficeLga(''); }} options={[
                { value: '', label: 'Select state' },
                ...NIGERIA_STATES.map((s) => ({ value: s, label: s })),
              ]} />
              <Select label="Office LGA" value={officeLga} onChange={(e) => setOfficeLga(e.target.value)} options={[
                { value: '', label: 'Select LGA' },
                ...officeLgas.map((l) => ({ value: l, label: l })),
              ]} />
            </>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Capture a clear photo of the member (face visible).</p>
          <input
            ref={photoRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={(e) => onPhotoChange(e.target.files?.[0] ?? null)}
          />
          <div className="flex flex-col items-start gap-4 sm:flex-row">
            <div className="h-40 w-40 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="Member preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-gray-400">No photo</div>
              )}
            </div>
            <Button type="button" variant="secondary" onClick={() => photoRef.current?.click()}>
              {photoPreview ? 'Retake photo' : 'Take photo'}
            </Button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="grid max-w-md gap-4">
          <p className="text-sm text-gray-600">Set a PIN the member will use to log in on the mobile app.</p>
          <Input label="Create PIN (4–6 digits)" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} />
          <Input label="Confirm PIN" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} />
        </div>
      )}

      <div className="mt-8 flex gap-3">
        {step > 0 && (
          <Button type="button" variant="secondary" onClick={() => { setError(''); setStep((s) => s - 1); }}>
            Back
          </Button>
        )}
        <Button type="button" loading={loading} onClick={next}>
          {step === REGISTRATION_STEP_TITLES.length - 1 ? 'Register member' : 'Continue'}
        </Button>
      </div>
    </Card>
  );
}
