import type { ExtractedData, KycProcessingResult } from "@/lib/types";

interface ApplicantProfile {
  documentType: string;
  firstName: string;
  lastName: string;
  address: string;
  documentNumber: string;
  expiryDate: string;
  dateOfBirth: string;
  nationality: string;
}

const APPLICANT_PROFILES: ApplicantProfile[] = [
  {
    documentType: "Passport",
    firstName: "John",
    lastName: "Doe",
    address: "12 Rue de Paris, 75001 Paris",
    documentNumber: "XK123456",
    expiryDate: "2030-05-12",
    dateOfBirth: "1989-11-04",
    nationality: "French",
  },
  {
    documentType: "National Identity Card",
    firstName: "Amelie",
    lastName: "Martin",
    address: "48 Avenue Victor Hugo, 75016 Paris",
    documentNumber: "FR928114",
    expiryDate: "2029-08-30",
    dateOfBirth: "1992-06-17",
    nationality: "French",
  },
  {
    documentType: "Residence Permit",
    firstName: "Karim",
    lastName: "Haddad",
    address: "22 Boulevard Saint-Germain, 75005 Paris",
    documentNumber: "RP661274",
    expiryDate: "2031-01-19",
    dateOfBirth: "1986-02-25",
    nationality: "Moroccan",
  },
];

const RECORD_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";

const hashString = (value: string) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
};

const buildToken = (seed: number, length: number) => {
  let current = seed;
  let token = "";

  for (let index = 0; index < length; index += 1) {
    token += RECORD_ID_ALPHABET[current % RECORD_ID_ALPHABET.length];
    current = Math.floor(current / RECORD_ID_ALPHABET.length) + 17;
  }

  return token;
};

const buildSalesforceRecordId = (seed: number) =>
  `001${buildToken(seed + 11, 2)}00000${buildToken(seed + 37, 5)}`;

const buildReferenceId = (seed: number) => {
  const datePortion = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `KYC-${datePortion}-${String((seed % 9000) + 1000)}`;
};

const buildActivityLog = (recordId: string, referenceId: string) => {
  const now = new Date();
  const iso = (offsetMs: number) => new Date(now.getTime() + offsetMs).toISOString();

  return [
    {
      label: "Document intake completed",
      detail: "Identity image package and proof-of-address asset bundle accepted into onboarding workflow.",
      timestamp: iso(-120000),
    },
    {
      label: "Identity verification cleared",
      detail: "Document authenticity and ownership checks completed with no blocking discrepancies.",
      timestamp: iso(-60000),
    },
    {
      label: "CRM record updated",
      detail: `Account verification record ${recordId} synchronized to case reference ${referenceId}.`,
      timestamp: iso(0),
    },
  ];
};

export function simulateKycProcess({
  identityFileName,
  addressFileName,
}: {
  identityFileName?: string | null;
  addressFileName?: string | null;
}): KycProcessingResult {
  const seedSource = `${identityFileName ?? "identity.png"}::${addressFileName ?? "address.png"}`;
  const seed = hashString(seedSource);
  const extracted = APPLICANT_PROFILES[seed % APPLICANT_PROFILES.length] as ExtractedData;
  const salesforceRecordId = buildSalesforceRecordId(seed);
  const referenceId = buildReferenceId(seed);
  const complianceScore = 91 + (seed % 5);

  return {
    status: "APPROVED",
    complianceScore,
    salesforceRecordId,
    summary:
      "Customer identity and address successfully verified. Profile meets compliance requirements and is ready for onboarding progression.",
    extracted,
    nextSteps: [
      "Route the verified record to onboarding operations for final account setup.",
      "Retain source documents under the active case file in accordance with retention policy.",
      "Notify the relationship manager that the KYC review has cleared for activation.",
    ],
    referenceId,
    activityLog: buildActivityLog(salesforceRecordId, referenceId),
  };
}
