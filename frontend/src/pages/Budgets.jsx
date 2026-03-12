import { useState, useEffect } from "react";
import { api } from "../App";
import { toast } from "sonner";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  Plus,
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
  MoreHorizontal,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Progress } from "../components/ui/progress";
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
  MoreHorizontal,
};

const categoryInfo = {
  alimentari: { icon: "ShoppingCart", color: "#14532D" },
  trasporti: { icon: "Car", color: "#EA580C" },
  casa: { icon: "Home", color: "#EAB308" },
  utenze: { icon: "Zap", color: "#78716C" },
  salute: { icon: "Heart", color: "#DC2626" },
  intrattenimento: { icon: "Film", color: "#7C3AED" },
  ristoranti: { icon: "UtensilsCrossed", color: "#F97316" },
  shopping: { icon: "ShoppingBag", color: "#EC4899" },
  istruzione: { icon: "GraduationCap", color: "#0EA5E9" },
  viaggi: { icon: "Plane", color: "#06B6D4" },
  sport: { icon: "Dumbbell", color: "#10B981" },
  abbonamenti: { icon: "CreditCard", color: "#6366F1" },
  altro: { icon: "MoreHorizontal", color: "#64748B" },
};

const categories = Object.entries(categoryInfo).map(([value, info]) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
  ...info,
}));

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
};

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const [formData, setFormData] = useState({
    category: "",
    amount: "",
  });

  useEffect(() => {
    fetchBudgets();
  }, [selectedMonth]);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/budgets?month=${selectedMonth}`);
      setBudgets(res.data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category || !formData.amount) {
      toast.error("Compila tutti i campi");
      return;
    }

    try {
      await api.post("/budgets", {
        ...formData,
        amount: parseFloat(formData.amount),
        month: selectedMonth,
      });

      toast.success("Budget creato!");
      setDialogOpen(false);
      setFormData({ category: "", amount: "" });
      fetchBudgets();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore nella creazione");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/budgets/${id}`);
      toast.success("Budget eliminato");
      fetchBudgets();
    } catch (error) {
      toast.error("Errore nell'eliminazione");
    }
  };

  const months = [];
  const now = new Date();
  for (let i = -1; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      value: d.toISOString().slice(0, 7),
      label: format(d, "MMMM yyyy", { locale: it }),
    });
  }

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  const existingCategories = budgets.map((b) => b.category);
  const availableCategories = categories.filter(
    (c) => !existingCategories.includes(c.value)
  );

  return (
    <div className="space-y-6" data-testid="budgets-page">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold">Budget</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Imposta limiti di spesa per categoria</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-48 input-focolare" data-testid="month-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="btn-primary w-full sm:w-auto"
                disabled={availableCategories.length === 0}
                data-testid="add-budget-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuovo Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">Nuovo Budget</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger className="input-focolare" data-testid="budget-category-select">
                      <SelectValue placeholder="Seleziona categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map((cat) => {
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
                  <Label>Importo Mensile (€)</Label>
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="500"
                    className="input-focolare"
                    data-testid="budget-amount-input"
                  />
                </div>

                <Button type="submit" className="btn-primary w-full" data-testid="submit-budget-btn">
                  Crea Budget
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="card-bento" data-testid="total-budget-card">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Budget Totale</p>
              <p className="font-heading text-lg sm:text-2xl font-bold truncate">{formatCurrency(totalBudget)}</p>
            </div>
          </div>
        </div>

        <div className="card-bento" data-testid="total-spent-card">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Speso</p>
              <p className="font-heading text-lg sm:text-2xl font-bold text-secondary truncate">
                {formatCurrency(totalSpent)}
              </p>
            </div>
          </div>
        </div>

        <div className="card-bento" data-testid="remaining-card">
          <div className="flex items-center gap-3 sm:gap-4">
            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                totalRemaining >= 0 ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"
              }`}
            >
              {totalRemaining >= 0 ? (
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Rimanente</p>
              <p
                className={`font-heading text-lg sm:text-2xl font-bold truncate ${
                  totalRemaining >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {formatCurrency(totalRemaining)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Budget List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card-bento h-40 skeleton-pulse bg-stone-200 dark:bg-stone-800" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="card-bento text-center py-12">
          <p className="text-muted-foreground mb-4">Nessun budget per questo mese</p>
          <Button onClick={() => setDialogOpen(true)} variant="outline" data-testid="add-first-budget">
            <Plus className="w-4 h-4 mr-2" />
            Crea il primo budget
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgets.map((budget) => {
            const info = categoryInfo[budget.category] || categoryInfo.altro;
            const IconComponent = iconMap[info.icon] || MoreHorizontal;
            const percentage = Math.min((budget.spent / budget.amount) * 100, 100);
            const isOverBudget = budget.spent > budget.amount;
            const remaining = budget.amount - budget.spent;

            return (
              <div key={budget.id} className="card-bento" data-testid={`budget-card-${budget.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${info.color}20` }}
                    >
                      <IconComponent className="w-6 h-6" style={{ color: info.color }} />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-semibold capitalize">
                        {budget.category}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(budget.id)}
                    className="text-muted-foreground hover:text-red-600"
                    data-testid={`delete-budget-${budget.id}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Progress
                    value={percentage}
                    className={`h-3 ${isOverBudget ? "[&>div]:bg-red-500" : "[&>div]:bg-primary"}`}
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{percentage.toFixed(0)}% utilizzato</span>
                    <span
                      className={`font-medium ${
                        remaining >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {remaining >= 0 ? `${formatCurrency(remaining)} rimanenti` : `${formatCurrency(Math.abs(remaining))} oltre il limite`}
                    </span>
                  </div>
                </div>

                {isOverBudget && (
                  <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-600 font-medium">Budget superato!</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Budgets;
