
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

export default function CommentSection({ spotId, user, comments }) {
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState(0);
  const queryClient = useQueryClient();

  const createCommentMutation = useMutation({
    mutationFn: (data) => base44.entities.Comment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', spotId] });
      setNewComment("");
      setRating(0);
      toast.success("Commentaire ajouté !");
    },
    onError: () => {
      toast.error("Erreur lors de l'ajout du commentaire");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      toast.error("Veuillez écrire un commentaire");
      return;
    }

    if (newComment.trim() && rating === 0) {
      toast.error("Veuillez donner une note");
      return;
    }

    createCommentMutation.mutate({
      spot_id: spotId,
      content: newComment,
      rating: rating || undefined
    });
  };

  return (
    <div className="space-y-4">
      {/* Add Comment */}
      {user ? (
        <Card className="border-emerald-100">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
                {newComment.trim() && rating === 0 && (
                  <span className="text-xs text-red-500 ml-2 self-center">*Note obligatoire</span>
                )}
              </div>
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Partagez votre expérience sur ce spot..."
                className="resize-none"
                rows={3}
              />
              <Button
                type="submit"
                disabled={createCommentMutation.isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {createCommentMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Publier
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-emerald-100 bg-emerald-50/50">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-600 mb-3">
              Connectez-vous pour laisser un commentaire
            </p>
            <Button
              onClick={() => base44.auth.redirectToLogin()}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Se connecter
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-4">
            Aucun commentaire pour le moment
          </p>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="border-gray-100">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 bg-emerald-100">
                    <AvatarFallback className="text-emerald-700 text-xs">
                      {comment.created_by?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {comment.created_by}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(comment.created_date), "d MMM yyyy", { locale: fr })}
                      </p>
                    </div>
                    {comment.rating && (
                      <div className="flex gap-0.5 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < comment.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
