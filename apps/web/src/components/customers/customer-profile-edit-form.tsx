'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { apiAssetUrl } from '@/lib/api-origin';
import { NIGERIA_STATES, lgasForState } from '@/lib/nigeria-locations';
import {
  CUSTOMER_TITLES,
  EMPLOYMENT_STATUSES,
  GENDERS,
  INCOME_BANDS,
  MARITAL_STATUSES,
  calculateAge,
  showsEmployerFields,
  showsEmploymentDate,
} from '@/lib/customer-registration-options';

export interface CustomerProfileEditSource {
  id: string;
  title?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  maritalStatus?: string;
  dateOfBirth?: string;
  gender?: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  bvn?: string;
  nin?: string;
  address?: string;
  lga?: string;
  city?: string;
  state?: string;
  employmentStatus?: string;
  employmentStatusNote?: string;
  employmentStartDate?: string;
  incomeBand?: string;
  occupation?: string;
  employer?: string;
  employerPhone?: string;
  employerEmail?: string;
  employerAddress?: string;
  natureOfBusiness?: string;
  officeNumber?: string;
  officePhone?: string;
  officeState?: string;
  officeLga?: string;
  photoUrl?: string;
}

function toDateInputValue(iso?: string): string {
  if (!iso) return '';
  const d = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : '';
}

interface Props {
  customer: CustomerProfileEditSource;
  onSaved: () => void | Promise<void>;
  onCancel: () => void;
}

