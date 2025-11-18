import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, MapPin, Users, CheckCircle, Trash2, Eye, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.list('-created_date'),
    enabled: user?.role === 'admin',
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success("Notification marquée comme lue");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success("Notification supprimée");
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifs = notifications.filter(n => !n.is_read);
      await Promise.all(unreadNotifs.map(n => 
        base44.entities.Notification.update(n.id, { is_read: true })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success("Toutes les notifications marquées comme lues");
    },
  });

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 mt-16 md:mt-0">
        <div className="text-center">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Accès refusé
          </h3>
          <p className="text-gray-600">
            Cette page est réservée aux administrateurs.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center mt-16 md:mt-0">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen p-4 md:p-8 mt-16 md:mt-0 relative z-0">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <Bell className="w-6 h-6 md:w-8 md:h-8 text-emerald-600" />
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Notifications</h1>
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                size="sm"
                variant="outline"
                className="border-emerald-200"
              >
                <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Tout marquer comme lu</span>
                <span className="sm:hidden text-xs">Tout lire</span>
              </Button>
            )}
          </div>
          <p className="text-gray-600 text-xs md:text-sm">
            {notifications.length === 0 
              ? "Aucune notification pour le moment"
              : `${notifications.length} notification${notifications.length > 1 ? 's' : ''} au total`
            }
          </p>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucune notification
              </h3>
              <p className="text-gray-600">
                Les nouvelles activités apparaîtront ici
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification, index) => {
              const Icon = notification.type === 'spot' ? MapPin : Users;
              const isUnread = !notification.is_read;
              const linkUrl = notification.type === 'spot' 
                ? `${createPageUrl('Home')}?spotId=${notification.related_id}` 
                : createPageUrl('Communities');

              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`${isUnread ? 'border-emerald-500 bg-emerald-50/50' : 'bg-white'} hover:shadow-md transition-all`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          notification.type === 'spot' ? 'bg-emerald-100' : 'bg-blue-100'
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            notification.type === 'spot' ? 'text-emerald-600' : 'text-blue-600'
                          }`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.message}
                              </p>
                              {notification.related_name && (
                                <p className="text-xs text-emerald-600 mt-1 font-medium">
                                  {notification.related_name}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {format(new Date(notification.created_date), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                              </p>
                            </div>
                            {isUnread && (
                              <Badge className="bg-red-500 text-white text-xs flex-shrink-0">
                                Nouveau
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            {notification.related_id && (
                              <Link to={linkUrl}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-emerald-200 hover:bg-emerald-50 text-emerald-600"
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  {notification.type === 'spot' ? 'Voir le spot' : 'Voir la communauté'}
                                </Button>
                              </Link>
                            )}
                            {isUnread && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markAsReadMutation.mutate(notification.id)}
                                disabled={markAsReadMutation.isPending}
                                className="border-emerald-200 hover:bg-emerald-50"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Marquer comme lu
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteMutation.mutate(notification.id)}
                              disabled={deleteMutation.isPending}
                              className="border-red-200 hover:bg-red-50 text-red-600"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Supprimer
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}