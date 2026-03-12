import { useState, useEffect } from "react";
import { api, useAuth } from "../App";
import { toast } from "sonner";
import {
  Settings as SettingsIcon,
  Bell,
  BellOff,
  Mail,
  User,
  Shield,
  Moon,
  Sun,
  Check,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";

const Settings = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    push_enabled: true,
    email_enabled: false,
    transaction_alerts: true,
    budget_alerts: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    fetchSettings();
    // Check initial dark mode
    setDarkMode(document.documentElement.classList.contains("dark"));
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get("/settings/notifications");
      setNotifications(res.data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await api.put("/settings/notifications", notifications);
      toast.success("Impostazioni salvate!");
    } catch (error) {
      toast.error("Errore nel salvataggio");
    } finally {
      setSaving(false);
    }
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleNotificationChange = (key, value) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card-bento h-32 skeleton-pulse bg-stone-200 dark:bg-stone-800" />
        <div className="card-bento h-64 skeleton-pulse bg-stone-200 dark:bg-stone-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl" data-testid="settings-page">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl md:text-4xl font-bold">Impostazioni</h1>
        <p className="text-muted-foreground mt-1">Gestisci le preferenze del tuo account</p>
      </div>

      {/* Profile Section */}
      <div className="card-bento" data-testid="profile-section">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-5 h-5 text-primary" />
          <h2 className="font-heading text-lg font-semibold">Profilo</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50 dark:bg-stone-900">
            <div>
              <p className="text-sm text-muted-foreground">Nome</p>
              <p className="font-medium">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50 dark:bg-stone-900">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50 dark:bg-stone-900">
            <div>
              <p className="text-sm text-muted-foreground">Ruolo</p>
              <p className="font-medium capitalize">{user?.role === "owner" ? "Proprietario" : "Membro"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Appearance Section */}
      <div className="card-bento" data-testid="appearance-section">
        <div className="flex items-center gap-3 mb-4">
          {darkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
          <h2 className="font-heading text-lg font-semibold">Aspetto</h2>
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50 dark:bg-stone-900">
          <div>
            <p className="font-medium">Modalità scura</p>
            <p className="text-sm text-muted-foreground">Attiva il tema scuro per ridurre l'affaticamento degli occhi</p>
          </div>
          <Switch
            checked={darkMode}
            onCheckedChange={toggleDarkMode}
            data-testid="dark-mode-switch"
          />
        </div>
      </div>

      {/* Notifications Section */}
      <div className="card-bento" data-testid="notifications-section">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="font-heading text-lg font-semibold">Notifiche</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50 dark:bg-stone-900">
            <div>
              <p className="font-medium">Notifiche push</p>
              <p className="text-sm text-muted-foreground">Ricevi notifiche nel browser</p>
            </div>
            <Switch
              checked={notifications.push_enabled}
              onCheckedChange={(v) => handleNotificationChange("push_enabled", v)}
              data-testid="push-notifications-switch"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50 dark:bg-stone-900">
            <div>
              <p className="font-medium">Notifiche email</p>
              <p className="text-sm text-muted-foreground">Ricevi aggiornamenti via email</p>
            </div>
            <Switch
              checked={notifications.email_enabled}
              onCheckedChange={(v) => handleNotificationChange("email_enabled", v)}
              data-testid="email-notifications-switch"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50 dark:bg-stone-900">
            <div>
              <p className="font-medium">Alert transazioni</p>
              <p className="text-sm text-muted-foreground">Notifica quando viene aggiunta una transazione</p>
            </div>
            <Switch
              checked={notifications.transaction_alerts}
              onCheckedChange={(v) => handleNotificationChange("transaction_alerts", v)}
              data-testid="transaction-alerts-switch"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50 dark:bg-stone-900">
            <div>
              <p className="font-medium">Alert budget</p>
              <p className="text-sm text-muted-foreground">Notifica quando superi un budget</p>
            </div>
            <Switch
              checked={notifications.budget_alerts}
              onCheckedChange={(v) => handleNotificationChange("budget_alerts", v)}
              data-testid="budget-alerts-switch"
            />
          </div>

          <Button
            onClick={handleSaveNotifications}
            className="btn-primary w-full"
            disabled={saving}
            data-testid="save-notifications-btn"
          >
            {saving ? (
              "Salvataggio..."
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Salva Impostazioni
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Security Section */}
      <div className="card-bento" data-testid="security-section">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="font-heading text-lg font-semibold">Sicurezza</h2>
        </div>
        <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900">
          <p className="font-medium mb-2">Dati protetti</p>
          <p className="text-sm text-muted-foreground">
            I tuoi dati sono protetti con crittografia end-to-end. Le credenziali bancarie non vengono mai memorizzate sui nostri server.
          </p>
        </div>
      </div>

      {/* Version Info */}
      <div className="text-center text-sm text-muted-foreground py-4">
        <p>Focolare v1.0.0</p>
        <p className="mt-1">Gestione Budget Familiare</p>
      </div>
    </div>
  );
};

export default Settings;
