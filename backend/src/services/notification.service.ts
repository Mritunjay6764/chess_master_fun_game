import admin from '../config/firebase';
import prisma from '../config/prisma';

export class NotificationService {
  async sendNotification(userId: string, title: string, body: string, data?: Record<string, string>): Promise<void> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { fcmToken: true } });
      if (!user?.fcmToken) return;
      await admin.messaging().send({ notification: { title, body }, data: data || {}, token: user.fcmToken });
    } catch (e) { console.log('Notification error:', (e as Error).message); }
  }
  async notifyYourTurn(userId: string, opponent: string): Promise<void> {
    await this.sendNotification(userId, 'Your Turn', `${opponent} made a move. It's your turn!`, { type: 'your_turn' });
  }
}
export const notificationService = new NotificationService();