import { useState, useEffect } from "react";
import { api, useAuth } from "../App";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  Crown,
  User,
  Trash2,
  Mail,
  AlertCircle,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "../components/ui/dialog";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";

const Family = () => {
  const { user, updateUser } = useAuth();
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchFamily();
  }, []);

  const fetchFamily = async () => {
    setLoading(true);
    try {
      if (user?.family_id) {
        const res = await api.get("/family");
        setFamily(res.data);
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error("Error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFamily = async (e) => {
    e.preventDefault();

    if (!familyName.trim()) {
      toast.error("Inserisci un nome per la famiglia");
      return;
    }

    try {
      const res = await api.post("/family", { name: familyName });
      setFamily(res.data);
      updateUser({ ...user, family_id: res.data.id, role: "owner" });
      setCreateDialogOpen(false);
      setFamilyName("");
      toast.success("Famiglia creata con successo!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore nella creazione");
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();

    if (!inviteEmail.trim()) {
      toast.error("Inserisci un'email");
      return;
    }

    setInviting(true);
    try {
      await api.post("/family/invite", { email: inviteEmail });
      toast.success("Membro aggiunto con successo!");
      setDialogOpen(false);
      setInviteEmail("");
      fetchFamily();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore nell'invito");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await api.delete(`/family/member/${memberId}`);
      toast.success("Membro rimosso");
      fetchFamily();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore nella rimozione");
    }
  };

  const getInitials = (name) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";
  };

  const isOwner = user?.role === "owner";

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card-bento h-32 skeleton-pulse bg-stone-200 dark:bg-stone-800" />
        <div className="card-bento h-64 skeleton-pulse bg-stone-200 dark:bg-stone-800" />
      </div>
    );
  }

  // No family state
  if (!family) {
    return (
      <div className="space-y-6" data-testid="family-page">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold">Famiglia</h1>
          <p className="text-muted-foreground mt-1">Gestisci i membri della tua famiglia</p>
        </div>

        <div className="card-bento text-center py-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Users className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-heading text-2xl font-bold mb-3">Crea la tua Famiglia</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Crea un gruppo famiglia per condividere il budget con i tuoi familiari e tracciare le spese insieme.
          </p>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary" data-testid="create-family-btn">
                <UserPlus className="w-4 h-4 mr-2" />
                Crea Famiglia
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">Crea Famiglia</DialogTitle>
                <DialogDescription>
                  Scegli un nome per il tuo gruppo famiglia
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateFamily} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Nome Famiglia</Label>
                  <Input
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    placeholder="Es. Famiglia Rossi"
                    className="input-focolare"
                    data-testid="family-name-input"
                  />
                </div>
                <Button type="submit" className="btn-primary w-full" data-testid="submit-create-family">
                  Crea Famiglia
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="family-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold">Famiglia</h1>
          <p className="text-muted-foreground mt-1">Gestisci i membri della tua famiglia</p>
        </div>

        {isOwner && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary" data-testid="invite-member-btn">
                <UserPlus className="w-4 h-4 mr-2" />
                Invita Membro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">Invita Membro</DialogTitle>
                <DialogDescription>
                  Aggiungi un familiare inserendo la sua email. Deve essere già registrato su Focolare.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="membro@esempio.it"
                    className="input-focolare"
                    data-testid="invite-email-input"
                  />
                </div>
                <Button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={inviting}
                  data-testid="submit-invite"
                >
                  {inviting ? "Invio in corso..." : "Aggiungi Membro"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Family Info Card */}
      <div className="card-bento" data-testid="family-info-card">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="font-heading text-2xl font-bold">{family.name}</h2>
            <p className="text-muted-foreground">
              {family.members?.length || 0} membri
            </p>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="card-bento" data-testid="members-list">
        <h3 className="font-heading text-lg font-semibold mb-4">Membri</h3>
        <div className="space-y-4">
          {family.members?.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 rounded-xl bg-stone-50 dark:bg-stone-900"
              data-testid={`member-${member.id}`}
            >
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{member.name}</p>
                    {member.role === "owner" && (
                      <Crown className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-3 h-3" />
                    {member.email}
                  </div>
                </div>
              </div>

              {isOwner && member.id !== user?.id && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-red-600"
                      data-testid={`remove-member-${member.id}`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Rimuovere {member.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Questa azione rimuoverà il membro dalla famiglia. Potrà essere invitato nuovamente in seguito.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annulla</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleRemoveMember(member.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Rimuovi
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {member.id === user?.id && (
                <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  Tu
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      {!isOwner && (
        <div className="card-bento bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Sei un membro della famiglia
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Solo il proprietario può invitare o rimuovere membri.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Family;
