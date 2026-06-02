'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCheck,
  Bell,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { innerApi } from '@/lib/api';

type NotificationType =
  | 'NEW_GRADE'
  | 'GRADE_UPDATED'
  | 'HOMEWORK_UPDATED'
  | 'SCHEDULE_CHANGED';

type Notification = {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

async function fetchNotifications() {
  const res = await innerApi.get<Notification[]>('/api/backend/notifications');
  return res.data;
}

export function NotificationsView() {
  const queryClient = useQueryClient();

  const {
    data: notifications,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: fetchNotifications,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await innerApi.patch(`/api/backend/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => {
      toast.error('Failed to mark notification as read');
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await innerApi.patch('/api/backend/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
    onError: () => {
      toast.error('Failed to mark notifications as read');
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-destructive font-medium">
          Failed to load notifications
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
          }
        >
          Try again
        </Button>
      </div>
    );
  }

  const hasUnread = notifications?.some((n) => !n.isRead) ?? false;

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'NEW_GRADE':
        return <Award className="h-5 w-5 text-emerald-600" />;
      case 'GRADE_UPDATED':
        return <RefreshCw className="h-5 w-5 text-blue-600" />;
      case 'HOMEWORK_UPDATED':
        return <BookOpen className="h-5 w-5 text-amber-600" />;
      case 'SCHEDULE_CHANGED':
        return <Calendar className="h-5 w-5 text-rose-600" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getIconBg = (type: NotificationType) => {
    switch (type) {
      case 'NEW_GRADE':
        return 'bg-emerald-100 dark:bg-emerald-950/30';
      case 'GRADE_UPDATED':
        return 'bg-blue-100 dark:bg-blue-950/30';
      case 'HOMEWORK_UPDATED':
        return 'bg-amber-100 dark:bg-amber-950/30';
      case 'SCHEDULE_CHANGED':
        return 'bg-rose-100 dark:bg-rose-950/30';
      default:
        return 'bg-muted';
    }
  };

  const formatNotificationTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
          <p className="text-sm text-muted-foreground">
            Stay updated with your performance, homework, and schedule changes.
          </p>
        </div>
        {hasUnread && (
          <Button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            variant="outline"
            className="flex items-center gap-2 self-start"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {!notifications || notifications.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
            <Bell className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="mb-1">All caught up!</CardTitle>
          <p className="text-sm text-muted-foreground max-w-sm">
            You don't have any notifications at the moment. We'll let you know
            when new updates arrive.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-all duration-200 ${
                !notification.isRead
                  ? 'border-l-4 border-l-primary bg-primary/5 hover:bg-primary/10'
                  : 'hover:bg-muted/40'
              }`}
            >
              <CardContent className="flex items-start gap-4 p-4">
                <div
                  className={`p-2.5 rounded-xl ${getIconBg(notification.type)} shrink-0`}
                >
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <p
                      className={`text-sm font-semibold truncate ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}
                    >
                      {notification.title}
                    </p>
                    <span className="text-[11px] text-muted-foreground shrink-0 mt-0.5">
                      {formatNotificationTime(notification.createdAt)}
                    </span>
                  </div>
                  <p
                    className={`text-sm mt-1 leading-relaxed ${!notification.isRead ? 'text-foreground/90' : 'text-muted-foreground/80'}`}
                  >
                    {notification.message}
                  </p>
                </div>
                {!notification.isRead && (
                  <Button
                    onClick={() => markReadMutation.mutate(notification.id)}
                    disabled={markReadMutation.isPending}
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full shrink-0"
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
