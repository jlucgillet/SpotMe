
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import { Users, Loader2, X, Shield, Mail, Check } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const PRESET_COLORS = [
  "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", 
  "#f59e0b", "#ef4444", "#06b6d4", "#84cc16"
];

const getDefaultWelcomeEmail = (communityName, senderName) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #0d9488 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🗺️ Bienvenue sur <a href="https://spotme.base44.app/" style="color: white; text-decoration: none;">SpotMe</a> !</h1>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <p style="font-size: 16px; margin-bottom: 20px;">Bonjour,</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      <strong>${senderName}</strong> vous a ajouté(e) à la communauté <strong style="color: #10b981;">"${communityName}"</strong> sur <a href="https://spotme.base44.app/" style="color: #10b981; text-decoration: none; font-weight: 600;">SpotMe</a> !
    </p>
    
    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 4px;">
      <h2 style="color: #10b981; margin-top: 0; font-size: 20px;">🗺️ Qu'est-ce que <a href="https://spotme.base44.app/" style="color: #10b981; text-decoration: none;">SpotMe</a> ?</h2>
      <p style="margin-bottom: 0;">
        SpotMe est une application qui permet de partager des lieux remarquables avec vos proches. Que ce soit des spots de camping sauvage, des aires de stationnement pour van, des sites de parapente ou simplement des endroits magnifiques à découvrir, SpotMe vous permet de créer une carte collaborative avec votre communauté.
      </p>
    </div>
    
    <h2 style="color: #0d9488; font-size: 20px; margin-top: 30px;">📍 Comment ça marche ?</h2>
    <ol style="line-height: 1.8; padding-left: 20px;">
      <li>Connectez-vous sur l'application avec votre email</li>
      <li>Vous verrez automatiquement tous les spots partagés par votre communauté</li>
      <li>Ajoutez vos propres découvertes en cliquant sur "Ajouter un spot"</li>
      <li>Partagez des photos, des descriptions et des conseils pratiques</li>
    </ol>
    
    <h2 style="color: #0d9488; font-size: 20px; margin-top: 30px;">🌟 Pourquoi c'est utile ?</h2>
    <ul style="line-height: 1.8; padding-left: 20px;">
      <li>Gardez une trace de vos endroits préférés</li>
      <li>Partagez vos découvertes avec vos proches</li>
      <li>Découvrez de nouveaux lieux recommandés par votre communauté</li>
      <li>Organisez vos voyages et aventures ensemble</li>
    </ul>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="https://spotme.base44.app/" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4); border: 2px solid #047857;">
        🚀 Accéder à SpotMe
      </a>
    </div>
    
    <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin-top: 30px;">
      <p style="margin: 0; font-size: 14px; color: #1e40af;">
        💡 <strong>Astuce :</strong> Ajoutez vos premiers spots pour que votre communauté puisse découvrir vos endroits préférés !
      </p>
    </div>
    
    <p style="margin-top: 40px; color: #6b7280; font-size: 14px; text-align: center;">
      À bientôt sur <a href="https://spotme.base44.app/" style="color: #10b981; text-decoration: none;">SpotMe</a>,<br>
      <strong>L'équipe SpotMe</strong>
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0;"><a href="https://spotme.base44.app/" style="color: #9ca3af; text-decoration: none;">SpotMe</a> - Partagez vos spots avec votre communauté</p>
  </div>
