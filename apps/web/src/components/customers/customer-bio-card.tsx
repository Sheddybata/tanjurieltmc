'use client';

import { apiAssetUrl } from '@/lib/api-origin';
import { formatDate } from '@/lib/utils';
import {
  calculateAge,
  employmentStatusLabel,
  genderLabel,
  incomeBandLabel,
  maritalLabel,
  titleLabel,
} from '@/lib/customer-registration-options';

export interface CustomerBio {
  title?: string | null;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  maritalStatus?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  phone: string;
  alternatePhone?: string | null;
  email?: string | null;
  bvn?: string | null;
  nin?: string | null;
  address?: string | null;
  lga?: string | null;
  city?: string | null;
  state?: string | null;
  employmentStatus?: string | null;
  employmentStatusNote?: string | null;
  employmentStartDate?: string | null;
  incomeBand?: string | null;
  occupation?: string | null;
  employer?: string | null;
  employerPhone?: string | null;
  employerEmail?: string | null;
  employerAddress?: string | null;
  natureOfBusiness?: string | null;
  officeNumber?: string | null;
  officePhone?: string | null;
  officeState?: string | null;
  officeLga?: string | null;
  photoUrl?: string | null;
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd>{value?.trim() ? value : '—'}</dd>
    </div>
  );
}

export function CustomerBioCard({ customer }: { customer: CustomerBio }) {
  const photoSrc = apiAssetUrl(customer.photoUrl);
  const dob = customer.dateOfBirth ?? '';
  const age = dob ? calculateAge(dob.slice(0, 10)) : null;
  const fullName = [
    titleLabel(customer.title),
    customer.firstName,
    customer.middleName,
    customer.lastName,
  ].filter((p) => p && p !== '—').join(' ');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="h-32 w-32 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
          {photoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoSrc} alt={fullName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-gray-400">No photo</div>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold">{fullName}</h3>
          {age != null && (
            <p className="text-sm text-gray-500">Age {age} · {genderLabel(customer.gender ?? '')}</p>
          )}
        </div>
      </div>

      <section>
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Personal information</h4>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <Field label="Marital status" value={maritalLabel(customer.maritalStatus ?? '')} />
          <Field label="Date of birth" value={dob ? formatDate(dob) : undefined} />
          <Field label="Gender" value={genderLabel(customer.gender ?? '')} />
        </dl>
      </section>

      <section>
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Contact details</h4>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <Field label="Phone" value={customer.phone} />
          <Field label="Alternate phone" value={customer.alternatePhone} />
          <Field label="Email" value={customer.email} />
          <Field label="Street address" value={customer.address} />
          <Field label="State" value={customer.state} />
          <Field label="LGA" value={customer.lga} />
          <Field label="City / town" value={customer.city} />
        </dl>
      </section>

      <section>
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Identification</h4>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <Field label="BVN" value={customer.bvn} />
          <Field label="NIN" value={customer.nin} />
        </dl>
      </section>

      <section>
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Employment</h4>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <Field label="Status" value={employmentStatusLabel(customer.employmentStatus)} />
          {customer.employmentStatus === 'OTHER' && (
            <Field label="Specification" value={customer.employmentStatusNote} />
          )}
          <Field label="Employment date" value={customer.employmentStartDate ? formatDate(customer.employmentStartDate) : undefined} />
          <Field label="Income band" value={incomeBandLabel(customer.incomeBand)} />
          <Field label="Occupation" value={customer.occupation} />
          <Field label="Employer" value={customer.employer} />
          <Field label="Nature of business" value={customer.natureOfBusiness} />
          <Field label="Employer phone" value={customer.employerPhone} />
          <Field label="Employer email" value={customer.employerEmail} />
          <Field label="Employer address" value={customer.employerAddress} />
          <Field label="Office number" value={customer.officeNumber} />
          <Field label="Office phone" value={customer.officePhone} />
          <Field label="Office state" value={customer.officeState} />
          <Field label="Office LGA" value={customer.officeLga} />
        </dl>
      </section>
    </div>
  );
}
