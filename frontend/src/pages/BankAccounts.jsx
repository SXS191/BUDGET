import { useState, useEffect } from "react";
import { api } from "../App";
import { toast } from "sonner";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  Plus,
  Trash2,
  Building2,
  RefreshCw,
  CreditCard,
  Wallet,
  PiggyBank,
  Link2,
  Link2Off,
  MoreHorizontal,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Alert, AlertDescription } from "../components/ui/alert";

const accountTypeIcons = {
  checking: Wallet,
  savings: PiggyBank,
  credit: CreditCard,
};

const accountTypeLabels = {
  checking: "Conto Corrente",
  savings: "Conto Risparmio",
  credit: "Carta di Credito",
};

const banks = [
  "Intesa Sanpaolo",
  "UniCredit",
  "BNL",
  "Monte dei Paschi",
  "Banco BPM",
  "BPER Banca",
  "Poste Italiane",
  "Fineco",
  "N26",
  "Revolut",
  "Hype",
  "Altro",
];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
};

const BankAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [syncingId, setSyncingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    institution: "",
    account_type: "",
    balance: "",
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/bank-accounts");
      setAccounts(res.data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.institution || !formData.account_type) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }

    try {
      await api.post("/bank-accounts", {
        ...formData,
        balance: parseFloat(formData.balance) || 0,
      });

      toast.success("Conto aggiunto!");
      setDialogOpen(false);
      setFormData({
        name: "",
        institution: "",
        account_type: "",
        balance: "",
      });
      fetchAccounts();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore nell'aggiunta");
    }
  };

  const handleSync = async (accountId) => {
    setSyncingId(accountId);
    try {
      const res = await api.post(`/bank-accounts/${accountId}/sync`);
      toast.success(res.data.message);
      fetchAccounts();
    } catch (error) {
      toast.error("Errore nella sincronizzazione");
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/bank-accounts/${id}`);
      toast.success("Conto eliminato");
      fetchAccounts();
    } catch (error) {
      toast.error("Errore nell'eliminazione");
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="space-y-6" data-testid="bank-accounts-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold">Conti Bancari</h1>
          <p className="text-muted-foreground mt-1">Collega e gestisci i tuoi conti</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary" data-testid="add-account-btn">
              <Plus className="w-4 h-4 mr-2" />
              Aggiungi Conto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">Aggiungi Conto</DialogTitle>
              <DialogDescription>
                Collega un nuovo conto bancario per tracciare le transazioni
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nome del Conto *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Es. Conto principale"
                  className="input-focolare"
                  data-testid="account-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Banca *</Label>
                <Select
                  value={formData.institution}
                  onValueChange={(v) => setFormData({ ...formData, institution: v })}
                >
                  <SelectTrigger className="input-focolare" data-testid="account-bank-select">
                    <SelectValue placeholder="Seleziona banca" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((bank) => (
                      <SelectItem key={bank} value={bank}>
                        {bank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo di Conto *</Label>
                <Select
                  value={formData.account_type}
                  onValueChange={(v) => setFormData({ ...formData, account_type: v })}
                >
                  <SelectTrigger className="input-focolare" data-testid="account-type-select">
                    <SelectValue placeholder="Seleziona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Conto Corrente</SelectItem>
                    <SelectItem value="savings">Conto Risparmio</SelectItem>
                    <SelectItem value="credit">Carta di Credito</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Saldo Iniziale (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                  placeholder="0.00"
                  className="input-focolare"
                  data-testid="account-balance-input"
                />
              </div>

              <Button type="submit" className="btn-primary w-full" data-testid="submit-account-btn">
                Aggiungi Conto
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mock Info Alert */}
      <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/20">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          <strong>Modalità Demo:</strong> La sincronizzazione bancaria è simulata. Per collegare conti reali, configura le chiavi API Plaid nel backend.
        </AlertDescription>
      </Alert>

      {/* Total Balance Card */}
      <div className="card-bento" data-testid="total-balance-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo Totale</p>
              <p className="font-heading text-3xl font-bold">{formatCurrency(totalBalance)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">{accounts.length} conti collegati</p>
          </div>
        </div>
      </div>

      {/* Accounts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-bento h-48 skeleton-pulse bg-stone-200 dark:bg-stone-800" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="card-bento text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
            <Link2Off className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">Nessun conto collegato</p>
          <Button onClick={() => setDialogOpen(true)} variant="outline" data-testid="add-first-account">
            <Plus className="w-4 h-4 mr-2" />
            Aggiungi il primo conto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => {
            const Icon = accountTypeIcons[account.account_type] || Wallet;
            const typeLabel = accountTypeLabels[account.account_type] || "Conto";
            const isSyncing = syncingId === account.id;

            return (
              <div key={account.id} className="card-bento" data-testid={`account-card-${account.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-semibold">{account.name}</h3>
                      <p className="text-sm text-muted-foreground">{account.institution}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleDelete(account.id)}
                        className="text-red-600"
                        data-testid={`delete-account-${account.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Elimina
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-1">{typeLabel}</p>
                  <p className="font-heading text-2xl font-bold">
                    {formatCurrency(account.balance)}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className={`w-2 h-2 rounded-full ${account.is_connected ? "bg-emerald-500" : "bg-red-500"}`} />
                    <span>{account.is_connected ? "Connesso" : "Disconnesso"}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSync(account.id)}
                    disabled={isSyncing}
                    className="text-primary"
                    data-testid={`sync-account-${account.id}`}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                    {isSyncing ? "Sincronizzando..." : "Sincronizza"}
                  </Button>
                </div>

                {account.last_synced && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Ultima sync: {format(new Date(account.last_synced), "dd MMM HH:mm", { locale: it })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BankAccounts;
