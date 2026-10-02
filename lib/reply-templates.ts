/**
 * Reply templates for public comments. Edit freely: add, remove or reword.
 * Placeholders: {{firstName}} {{name}} {{school}} {{ticket}}
 * waitForReply: true ticks "Set to Waiting on requester after sending" automatically.
 */
export type ReplyTemplate = { id: string; title: string; body: string; waitForReply?: boolean };

export const replyTemplates: ReplyTemplate[] = [
  {
    id: "received",
    title: "Got it, looking into it",
    body: "Hi {{firstName}},\n\nThanks for reaching out. We've received your request ({{ticket}}) and are looking into it now. We'll update you as soon as we know more.",
  },
  {
    id: "need-info",
    title: "Need more information",
    body: "Hi {{firstName}},\n\nTo help us sort this out, could you send us a bit more detail?\n\n- What exactly happens (any error message or a screenshot helps)\n- Which device or room it's in\n- When it started\n\nThanks!",
    waitForReply: true,
  },
  {
    id: "password-reset",
    title: "Password reset done",
    body: "Hi {{firstName}},\n\nYour password has been reset. You'll be asked to set a new one the next time you sign in.\n\nIf you have any trouble signing in, just reply to this email.",
  },
  {
    id: "printer",
    title: "Printer troubleshooting",
    body: "Hi {{firstName}},\n\nCould you try these quick steps for the printer?\n\n1. Turn the printer off, wait 30 seconds, and turn it back on.\n2. Check for paper jams and that the tray has paper.\n3. Try printing a test page again.\n\nLet us know if it's still not working and we'll take a closer look at {{school}}.",
    waitForReply: true,
  },
  {
    id: "wifi",
    title: "Wi-Fi troubleshooting",
    body: "Hi {{firstName}},\n\nCould you try the following?\n\n1. Turn Wi-Fi off and back on on the device.\n2. Forget the network and reconnect.\n3. Restart the device.\n\nIf it still won't connect, reply with the room number and device type and we'll check the access point at {{school}}.",
    waitForReply: true,
  },
  {
    id: "new-staff",
    title: "New staff account ready",
    body: "Hi {{firstName}},\n\nThe new staff account is set up and ready to use. Sign-in details will be shared separately. On first sign-in they'll be asked to set their own password.\n\nLet us know if anything else is needed for their first day.",
  },
  {
    id: "site-visit",
    title: "We'll come take a look",
    body: "Hi {{firstName}},\n\nThis one's best looked at in person. We'll stop by {{school}} on our next visit and follow up with you then.",
  },
  {
    id: "resolved",
    title: "Resolved, closing",
    body: "Hi {{firstName}},\n\nThis should now be sorted. We'll mark the ticket ({{ticket}}) as resolved. If anything's still not right, just reply to this email and it will reopen automatically.",
  },
];

export function fillTemplate(body: string, values: { name: string; school?: string; ticket: string }) {
  const firstName = values.name.trim().split(/\s+/)[0] || "there";
  return body
    .replaceAll("{{firstName}}", firstName)
    .replaceAll("{{name}}", values.name.trim() || "there")
    .replaceAll("{{school}}", values.school || "your school")
    .replaceAll("{{ticket}}", values.ticket);
}
