"use server";

export interface ContactResult {
  ok: boolean;
  message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitContactMessage(
  _prevState: ContactResult | null,
  formData: FormData,
): Promise<ContactResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (name.length < 2) {
    return { ok: false, message: "Please enter your name." };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, message: "Please enter a valid email." };
  }
  if (message.length < 10) {
    return { ok: false, message: "Message is too short." };
  }

  // TODO: wire to Supabase once the table exists.
  // await supabase.from("contact_messages").insert({ name, email, message });
  console.log(
    `[contact] ${new Date().toISOString()} name=${name} email=${email} message=${message.slice(0, 120)}`,
  );

  return {
    ok: true,
    message: "Thanks — message received. We'll get back to you.",
  };
}
