'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { formatCurrency, formatMoneyForApi } from '@/lib/utils';
import { formatCustomerOptionLabel } from '@/lib/member-id';
import { buildLoanContractText } from '@/lib/loan-contract-text';
import {
  COLLATERAL_TYPES,
  EDUCATION_LEVELS,
  GENDERS,
  LOAN_CATEGORIES,
  LOAN_OPENING_FEE,
  LOCATION_TYPES,
  MARITAL_STATUSES,
  REPAYMENT_PLANS,
  STEP_TITLES,
  calculateAge,
  educationLabel,
  genderLabel,
  loanCategoryLabel,
  localLoanQuote,
  locationLabel,
  maritalLabel,
  repaymentPeriodUnit,
  repaymentPlanLabel,
  type CustomerPrefill,
  type LoanQuote,
} from '@/lib/loan-application-options';

interface Props {
  initialCustomerId?: string;
}

export function LoanApplicationWizard({ initialCustomerId = '' }: Props) {
  const router = useRouter();
  const photoRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState<CustomerPrefill[]>([]);
  const [quote, setQuote] = useState<LoanQuote | null>(null);

  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [fullName, setFullName] = useState('');
  const [locationType, setLocationType] = useState('URBAN');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState('MALE');
  const [dob, setDob] = useState('');
  const [education, setEducation] = useState('PRIMARY');
  const [marital, setMarital] = useState('SINGLE');
  const [businessInput, setBusinessInput] = useState('');
  const [businessActivities, setBusinessActivities] = useState<string[]>([]);
  const [yearsExp, setYearsExp] = useState('');
  const [unionName, setUnionName] = useState('');
  const [nokName, setNokName] = useState('');
  const [nokPhone, setNokPhone] = useState('');
  const [nokAddress, setNokAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [loanCategory, setLoanCategory] = useState('PERSONAL');
  const [duration, setDuration] = useState('6');
  const [repaymentPlan, setRepaymentPlan] = useState('MONTHLY');
  const [purpose, setPurpose] = useState('');
  const [collateralType, setCollateralType] = useState('EQUIPMENT');
  const [collateral, setCollateral] = useState('');
  const [collateralValue, setCollateralValue] = useState('');
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('');
  const [contractAccepted, setContractAccepted] = useState(false);
  const [photoName, setPhotoName] = useState('');

  useEffect(() => {
    api.get<{ success: boolean; data: CustomerPrefill[] }>('/manager/customers?limit=100')
      .then((res) => setCustomers(res.data))
      .catch(() => setCustomers([]));
  }, []);

  const prefillCustomer = useCallback(async (id: string) => {
    if (!id) return;
    try {
      const res = await api.get<{ success: boolean; data: CustomerPrefill }>(`/manager/customers/${id}`);
      const c = res.data;
      setFullName(`${c.firstName} ${c.lastName}`.trim());
      if (c.gender) setGender(c.gender);
      if (c.dateOfBirth) setDob(c.dateOfBirth.slice(0, 10));
      if (c.address) {
        setAddress([c.address, c.city, c.state].filter(Boolean).join(', '));
      }
      if (c.occupation) {
        setBusinessActivities((prev) => (prev.length ? prev : [c.occupation!]));
      }
    } catch {
      /* optional prefill */
    }
  }, []);

  useEffect(() => {
    setCustomerId(initialCustomerId);
    if (initialCustomerId) prefillCustomer(initialCustomerId);
  }, [initialCustomerId, prefillCustomer]);

  useEffect(() => {
    if (customerId) prefillCustomer(customerId);
  }, [customerId, prefillCustomer]);

  const principal = Number(amount) || 0;
  const periods = Number(duration) || 0;
  const displayQuote = quote ?? (principal > 0 && periods > 0 ? localLoanQuote(principal, periods) : null);

  async function refreshQuote() {
    if (principal <= 0 || periods <= 0) {
      setQuote(null);
      return;
    }
    try {
      const res = await api.post<{ success: boolean; data: LoanQuote }>('/manager/loans/quote', {
        principalAmount: principal,
        tenurePeriods: periods,
        repaymentPlan,
      });
      setQuote(res.data);
    } catch {
      setQuote(localLoanQuote(principal, periods));
    }
  }

  useEffect(() => {
    if (step === 1 || step === 4) refreshQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, principal, periods, repaymentPlan]);

  function addBusiness() {
    const v = businessInput.trim();
    if (!v) return;
    setBusinessActivities((prev) => [...prev, v]);
    setBusinessInput('');
  }

  function validateStep(): string | null {
    switch (step) {
      case 0:
        if (!customerId) return 'Select a customer';
        if (!fullName.trim()) return 'Enter full name';
        if (!address.trim()) return 'Enter address';
        if (!dob) return 'Enter date of birth';
        if (businessActivities.length === 0) return 'Add at least one business activity';
        if (!yearsExp.trim()) return 'Enter years of experience';
        if (!nokName.trim()) return 'Enter next of kin name';
        if (!nokPhone.trim()) return 'Enter next of kin phone';
        if (!nokAddress.trim()) return 'Enter next of kin address';
        return null;
      case 1:
        if (!amount || principal <= 0) return 'Enter a valid amount';
        if (!duration || periods <= 0) return 'Enter loan duration';
        return null;
      case 2:
        if (!collateral.trim()) return 'Describe collateral';
        if (!collateralValue.trim()) return 'Enter collateral value';
        if (!guarantorName.trim()) return 'Enter guarantor name';
        if (!guarantorPhone.trim()) return 'Enter guarantor phone';
        if (!photoRef.current?.files?.[0]) return 'Attach collateral photo';
        return null;
      case 3:
        if (!contractAccepted) return 'You must agree to the contract';
        return null;
      default:
        return null;
    }
  }

  async function handleNext() {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    if (step < STEP_TITLES.length - 1) {
      setStep((s) => s + 1);
    } else {
      await submit();
    }
  }

  async function submit() {
    setLoading(true);
    setError('');
    const photo = photoRef.current?.files?.[0];
    if (!photo) {
      setError('Collateral photo is required');
      setLoading(false);
      return;
    }

    const form = new FormData();
    form.set('customerId', customerId);
    form.set('applicantFullName', fullName.trim());
    form.set('locationType', locationType);
    form.set('applicantAddress', address.trim());
    form.set('applicantGender', gender);
    form.set('applicantDateOfBirth', dob);
    form.set('educationLevel', education);
    form.set('maritalStatus', marital);
    form.set('businessActivities', JSON.stringify(businessActivities));
    form.set('yearsOfExperience', yearsExp.trim());
    if (unionName.trim()) form.set('unionName', unionName.trim());
    form.set('nextOfKinName', nokName.trim());
    form.set('nextOfKinPhone', nokPhone.trim());
    form.set('nextOfKinAddress', nokAddress.trim());
    form.set('loanCategory', loanCategory);
    form.set('principalAmount', formatMoneyForApi(amount));
    form.set('tenurePeriods', duration);
    form.set('repaymentPlan', repaymentPlan);
    form.set('contractAccepted', 'true');
    if (purpose.trim()) form.set('purpose', purpose.trim());
    form.set('collateral', collateral.trim());
    form.set('collateralType', collateralType);
    form.set('collateralEstimatedValue', formatMoneyForApi(collateralValue));
    form.set('guarantorName', guarantorName.trim());
    form.set('guarantorPhone', guarantorPhone.trim());
    form.set('collateralPhoto', photo);

    try {
      const res = await api.post<{ success: boolean; data: { id: string; loanNumber: string } }>('/manager/loans', form);
      router.push(`/manager/loans/${res.data.id}`);
    } catch (e: unknown) {
      setError((e as { message?: string })?.message || 'Application failed');
    } finally {
      setLoading(false);
    }
  }

  const contractText = buildLoanContractText({
    memberName: fullName || 'Member',
    principalAmount: principal,
    installmentAmount: displayQuote?.installmentAmount ?? 0,
    repaymentPlan,
    tenurePeriods: periods,
  });

  const age = dob ? calculateAge(dob) : null;

  return (
    <Card className="max-w-3xl p-6">
      <div className="mb-6">
        <div className="mb-2 h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-brand-600 transition-all"
            style={{ width: `${((step + 1) / STEP_TITLES.length) * 100}%` }}
          />
        </div>
        <p className="text-sm font-medium text-gray-700">
          Step {step + 1} of {STEP_TITLES.length}: {STEP_TITLES[step]}
        </p>
        <p className="text-xs text-gray-500">Same application as mobile — data is stored on one shared loan record.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {step === 0 && (
        <div className="space-y-4">
          <Select
            label="Customer"
            required
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            options={[
              { value: '', label: customers.length ? 'Select customer…' : 'Loading customers…' },
              ...customers.map((c) => ({
                value: c.id,
                label: formatCustomerOptionLabel(c.firstName, c.lastName, c.accounts, c.phone),
              })),
            ]}
          />
          <Input label="Full name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Select
            label="Location"
            value={locationType}
            onChange={(e) => setLocationType(e.target.value)}
            options={LOCATION_TYPES.map((v) => ({ value: v, label: locationLabel(v) }))}
          />
          <Input label="Address" required value={address} onChange={(e) => setAddress(e.target.value)} />
          <Select
            label="Gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            options={GENDERS.map((v) => ({ value: v, label: genderLabel(v) }))}
          />
          <Input
            label={age != null ? `Date of birth (age ${age})` : 'Date of birth'}
            type="date"
            required
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
          <Select
            label="Level of education"
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            options={EDUCATION_LEVELS.map((v) => ({ value: v, label: educationLabel(v) }))}
          />
          <Select
            label="Marital status"
            value={marital}
            onChange={(e) => setMarital(e.target.value)}
            options={MARITAL_STATUSES.map((v) => ({ value: v, label: maritalLabel(v) }))}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Business activity</label>
            <div className="flex gap-2">
              <Input value={businessInput} onChange={(e) => setBusinessInput(e.target.value)} placeholder="e.g. Trading" />
              <Button type="button" variant="secondary" onClick={addBusiness}>Add</Button>
            </div>
            {businessActivities.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {businessActivities.map((a) => (
                  <span key={a} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs">
                    {a}
                    <button type="button" className="text-gray-500 hover:text-red-600" onClick={() => setBusinessActivities((p) => p.filter((x) => x !== a))}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <Input label="Years of experience" type="number" min="0" required value={yearsExp} onChange={(e) => setYearsExp(e.target.value)} />
          <Input label="Union (if applicable)" value={unionName} onChange={(e) => setUnionName(e.target.value)} />
          <p className="text-sm font-medium text-gray-800">Next of kin</p>
          <Input label="Name" required value={nokName} onChange={(e) => setNokName(e.target.value)} />
          <Input label="Phone" required value={nokPhone} onChange={(e) => setNokPhone(e.target.value)} />
          <Input label="Address" required value={nokAddress} onChange={(e) => setNokAddress(e.target.value)} />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Notice: loan account opening cost {formatCurrency(LOAN_OPENING_FEE)}
          </div>
          <Input label="Amount requested (NGN)" type="number" min="1" required value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Select
            label="Loan type"
            value={loanCategory}
            onChange={(e) => setLoanCategory(e.target.value)}
            options={LOAN_CATEGORIES.map((v) => ({ value: v, label: loanCategoryLabel(v) }))}
          />
          <Input
            label={`Loan duration (${repaymentPeriodUnit(repaymentPlan)})`}
            type="number"
            min="1"
            required
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
          <Select
            label="Repayment plan"
            value={repaymentPlan}
            onChange={(e) => setRepaymentPlan(e.target.value)}
            options={REPAYMENT_PLANS.map((v) => ({ value: v, label: repaymentPlanLabel(v) }))}
          />
          <Input label="Purpose (optional)" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          {displayQuote && <QuoteCard quote={displayQuote} repaymentPlan={repaymentPlan} periods={periods} />}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Select
            label="Collateral type"
            value={collateralType}
            onChange={(e) => setCollateralType(e.target.value)}
            options={COLLATERAL_TYPES.map((c) => ({ value: c.value, label: c.label }))}
          />
          <Input label="Collateral description" required value={collateral} onChange={(e) => setCollateral(e.target.value)} />
          <Input label="Estimated value (NGN)" type="number" min="1" required value={collateralValue} onChange={(e) => setCollateralValue(e.target.value)} />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Collateral photo (required)</label>
            <input
              ref={photoRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700"
              onChange={(e) => setPhotoName(e.target.files?.[0]?.name ?? '')}
            />
            {photoName && <p className="mt-1 text-xs text-gray-500">{photoName}</p>}
          </div>
          <p className="text-sm font-medium text-gray-800">Guarantor</p>
          <Input label="Guarantor name" required value={guarantorName} onChange={(e) => setGuarantorName(e.target.value)} />
          <Input label="Guarantor phone" required value={guarantorPhone} onChange={(e) => setGuarantorPhone(e.target.value)} />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Contact agreement</h3>
          <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs leading-relaxed text-gray-700 whitespace-pre-wrap">
            {contractText}
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={contractAccepted}
              onChange={(e) => setContractAccepted(e.target.checked)}
              className="mt-1"
            />
            I have read and agree to the contact agreement on behalf of the member
          </label>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Confirm application</h3>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-gray-500">Customer</dt><dd>{fullName}</dd></div>
            <div><dt className="text-gray-500">Loan type</dt><dd>{loanCategoryLabel(loanCategory)}</dd></div>
            <div><dt className="text-gray-500">Amount</dt><dd>{formatCurrency(principal)}</dd></div>
            <div><dt className="text-gray-500">Duration</dt><dd>{duration} {repaymentPeriodUnit(repaymentPlan)}</dd></div>
            <div><dt className="text-gray-500">Repayment</dt><dd>{repaymentPlanLabel(repaymentPlan)}</dd></div>
          </dl>
          {displayQuote && <QuoteCard quote={displayQuote} repaymentPlan={repaymentPlan} periods={periods} />}
          <p className="text-xs text-gray-500">
            Submitting creates the same loan record as a mobile application. The member will see it in the app; you can review it in the approval queue.
          </p>
        </div>
      )}

      <div className="mt-8 flex gap-3">
        {step > 0 && (
          <Button type="button" variant="secondary" onClick={() => setStep((s) => s - 1)} disabled={loading}>
            Back
          </Button>
        )}
        <Button type="button" loading={loading} onClick={handleNext}>
          {step === STEP_TITLES.length - 1 ? 'Submit application' : 'Continue'}
        </Button>
      </div>
    </Card>
  );
}

function QuoteCard({ quote, repaymentPlan, periods }: { quote: LoanQuote; repaymentPlan: string; periods: number }) {
  return (
    <div className="rounded-lg border border-brand-100 bg-brand-50/50 p-4 text-sm">
      <p className="mb-2 font-semibold text-brand-800">Repayment summary</p>
      <dl className="grid gap-1 sm:grid-cols-2">
        <div><dt className="text-gray-600">Opening fee</dt><dd>{formatCurrency(quote.openingFee)}</dd></div>
        <div><dt className="text-gray-600">Upfront fee (10%)</dt><dd>{formatCurrency(quote.upfrontFee)}</dd></div>
        <div><dt className="text-gray-600">Interest (10%)</dt><dd>{formatCurrency(quote.flatInterestAmount)}</dd></div>
        <div><dt className="text-gray-600">Total repayable</dt><dd className="font-semibold">{formatCurrency(quote.totalRepayable)}</dd></div>
        <div><dt className="text-gray-600">Net disbursement</dt><dd>{formatCurrency(quote.netDisbursement)}</dd></div>
      </dl>
      <p className="mt-3 font-medium text-brand-700">
        {formatCurrency(quote.installmentAmount)} per {repaymentPlanLabel(repaymentPlan).toLowerCase()} × {periods}
      </p>
    </div>
  );
}
