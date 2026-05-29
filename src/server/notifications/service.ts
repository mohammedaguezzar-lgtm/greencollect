import { prisma } from '@/lib/db';
import { sendEmail } from './email';

type PickupEventType = 'PICKUP_CONFIRMED' | 'PICKUP_ASSIGNED' | 'PICKUP_COMPLETED';

const templates: Record<
  PickupEventType,
  (ctx: { date: string; address: string }) => { title: string; subject: string; body: string }
> = {
  PICKUP_CONFIRMED: (ctx) => ({
    title: 'Collecte confirmée',
    subject: `GreenCollect — collecte confirmée le ${ctx.date}`,
    body: `Votre demande de collecte à ${ctx.address} est confirmée pour le ${ctx.date}.`,
  }),
  PICKUP_ASSIGNED: (ctx) => ({
    title: 'Collecteur assigné',
    subject: `GreenCollect — collecteur en route le ${ctx.date}`,
    body: `Un collecteur a été assigné pour ${ctx.address} le ${ctx.date}.`,
  }),
  PICKUP_COMPLETED: (ctx) => ({
    title: 'Collecte terminée',
    subject: `GreenCollect — collecte terminée`,
    body: `Merci ! Votre collecte à ${ctx.address} est terminée.`,
  }),
};

export async function notifyPickupEvent(
  type: PickupEventType,
  userId: string,
  email: string,
  ctx: { date: string; address: string },
) {
  const t = templates[type](ctx);

  const notification = await prisma.notification.create({
    data: {
      userId,
      channel: 'EMAIL',
      type,
      title: t.title,
      body: t.body,
    },
  });

  const sent = await sendEmail({
    to: email,
    subject: t.subject,
    html: `<p>${t.body}</p><p>— GreenCollect</p>`,
  });

  if (sent) {
    await prisma.notification.update({
      where: { id: notification.id },
      data: { sentAt: new Date() },
    });
  }

  return notification;
}
