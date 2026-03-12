import { useState, useEffect } from "react";
import { api } from "../App";
import { toast } from "sonner";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  Plus,
  Search,
  Filter,
  Trash2,
  ShoppingCart,
  Car,
  Home,
  Zap,
  Heart,
  Film,
  UtensilsCrossed,
  ShoppingBag,
  GraduationCap,
  Plane,
  Dumbbell,
  CreditCard,
  Wallet,
  Gift,
  MoreHorizontal,
  X,
  Calendar as CalendarIcon
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Switch } from "../components/ui/switch";

const iconMap = {
  ShoppingCart,
  Car,
  Home,
  Zap,
  Heart,
  Film,
  UtensilsCrossed,
  ShoppingBag,
  GraduationCap,
  Plane,
  Dumbbell,
  CreditCard,
  Wallet,
  Gift,
  MoreHorizontal,
};

const categories = [
  { value: "alimentari", label: "Alimentari", icon: "ShoppingCart" },
  { value: "trasporti", label: "Trasporti", icon: "Car" },
  { value: "casa", label: "Casa", icon: "Home" },
  { value: "utenze", label: "Utenze", icon: "Zap" },
  { value: "salute", label: "Salute", icon: "Heart" },
  { value: "intrattenimento", label: "Intrattenimento", icon: "Film" },
  { value: "ristoranti", label: "Ristoranti", icon: "UtensilsCrossed" },
  { value: "shopping", label: "Shopping", icon: "ShoppingBag" },
  { value: "istruzione", label: "Istruzione", icon: "GraduationCap" },
  { value: "viaggi", label: "Viaggi", icon: "Plane" },
  { value: "sport", label: "Sport", icon: "Dumbbell" },
  { value: "abbonamenti", label: "Abbonamenti", icon: "CreditCard" },
  { value: "stipendio", label: "Stipendio", icon: "Wallet" },
  { value: "bonus", label: "Bonus", icon: "Gift" },
  { value: "altro", label: "Altro", icon: "MoreHorizontal" },
];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
};

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
    account_id: "",
    date: new Date(),
    is_expense: true,
  });

  useEffect(() => {
    fetchData();
  }, [categoryFilter, monthFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = "/transactions?limit=100";
      if (categoryFilter) url += `&category=${categoryFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;

      const [transRes, accountsRes] = await Promise.all([
        api.get(url),
        api.get("/bank-accounts"),
      ]);

      setTransactions(transRes.data);
      setAccounts(accountsRes.data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.description || !formData.amount || !formData.category) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }

    try {
      await api.post("/transactions", {
        ...formData,
        amount: parseFloat(formData.amount),
        date: formData.date.toISOString(),
        account_id: formData.account_id || null,
      });

      toast.success("Transazione aggiunta!");
      setDialogOpen(false);
      setFormData({
        description: "",
        amount: "",
        category: "",
        account_id: "",
        date: new Date(),
        is_expense: true,
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore nell'aggiunta");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
      toast.success("Transazione eliminata");
      fetchData();
    } catch (error) {
      toast.error("Errore nell'eliminazione");
    }
  };

  const filteredTransactions = transactions.filter((t) =>
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
    const date = transaction.date.split("T")[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {});

  const months = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      value: d.toISOString().slice(0, 7),
      label: format(d, "MMMM yyyy", { locale: it }),
    });
  }

  return (
    <div className="space-y-6" data-testid="transactions-page">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold">Transazioni</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Gestisci le tue entrate e uscite</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary w-full sm:w-auto" data-testid="add-transaction-btn">
              <Plus className="w-4 h-4 mr-2" />
              Nuova Transazione
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">Nuova Transazione</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Type Switch */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50 dark:bg-stone-900">
                <span className={`font-medium ${formData.is_expense ? "text-muted-foreground" : "text-emerald-600"}`}>
                  Entrata
                </span>
                <Switch
                  checked={formData.is_expense}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_expense: checked })}
                  data-testid="transaction-type-switch"
                />
                <span className={`font-medium ${formData.is_expense ? "text-red-600" : "text-muted-foreground"}`}>
                  Uscita
                </span>
              </div>

              <div className="space-y-2">
                <Label>Descrizione *</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Es. Spesa supermercato"
                  className="input-focolare"
                  data-testid="transaction-description-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Importo (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="input-focolare"
                  data-testid="transaction-amount-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger className="input-focolare" data-testid="transaction-category-select">
                    <SelectValue placeholder="Seleziona categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => {
                      const Icon = iconMap[cat.icon];
                      return (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {cat.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Conto (opzionale)</Label>
                <Select
                  value={formData.account_id}
                  onValueChange={(v) => setFormData({ ...formData, account_id: v })}
                >
                  <SelectTrigger className="input-focolare" data-testid="transaction-account-select">
                    <SelectValue placeholder="Seleziona conto" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name} - {acc.institution}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left input-focolare"
                      data-testid="transaction-date-btn"
                    >
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {format(formData.date, "dd MMMM yyyy", { locale: it })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => date && setFormData({ ...formData, date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button type="submit" className="btn-primary w-full" data-testid="submit-transaction-btn">
                Aggiungi Transazione
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="card-bento">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Cerca transazioni..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-focolare"
              data-testid="search-transactions-input"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex gap-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="input-focolare" data-testid="category-filter-select">
                <Filter className="w-4 h-4 mr-2 flex-shrink-0" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tutte</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="input-focolare" data-testid="month-filter-select">
                <CalendarIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                <SelectValue placeholder="Mese" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tutti</SelectItem>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(categoryFilter || monthFilter) && (
            <Button
              variant="ghost"
              onClick={() => {
                setCategoryFilter("");
                setMonthFilter("");
              }}
              className="text-muted-foreground w-full sm:w-auto"
              data-testid="clear-filters-btn"
            >
              <X className="w-4 h-4 mr-2" />
              Cancella filtri
            </Button>
          )}
        </div>
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card-bento h-20 skeleton-pulse bg-stone-200 dark:bg-stone-800" />
          ))}
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="card-bento text-center py-12">
          <p className="text-muted-foreground mb-4">Nessuna transazione trovata</p>
          <Button onClick={() => setDialogOpen(true)} variant="outline" data-testid="add-first-transaction-empty">
            <Plus className="w-4 h-4 mr-2" />
            Aggiungi la prima transazione
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTransactions)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, items]) => (
              <div key={date}>
                <h3 className="font-medium text-muted-foreground mb-3 px-2">
                  {format(new Date(date), "EEEE d MMMM yyyy", { locale: it })}
                </h3>
                <div className="card-bento divide-y divide-border">
                  {items.map((t) => {
                    const IconComponent = iconMap[t.icon] || MoreHorizontal;
                    return (
                      <div
                        key={t.id}
                        className="flex items-center gap-4 py-4 first:pt-0 last:pb-0 transaction-item"
                        data-testid={`transaction-item-${t.id}`}
                      >
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${t.is_expense ? "#EA580C" : "#14532D"}15` }}
                        >
                          <IconComponent
                            className="w-6 h-6"
                            style={{ color: t.is_expense ? "#EA580C" : "#14532D" }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{t.description}</p>
                          <p className="text-sm text-muted-foreground capitalize">{t.category}</p>
                        </div>
                        <p className={`font-semibold text-lg ${t.is_expense ? "text-red-600" : "text-emerald-600"}`}>
                          {t.is_expense ? "-" : "+"}{formatCurrency(t.amount)}
                        </p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="flex-shrink-0">
                              <MoreHorizontal className="w-5 h-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleDelete(t.id)}
                              className="text-red-600"
                              data-testid={`delete-transaction-${t.id}`}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Elimina
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default Transactions;
