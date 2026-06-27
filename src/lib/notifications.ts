/**
 * Notification Delivery Service
 * Handles sending notifications via multiple channels:
 * - in_app: Store in database (already done)
 * - email: Send via email service (SendGrid, Mailgun, etc.)
 * - whatsapp: Send via WhatsApp service (Twilio)
 */

import { db } from "./db"

export interface NotificationChannel {
  channel: "in_app" | "email" | "whatsapp"
  status: "pending" | "sent" | "failed"
  timestamp?: string
  error?: string
}

/**
 * Send email notification using configured email service
 */
async function sendEmail(
  to: string,
  subject: string,
  body: string,
  htmlBody?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if email sending is disabled (for development)
    if (process.env.SKIP_EMAIL_SEND === "true") {
      console.log(`[DEV] Email to ${to}: ${subject}`)
      return { success: true }
    }

    const provider = process.env.EMAIL_PROVIDER || "sendgrid"

    if (provider === "sendgrid") {
      // SendGrid implementation
      const apiKey = process.env.SENDGRID_API_KEY
      if (!apiKey) {
        return { success: false, error: "SendGrid API key not configured" }
      }

      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: process.env.EMAIL_FROM || "noreply@nepalcareer.com" },
          subject,
          content: [
            { type: "text/plain", value: body },
            ...(htmlBody ? [{ type: "text/html", value: htmlBody }] : []),
          ],
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        return { success: false, error: JSON.stringify(error) }
      }

      return { success: true }
    }

    // Add more email providers as needed
    return { success: false, error: `Unsupported email provider: ${provider}` }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Send WhatsApp notification using Twilio
 */
async function sendWhatsApp(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if WhatsApp sending is disabled (for development)
    if (process.env.SKIP_WHATSAPP_SEND === "true") {
      console.log(`[DEV] WhatsApp to ${phoneNumber}: ${message}`)
      return { success: true }
    }

    const provider = process.env.WHATSAPP_PROVIDER || "twilio"

    if (provider === "twilio") {
      // Twilio implementation
      const accountSid = process.env.TWILIO_ACCOUNT_SID
      const authToken = process.env.TWILIO_AUTH_TOKEN
      const fromNumber = process.env.TWILIO_PHONE_NUMBER

      if (!accountSid || !authToken || !fromNumber) {
        return { success: false, error: "Twilio credentials not configured" }
      }

      const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64")
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            From: `whatsapp:${fromNumber}`,
            To: `whatsapp:${phoneNumber}`,
            Body: message,
          }).toString(),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        return { success: false, error: JSON.stringify(error) }
      }

      return { success: true }
    }

    return { success: false, error: `Unsupported WhatsApp provider: ${provider}` }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Send notification through specified channels and log delivery status
 */
export async function sendNotification(
  userId: string,
  notificationId: string,
  title: string,
  body: string,
  channels: string[],
  userEmail?: string,
  userPhoneNumber?: string,
  htmlBody?: string
): Promise<void> {
  const deliveryLog: NotificationChannel[] = []

  // In-app notification is already stored, just log success
  if (channels.includes("in_app")) {
    deliveryLog.push({
      channel: "in_app",
      status: "sent",
      timestamp: new Date().toISOString(),
    })
  }

  // Send email notification
  if (channels.includes("email") && userEmail) {
    const emailResult = await sendEmail(userEmail, title, body, htmlBody)
    deliveryLog.push({
      channel: "email",
      status: emailResult.success ? "sent" : "failed",
      timestamp: new Date().toISOString(),
      error: emailResult.error,
    })
  }

  // Send WhatsApp notification
  if (channels.includes("whatsapp") && userPhoneNumber) {
    const whatsappResult = await sendWhatsApp(userPhoneNumber, `${title}\n\n${body}`)
    deliveryLog.push({
      channel: "whatsapp",
      status: whatsappResult.success ? "sent" : "failed",
      timestamp: new Date().toISOString(),
      error: whatsappResult.error,
    })
  }

  // Update notification with delivery log
  await db.notification.update({
    where: { id: notificationId },
    data: {
      deliveryLog: JSON.stringify(deliveryLog),
    },
  })
}

/**
 * Send job alert notification to user
 * Called when a job matches saved alert criteria
 */
export async function sendJobAlertNotification(
  userId: string,
  jobTitle: string,
  companyName: string,
  jobId: string
): Promise<void> {
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) return

  const title = `New job match: ${jobTitle}`
  const body = `${companyName} posted a job matching your search criteria: ${jobTitle}`
  const htmlBody = `<p>${body}</p><p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${jobId}">View Job</a></p>`

  const channels: string[] = []
  if (user.notifyInApp) channels.push("in_app")
  if (user.notifyEmail) channels.push("email")
  if (user.notifyWhatsapp && user.whatsappNumber) channels.push("whatsapp")

  if (channels.length === 0) return

  // Create in-app notification
  const notif = await db.notification.create({
    data: {
      userId,
      type: "job_alert",
      title,
      body,
      channels: JSON.stringify(channels),
      meta: JSON.stringify({ jobId, companyName }),
      deliveryLog: JSON.stringify([]),
      read: false,
    },
  })

  // Send through all channels
  await sendNotification(userId, notif.id, title, body, channels, user.email, user.whatsappNumber || undefined, htmlBody)
}

/**
 * Send application status notification to user
 * Called when application status changes
 */
export async function sendApplicationStatusNotification(
  userId: string,
  applicationStatus: string,
  jobTitle: string,
  companyName: string,
  applicationId: string
): Promise<void> {
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) return

  const title = `Application update: ${jobTitle}`
  const body = `Your application to ${companyName} has been ${applicationStatus.toLowerCase()}`
  const htmlBody = `<p>${body}</p><p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/applications">View Applications</a></p>`

  const channels = ["in_app", "email"]
  const phoneNumber = user.headline?.includes("·") ? user.headline.split("·")[1]?.trim() : undefined
  if (phoneNumber) {
    channels.push("whatsapp")
  }

  const notif = await db.notification.create({
    data: {
      userId,
      type: "application_status",
      title,
      body,
      channels: JSON.stringify(channels),
      meta: JSON.stringify({ applicationId, status: applicationStatus }),
      deliveryLog: JSON.stringify([]),
      read: false,
    },
  })

  await sendNotification(userId, notif.id, title, body, channels, user.email, phoneNumber, htmlBody)
}

/**
 * Send saved job notification to user
 */
export async function sendSavedJobNotification(
  userId: string,
  jobTitle: string,
  companyName: string,
  reason: string = "saved"
): Promise<void> {
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) return

  const title = `Job ${reason}: ${jobTitle}`
  const body = `${companyName} - ${jobTitle}`
  const channels = ["in_app"]

  const notif = await db.notification.create({
    data: {
      userId,
      type: "saved_job",
      title,
      body,
      channels: JSON.stringify(channels),
      meta: JSON.stringify({ companyName, jobTitle, reason }),
      deliveryLog: JSON.stringify([]),
      read: false,
    },
  })

  await sendNotification(userId, notif.id, title, body, channels, user.email)
}
