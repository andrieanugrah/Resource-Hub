import { readTable, writeTable, newId, nowIso, type Notification } from "./db";

// ponytail: email via Resend HTTP API, no dep. Swappable to nodemailer/SendGrid if SMTP raw needed.
// Set RESEND_API_KEY + EMAIL_FROM to enable. No env = in-app only, no send.

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const EMAIL_FROM = process.env.EMAIL_FROM ?? "ResourceHub <noreply@resourcehub.local>";

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) return false; // email disabled — in-app notifications only
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject, html }),
    });
    return res.ok;
  } catch {
    return false; // never block app on email failure
  }
}

export async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  type: Notification["type"];
  link: string;
}): Promise<void> {
  const notifications = await readTable("notifications");
  const entry: Notification = {
    id: newId("ntf"),
    user_id: params.userId,
    title: params.title,
    message: params.message,
    type: params.type,
    link: params.link,
    read: false,
    created_at: nowIso(),
  };
  notifications.unshift(entry);
  await writeTable("notifications", notifications);

  // Fire-and-forget email if enabled + user has email
  const users = await readTable("users");
  const user = users.find((u) => u.id === params.userId);
  if (user?.email) {
    const html = `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto">
      <h2 style="color:#1a1a2e">${params.title}</h2>
      <p style="color:#444">${params.message}</p>
      <p style="margin-top:16px"><a href="${process.env.APP_URL ?? ""}${params.link}" style="display:inline-block;padding:8px 16px;background:#1a1a2e;color:#fff;border-radius:8px;text-decoration:none">View</a></p>
    </div>`;
    void sendEmail(user.email, params.title, html);
  }
}

export async function checkWarrantyExpirationNotifications(): Promise<void> {
  const [assets, users, notifications] = await Promise.all([
    readTable("assets"),
    readTable("users"),
    readTable("notifications"),
  ]);

  const live = assets.filter((a) => !a.deleted_at && a.warranty_end_date);
  const now = new Date();
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const maintenanceUsers = users.filter(
    (u) => u.status === "active" && (u.role === "super_admin" || u.role === "admin_it" || u.role === "manager")
  );

  for (const asset of live) {
    const endDate = new Date(asset.warranty_end_date!);
    if (endDate >= now && endDate <= thirtyDaysLater) {
      const link = `/assets?warranty=expiring`;
      const existing = notifications.some(
        (n) => n.link === link && n.message.includes(asset.asset_code)
      );

      if (!existing) {
        for (const u of maintenanceUsers) {
          await createNotification({
            userId: u.id,
            title: `Garansi Mau Habis: ${asset.asset_name}`,
            message: `Garansi untuk aset ${asset.asset_name} (${asset.asset_code}) akan berakhir pada ${endDate.toLocaleDateString("id-ID")}.`,
            type: "asset",
            link,
          });
        }
      }
    }
  }
}