</body>
</html>`;

export default function EditCommunityDialog({ community, open, onOpenChange, onCommunityUpdated }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#10b981",
    member_emails: [],
    admin_emails: []
  });
  const [emailInput, setEmailInput] = useState("");
  const [adminEmailInput, setAdminEmailInput] = useState("");
  const [pendingEmail, setPendingEmail] = useState(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (community) {
      setFormData({
        name: community.name || "",
        description: community.description || "",
        color: community.color || "#10b981",
        member_emails: community.member_emails || [],
        admin_emails: community.admin_emails || []
      });
    }
  }, [community]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Community.update(community.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      toast.success("Communauté modifiée avec succès !");
      onCommunityUpdated();
    },
    onError: () => {
      toast.error("Erreur lors de la modification de la communauté");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Veuillez saisir un nom");
      return;
    }
    
    if (formData.admin_emails.length === 0) {
      toast.error("Une communauté doit avoir au moins un administrateur");
      return;
    }
    
    updateMutation.mutate(formData);
  };

  const handleAddEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Email invalide");
      return;
    }

    if (formData.member_emails.includes(email)) {
      toast.error("Cet email est déjà ajouté");
      return;
    }

    const isNewMember = !community.member_emails?.includes(email);
    
    if (isNewMember) {
      setPendingEmail(email);
      setEmailSubject(`Bienvenue dans la communauté "${formData.name}" sur SpotMe`);
      const senderName = user?.full_name || user?.email || "Un membre";
      setEmailBody(getDefaultWelcomeEmail(formData.name, senderName));
      setSendEmail(true);
      setEmailDialogOpen(true);
    } else {
      setFormData(prev => ({
        ...prev,
        member_emails: [...prev.member_emails, email]
      }));
      setEmailInput("");
    }
  };

  const handleConfirmEmail = async () => {
    if (!pendingEmail) return;

    setIsSendingEmail(true);

    setFormData(prev => ({
      ...prev,
      member_emails: [...prev.member_emails, pendingEmail]
    }));

    if (sendEmail) {
      try {
        await base44.integrations.Core.SendEmail({
          from_name: `${formData.name} (SpotMe)`,
          to: pendingEmail,
          subject: emailSubject,
          body: emailBody
        });
        toast.success(`Email envoyé à ${pendingEmail}`);
      } catch (error) {
        toast.error(`Erreur lors de l'envoi de l'email`);
      }
    }

    setIsSendingEmail(false);
    setEmailDialogOpen(false);
    setPendingEmail(null);
    setEmailInput("");
  };

  const handleRemoveEmail = (email) => {
    setFormData(prev => ({
      ...prev,
      member_emails: prev.member_emails.filter(e => e !== email)
    }));
  };

  const handleAddAdmin = () => {
    const email = adminEmailInput.trim().toLowerCase();
    if (!email) return;
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Email invalide");
      return;
    }

    if (formData.admin_emails.includes(email)) {
      toast.error("Cet email est déjà administrateur");
      return;
    }

    setFormData(prev => ({
      ...prev,
      admin_emails: [...prev.admin_emails, email]
    }));
    setAdminEmailInput("");
  };

  const handleRemoveAdmin = (email) => {
    if (formData.admin_emails.length === 1) {
      toast.error("Une communauté doit avoir au moins un administrateur");
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      admin_emails: prev.admin_emails.filter(e => e !== email)
    }));
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ]
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-600" />
              Modifier la communauté
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Nom de la communauté *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Famille Gillet, Copains, Collègues..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez cette communauté..."
                className="mt-1 h-20"
              />
            </div>

            <div>
              <Label>Couleur</Label>
              <div className="flex gap-2 mt-2">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      formData.color === color ? 'border-gray-900 scale-110' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="admin-email" className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                Administrateurs *
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="admin-email"
                  type="email"
                  value={adminEmailInput}
                  onChange={(e) => setAdminEmailInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAdmin())}
                  placeholder="email@example.com"
                />
                <Button
                  type="button"
                  onClick={handleAddAdmin}
                  variant="outline"
                >
                  Ajouter
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Les administrateurs peuvent modifier la communauté
              </p>
              {formData.admin_emails.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.admin_emails.map(email => (
                    <Badge key={email} className="gap-1 bg-emerald-100 text-emerald-700 border-emerald-200">
                      <Shield className="w-3 h-3" />
                      {email}
                      <button
                        type="button"
                        onClick={() => handleRemoveAdmin(email)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="email">Membres</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="email"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEmail())}
                  placeholder="email@example.com"
                />
                <Button
                  type="button"
                  onClick={handleAddEmail}
                  variant="outline"
                >
                  Ajouter
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Un email de bienvenue sera proposé pour chaque nouveau membre
              </p>
              {formData.member_emails.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.member_emails.map(email => (
                    <Badge key={email} variant="secondary" className="gap-1">
                      {email}
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(email)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
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
                disabled={updateMutation.isPending}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Modification...
                  </>
                ) : (
                  "Enregistrer"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-600" />
              Email de bienvenue pour {pendingEmail}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Personnalisez le message de bienvenue qui sera envoyé au nouveau membre.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="send-email"
                checked={sendEmail}
                onCheckedChange={setSendEmail}
              />
              <label
                htmlFor="send-email"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Envoyer l'email de bienvenue
              </label>
            </div>

            {sendEmail && (
              <>
                <div>
                  <Label htmlFor="email-subject">Objet de l'email</Label>
                  <Input
                    id="email-subject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Objet de l'email"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email-body">Message</Label>
                  <div className="mt-1 border rounded-md">
                    <ReactQuill
                      value={emailBody}
                      onChange={setEmailBody}
                      modules={quillModules}
                      theme="snow"
                      style={{ height: '400px', marginBottom: '50px' }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setEmailDialogOpen(false);
              setPendingEmail(null);
            }}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmEmail}
              disabled={isSendingEmail}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {sendEmail ? "Ajouter et envoyer" : "Ajouter sans email"}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
