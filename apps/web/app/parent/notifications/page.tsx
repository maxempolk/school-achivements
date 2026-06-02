'use client';

import { NotificationsView } from '@/components/notifications/notifications-view';

export default function ParentNotificationsPage() {
  return (
    <section className="flex flex-col gap-4">
      <NotificationsView />
    </section>
  );
}
