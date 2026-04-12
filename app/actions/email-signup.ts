"use server";

export interface SignupResult {
  ok: boolean;
  message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signupForBranchUpdates(
  _prevState: SignupResult | null,
  formData: FormData,
): Promise<SignupResult> {
  const branchSlug = String(formData.get("branchSlug") ?? "");
  const email = String(formData.get("email") ?? "").trim();

  if (!EMAIL_RE.test(email)) {
    return { ok: false, message: "Please enter a valid email." };
  }

  console.log(
    `[email-signup] ${new Date().toISOString()} branch=${branchSlug} email=${email}`,
  );

  return {
    ok: true,
    message: "Thanks — we'll email you when this branch goes live.",
  };
}
