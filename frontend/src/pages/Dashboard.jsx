import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, useAuth } from "../App";
import { toast } from "sonner";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Plus,
  RefreshCw,
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
  Gift,
  MoreHorizontal,
  Users
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

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

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
};

const Dashboard = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasFamily, setHasFamily] = useState(!!user?.family_id);

  useEffect(() => {
    if (user?.family_id) {
      setHasFamily(true);
      fetchData(user.family_id);
    } else {
      setHasFamily(false);
      setLoading(false);
    }
  }, [user?.family_id]);

  const fetchData = async (familyId) => {
    if (!familyId) return;
    setLoading(true);
    try {
      const [statsRes, monthlyRes, transRes, budgetsRes] = await Promise.all([
        api.get("/stats/overview"),
        api.get("/stats/monthly?months=6"),
        api.get("/transactions?limit=5"),
        api.get(`/budgets?month=${new Date().toISOString().slice(0, 7)}`),
      ]);

      setStats(statsRes.data);
      setMonthlyData(monthlyRes.data);
      setTransactions(transRes.data);
      setBudgets(budgetsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.response?.status !== 404) {
        toast.error("Errore nel caricamento dei dati");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFamily = async () => {
    try {
      const res = await api.post("/family", { name: `Famiglia ${user.name.split(" ")[0]}` });
      const updatedUser = { ...user, family_id: res.data.id, role: "owner" };
      updateUser(updatedUser);
      toast.success("Famiglia creata con successo!");
      // useEffect will trigger fetchData when user.family_id updates
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore nella creazione della famiglia");
    }
  };

  // No family state
  if (!hasFamily && !loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="card-bento max-w-md text-center p-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-heading text-2xl font-bold mb-3">Crea la tua Famiglia</h2>
          <p className="text-muted-foreground mb-6">
            Per iniziare a gestire il budget, crea prima un gruppo famiglia. Potrai poi invitare altri membri.
          </p>
          <Button onClick={handleCreateFamily} className="btn-primary" data-testid="create-family-btn">
            Crea Famiglia
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-bento h-32 skeleton-pulse bg-stone-200 dark:bg-stone-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="card-bento h-80 skeleton-pulse bg-stone-200 dark:bg-stone-800" />
          ))}
        </div>
      </div>
    );
  }

  const chartColors = ["#14532D", "#EA580C", "#EAB308", "#78716C", "#064E3B", "#DC2626"];

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold">
            Ciao, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Ecco il riepilogo del tuo budget familiare</p>
        </div>
        <Button onClick={() => fetchData(user?.family_id)} variant="outline" className="btn-secondary w-full sm:w-auto sm:self-start" data-testid="refresh-btn">
          <RefreshCw className="w-4 h-4 mr-2" />
          Aggiorna
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Total Balance */}
        <div className="card-bento" data-testid="balance-card">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Saldo Totale</p>
              <p className="font-heading text-lg sm:text-2xl font-bold truncate">
                {formatCurrency(stats?.total_balance || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Monthly Income */}
        <div className="card-bento" data-testid="income-card">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Entrate Mese</p>
              <p className="font-heading text-lg sm:text-2xl font-bold text-emerald-600 truncate">
                +{formatCurrency(stats?.monthly_income || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="card-bento sm:col-span-2 md:col-span-1" data-testid="expenses-card">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Uscite Mese</p>
              <p className="font-heading text-lg sm:text-2xl font-bold text-red-600 truncate">
                -{formatCurrency(stats?.monthly_expenses || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <div className="card-bento" data-testid="monthly-chart">
          <h3 className="font-heading text-lg font-semibold mb-4">Andamento Mensile</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barGap={8}>
                <XAxis
                  dataKey="month"
                  tickFormatter={(v) => {
                    const [year, month] = v.split("-");
                    const months = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
                    return months[parseInt(month) - 1];
                  }}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#78716C", fontSize: 12 }}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E7E5E4",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                  formatter={(value, name) => [
                    formatCurrency(value),
                    name === "income" ? "Entrate" : "Uscite",
                  ]}
                  labelFormatter={(label) => {
                    const [year, month] = label.split("-");
                    const months = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
                    return `${months[parseInt(month) - 1]} ${year}`;
                  }}
                />
                <Bar dataKey="income" fill="#14532D" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" fill="#EA580C" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-sm text-muted-foreground">Entrate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-secondary" />
              <span className="text-sm text-muted-foreground">Uscite</span>
            </div>
          </div>
        </div>

        {/* Categories Pie Chart */}
        <div className="card-bento" data-testid="categories-chart">
          <h3 className="font-heading text-lg font-semibold mb-4">Spese per Categoria</h3>
          {stats?.categories?.length > 0 ? (
            <div className="flex items-center gap-6">
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categories}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {stats.categories.map((entry, index) => (
                        <Cell key={entry.category} fill={entry.color || chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #E7E5E4",
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                      formatter={(value) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                {stats.categories.slice(0, 5).map((cat, i) => {
                  const IconComponent = iconMap[cat.icon] || MoreHorizontal;
                  return (
                    <div key={cat.category} className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${cat.color}20` }}
                      >
                        <IconComponent className="w-4 h-4" style={{ color: cat.color }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium capitalize">{cat.category}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(cat.amount)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <p>Nessuna spesa questo mese</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="card-bento" data-testid="recent-transactions">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-lg font-semibold">Transazioni Recenti</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/transactions")}
              className="text-primary"
              data-testid="view-all-transactions-btn"
            >
              Vedi tutte
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((t) => {
                const IconComponent = iconMap[t.icon] || MoreHorizontal;
                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-4 p-3 rounded-xl transaction-item"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${t.is_expense ? "#EA580C" : "#14532D"}15` }}
                    >
                      <IconComponent
                        className="w-5 h-5"
                        style={{ color: t.is_expense ? "#EA580C" : "#14532D" }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{t.description}</p>
                      <p className="text-xs text-muted-foreground capitalize">{t.category}</p>
                    </div>
                    <p className={`font-semibold ${t.is_expense ? "text-red-600" : "text-emerald-600"}`}>
                      {t.is_expense ? "-" : "+"}{formatCurrency(t.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-muted-foreground">
              <p className="mb-4">Nessuna transazione</p>
              <Button
                onClick={() => navigate("/transactions")}
                variant="outline"
                size="sm"
                data-testid="add-first-transaction-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Aggiungi transazione
              </Button>
            </div>
          )}
        </div>

        {/* Budget Overview */}
        <div className="card-bento" data-testid="budget-overview">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-lg font-semibold">Budget del Mese</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/budgets")}
              className="text-primary"
              data-testid="view-all-budgets-btn"
            >
              Gestisci
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          {budgets.length > 0 ? (
            <div className="space-y-4">
              {budgets.slice(0, 4).map((budget) => {
                const percentage = Math.min((budget.spent / budget.amount) * 100, 100);
                const isOverBudget = budget.spent > budget.amount;
                return (
                  <div key={budget.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium capitalize">{budget.category}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                      </p>
                    </div>
                    <Progress
                      value={percentage}
                      className={`h-2 ${isOverBudget ? "[&>div]:bg-red-500" : "[&>div]:bg-primary"}`}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-muted-foreground">
              <p className="mb-4">Nessun budget impostato</p>
              <Button
                onClick={() => navigate("/budgets")}
                variant="outline"
                size="sm"
                data-testid="add-first-budget-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crea budget
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