export function CustomerProfileEditForm({ customer, onSaved, onCancel }: Props) {
  const photoRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const [title, setTitle] = useState(customer.title ?? '');
  const [firstName, setFirstName] = useState(customer.firstName);
  const [lastName, setLastName] = useState(customer.lastName);
  const [middleName, setMiddleName] = useState(customer.middleName ?? '');
  const [maritalStatus, setMaritalStatus] = useState(customer.maritalStatus ?? 'SINGLE');
  const [gender, setGender] = useState(customer.gender ?? 'MALE');
  const [dob, setDob] = useState(toDateInputValue(customer.dateOfBirth));
  const [phone, setPhone] = useState(customer.phone);
  const [alternatePhone, setAlternatePhone] = useState(customer.alternatePhone ?? '');
  const [email, setEmail] = useState(customer.email ?? '');
  const [address, setAddress] = useState(customer.address ?? '');
  const [state, setState] = useState(customer.state ?? 'Plateau');
  const [lga, setLga] = useState(customer.lga ?? '');
  const [city, setCity] = useState(customer.city ?? '');
  const [bvn, setBvn] = useState(customer.bvn ?? '');
  const [nin, setNin] = useState(customer.nin ?? '');
  const [employmentStatus, setEmploymentStatus] = useState(customer.employmentStatus ?? 'UNEMPLOYED');
  const [employmentStatusNote, setEmploymentStatusNote] = useState(customer.employmentStatusNote ?? '');
  const [employmentStartDate, setEmploymentStartDate] = useState(
    toDateInputValue(customer.employmentStartDate),
  );
  const [incomeBand, setIncomeBand] = useState(customer.incomeBand ?? '');
  const [occupation, setOccupation] = useState(customer.occupation ?? '');
  const [employer, setEmployer] = useState(customer.employer ?? '');
  const [employerPhone, setEmployerPhone] = useState(customer.employerPhone ?? '');
  const [employerEmail, setEmployerEmail] = useState(customer.employerEmail ?? '');
  const [employerAddress, setEmployerAddress] = useState(customer.employerAddress ?? '');
  const [natureOfBusiness, setNatureOfBusiness] = useState(customer.natureOfBusiness ?? '');
  const [officeNumber, setOfficeNumber] = useState(customer.officeNumber ?? '');
  const [officePhone, setOfficePhone] = useState(customer.officePhone ?? '');
  const [officeState, setOfficeState] = useState(customer.officeState ?? '');
  const [officeLga, setOfficeLga] = useState(customer.officeLga ?? '');

  const age = useMemo(() => (dob ? calculateAge(dob) : null), [dob]);
  const residentialLgas = useMemo(() => lgasForState(state), [state]);
  const officeLgas = useMemo(() => lgasForState(officeState), [officeState]);
  const employerVisible = showsEmployerFields(employmentStatus);
  const existingPhoto = customer.photoUrl ? apiAssetUrl(customer.photoUrl) : '';

  const onPhotoChange = useCallback(
    (file: File | null) => {
      setPhotoFile(file);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(file ? URL.createObjectURL(file) : '');
    },
    [photoPreview],
  );

  function validate(): string | null {
    if (!firstName.trim() || !lastName.trim()) return 'First name and surname are required';
    if (!dob) return 'Date of birth is required';
    if (age != null && age < 18) return 'Member must be at least 18 years old';
    if (!phone.trim()) return 'Phone number is required';
    if (!address.trim() || !city.trim() || !state.trim()) return 'Complete residential address';
    if (bvn.length !== 11) return 'BVN must be 11 digits';
    if (nin.length !== 11) return 'NIN must be 11 digits';
    if (employmentStatus === 'OTHER' && !employmentStatusNote.trim()) {
      return 'Please specify employment status';
    }
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
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
      if (photoFile) form.append('customerPhoto', photoFile);

      await api.patch(`/teller/customers/${customer.id}`, form);
      await onSaved();
    } catch (submitErr: unknown) {
      setError((submitErr as { message?: string })?.message || 'Could not save changes');
    } finally {
      setLoading(false);
    }
  }

  const displayPhoto = photoPreview || existingPhoto;

  return (
    <Card className="p-6">
      <h2 className="mb-1 text-lg font-semibold">Edit member profile</h2>
      <p className="mb-4 text-sm text-gray-500">
        Changes are logged for audit. Phone, BVN, and NIN must remain unique across members.
      </p>
      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <form onSubmit={submit} className="space-y-8">
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Personal</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              options={[
                { value: '', label: 'Select title' },
                ...CUSTOMER_TITLES.map((t) => ({ value: t.value, label: t.label })),
              ]}
            />
            <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            <Input label="Surname" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            <Input label="Other name" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
            <Select
              label="Marital status"
              value={maritalStatus}
              onChange={(e) => setMaritalStatus(e.target.value)}
              options={MARITAL_STATUSES.map((m) => ({ value: m.value, label: m.label }))}
            />
            <Select
              label="Gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              options={GENDERS.map((g) => ({ value: g.value, label: g.label }))}
            />
            <Input label="Date of birth" type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
            <Input label="Age" value={age != null ? String(age) : ''} readOnly placeholder="Auto-calculated" />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Contact & address</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            <Input label="Alternate phone" value={alternatePhone} onChange={(e) => setAlternatePhone(e.target.value)} />
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="md:col-span-2"
            />
            <Input
              label="Street / residential address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="md:col-span-2"
              required
            />
            <Select
              label="State"
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setLga('');
              }}
              options={NIGERIA_STATES.map((s) => ({ value: s, label: s }))}
              required
            />
            <Select
              label="Local government area"
              value={lga}
              onChange={(e) => setLga(e.target.value)}
              options={[
                { value: '', label: 'Select LGA' },
                ...residentialLgas.map((l) => ({ value: l, label: l })),
              ]}
            />
            <Input label="City / town" value={city} onChange={(e) => setCity(e.target.value)} required />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Identity</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="BVN (11 digits)"
              value={bvn}
              onChange={(e) => setBvn(e.target.value.replace(/\D/g, '').slice(0, 11))}
              maxLength={11}
              required
            />
            <Input
              label="NIN (11 digits)"
              value={nin}
              onChange={(e) => setNin(e.target.value.replace(/\D/g, '').slice(0, 11))}
              maxLength={11}
              required
            />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Employment</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Employment status"
              value={employmentStatus}
              onChange={(e) => setEmploymentStatus(e.target.value)}
              options={EMPLOYMENT_STATUSES.map((opt) => ({ value: opt.value, label: opt.label }))}
              className="md:col-span-2"
            />
            {employmentStatus === 'OTHER' && (
              <Input
                label="Specify employment status"
                value={employmentStatusNote}
                onChange={(e) => setEmploymentStatusNote(e.target.value)}
                className="md:col-span-2"
              />
            )}
            {showsEmploymentDate(employmentStatus) && (
              <Input
                label="Date of employment"
                type="date"
                value={employmentStartDate}
                onChange={(e) => setEmploymentStartDate(e.target.value)}
              />
            )}
            <Select
              label="Annual salary / expected income"
              value={incomeBand}
              onChange={(e) => setIncomeBand(e.target.value)}
              options={[
                { value: '', label: 'Select range' },
                ...INCOME_BANDS.map((b) => ({ value: b.value, label: b.label })),
              ]}
              className="md:col-span-2"
            />
            {employerVisible && (
              <>
                <Input label="Employer / business name" value={employer} onChange={(e) => setEmployer(e.target.value)} />
                <Input
                  label="Nature of business"
                  value={natureOfBusiness}
                  onChange={(e) => setNatureOfBusiness(e.target.value)}
                />
                <Input label="Employer phone" value={employerPhone} onChange={(e) => setEmployerPhone(e.target.value)} />
                <Input
                  label="Employer email"
                  type="email"
                  value={employerEmail}
                  onChange={(e) => setEmployerEmail(e.target.value)}
                />
                <Input
                  label="Employer address"
                  value={employerAddress}
                  onChange={(e) => setEmployerAddress(e.target.value)}
                  className="md:col-span-2"
                />
                <Input label="Occupation / job title" value={occupation} onChange={(e) => setOccupation(e.target.value)} />
                <Input label="Office number" value={officeNumber} onChange={(e) => setOfficeNumber(e.target.value)} />
                <Input label="Office phone" value={officePhone} onChange={(e) => setOfficePhone(e.target.value)} />
                <Select
                  label="Office state"
                  value={officeState}
                  onChange={(e) => {
                    setOfficeState(e.target.value);
                    setOfficeLga('');
                  }}
                  options={[
                    { value: '', label: 'Select state' },
                    ...NIGERIA_STATES.map((s) => ({ value: s, label: s })),
                  ]}
                />
                <Select
                  label="Office LGA"
                  value={officeLga}
                  onChange={(e) => setOfficeLga(e.target.value)}
                  options={[
                    { value: '', label: 'Select LGA' },
                    ...officeLgas.map((l) => ({ value: l, label: l })),
                  ]}
                />
              </>
            )}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Photo</h3>
          <p className="mb-3 text-sm text-gray-600">Upload a new photo only if you want to replace the current one.</p>
          <input
            ref={photoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPhotoChange(e.target.files?.[0] ?? null)}
          />
          <div className="flex flex-col items-start gap-4 sm:flex-row">
            <div className="h-40 w-40 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              {displayPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={displayPhoto} alt="Member" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-gray-400">No photo</div>
              )}
            </div>
            <Button type="button" variant="secondary" onClick={() => photoRef.current?.click()}>
              {displayPhoto ? 'Replace photo' : 'Upload photo'}
            </Button>
          </div>
        </section>

        <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-4">
          <Button type="submit" loading={loading}>
            Save changes
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
