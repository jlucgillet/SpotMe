import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

export default function SendEmailDialog({ community, open, onOpenChange }) {
  const [formData, setFormData] = useState({
    subject: "",
    body: ""
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data) => {
      const recipients = [
        ...(community.member_emails || []),
        ...(community.admin_emails || []),
        community.created_by
      ];
      
      // Enlever les doublons
      const uniqueRecipients = [...new Set(recipients)];
      
      // Envoyer un email à chaque membre
      await Promise.all(
        uniqueRecipients.map(email => 
          base44.integrations.Core.SendEmail({
            from_name: `${community.name} (SpotMe)`,
            to: email,
            subject: data.subject,
            body: data.body
          })
        )
      );
      
      return uniqueRecipients.length;
    },
    onSuccess: (count) => {
      toast.success(`Email envoyé à ${count} membre${count > 1 ? 's' : ''} !`);
      setFormData({ subject: "", body: "" });
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Erreur lors de l'envoi des emails");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.body) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    sendEmailMutation.mutate(formData);
  };

  const memberCount = [
    ...(community.member_emails || []),
    ...(community.admin_emails || []),
    community.created_by
  ].filter((v, i, a) => a.indexOf(v) === i).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl z-[10000]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-emerald-600" />
            Envoyer un email à la communauté
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="text-sm text-emerald-900">
              <strong>{community.name}</strong>
            </p>
            <p className="text-xs text-emerald-700 mt-1">
              L'email sera envoyé à {memberCount} membre{memberCount > 1 ? 's' : ''}
            </p>
          </div>

          <div>
            <Label htmlFor="subject">Sujet *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Ex: Nouveaux spots ajoutés cette semaine"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="body">Message *</Label>
            <Textarea
              id="body"
              value={formData.body}
              onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
              placeholder="Écrivez votre message..."
              className="mt-1 h-48"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={sendEmailMutation.isPending}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              {sendEmailMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Envoyer
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}