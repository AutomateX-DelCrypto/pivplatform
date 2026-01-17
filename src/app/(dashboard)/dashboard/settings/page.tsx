"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Bell,
  Shield,
  Wallet,
  AlertTriangle,
  Save,
  Plus,
  Trash2,
  Info,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface UserSettings {
  id: string;
  email: string;
  displayName: string | null;
  dailyLimitCents: number | null;
  weeklyLimitCents: number | null;
  monthlyLimitCents: number | null;
  cooldownEnabled: boolean;
  alertsEnabled: boolean;
  wallets: Array<{
    id: string;
    chain: string;
    address: string;
    isPrimary: boolean;
  }>;
}

const CHAIN_OPTIONS = [
  { value: "ethereum", label: "Ethereum" },
  { value: "polygon", label: "Polygon" },
  { value: "bsc", label: "BSC" },
  { value: "arbitrum", label: "Arbitrum" },
  { value: "base", label: "Base" },
  { value: "algorand", label: "Algorand" },
];

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [settings, setSettings] = useState<UserSettings | null>(null);

  // Form state
  const [dailyLimit, setDailyLimit] = useState("");
  const [weeklyLimit, setWeeklyLimit] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  // Wallet form state
  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);
  const [isAddingWallet, setIsAddingWallet] = useState(false);
  const [walletChain, setWalletChain] = useState("ethereum");
  const [walletAddress, setWalletAddress] = useState("");
  const [walletError, setWalletError] = useState<string | null>(null);

  // Fetch settings
  useEffect(() => {
    async function fetchSettings() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/internal/user");
        const result = await response.json();

        if (!result.success) {
          setError(result.error?.message || "Failed to load settings");
          return;
        }

        setSettings(result.data);

        // Initialize form values
        if (result.data.dailyLimitCents) {
          setDailyLimit((result.data.dailyLimitCents / 100).toString());
        }
        if (result.data.weeklyLimitCents) {
          setWeeklyLimit((result.data.weeklyLimitCents / 100).toString());
        }
        if (result.data.monthlyLimitCents) {
          setMonthlyLimit((result.data.monthlyLimitCents / 100).toString());
        }
        setAlertsEnabled(result.data.alertsEnabled ?? true);
      } catch (err) {
        setError("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSettings();
  }, []);

  const handleSaveLimits = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/internal/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dailyLimitCents: dailyLimit ? Math.round(parseFloat(dailyLimit) * 100) : null,
          weeklyLimitCents: weeklyLimit ? Math.round(parseFloat(weeklyLimit) * 100) : null,
          monthlyLimitCents: monthlyLimit ? Math.round(parseFloat(monthlyLimit) * 100) : null,
          alertsEnabled,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error?.message || "Failed to save settings");
        return;
      }

      setSuccess("Settings saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingWallet(true);
    setWalletError(null);

    try {
      const response = await fetch("/api/internal/user/wallets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chain: walletChain,
          address: walletAddress,
          isPrimary: !settings?.wallets.length,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setWalletError(result.error?.message || "Failed to add wallet");
        return;
      }

      // Update local state
      setSettings((prev) =>
        prev
          ? {
              ...prev,
              wallets: [...prev.wallets, result.data],
            }
          : null
      );

      // Reset form
      setWalletAddress("");
      setIsWalletDialogOpen(false);
    } catch (err) {
      setWalletError("Failed to add wallet");
    } finally {
      setIsAddingWallet(false);
    }
  };

  const handleRemoveWallet = async (walletId: string) => {
    try {
      const response = await fetch("/api/internal/user/wallets", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletId }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error?.message || "Failed to remove wallet");
        return;
      }

      // Update local state
      setSettings((prev) =>
        prev
          ? {
              ...prev,
              wallets: prev.wallets.filter((w) => w.id !== walletId),
            }
          : null
      );
    } catch (err) {
      setError("Failed to remove wallet");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#00F0FF]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[#F8FAFC]">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[#94A3B8]">
          Manage your account preferences and responsible gambling limits
        </p>
      </div>

      {/* Global messages */}
      {error && (
        <div className="rounded-[8px] border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.05)] p-3">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-[#EF4444]" />
            <span className="text-sm text-[#EF4444]">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-[8px] border border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.05)] p-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-[#10B981]" />
            <span className="text-sm text-[#10B981]">{success}</span>
          </div>
        </div>
      )}

      <Tabs defaultValue="limits" className="space-y-6">
        <TabsList className="bg-[#1E293B] border border-[rgba(0,240,255,0.1)]">
          <TabsTrigger
            value="limits"
            className="flex items-center gap-2 data-[state=active]:bg-[rgba(0,240,255,0.1)] data-[state=active]:text-[#00F0FF]"
          >
            <AlertTriangle className="h-4 w-4" />
            Limits
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2 data-[state=active]:bg-[rgba(0,240,255,0.1)] data-[state=active]:text-[#00F0FF]"
          >
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger
            value="wallets"
            className="flex items-center gap-2 data-[state=active]:bg-[rgba(0,240,255,0.1)] data-[state=active]:text-[#00F0FF]"
          >
            <Wallet className="h-4 w-4" />
            Wallets
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="flex items-center gap-2 data-[state=active]:bg-[rgba(0,240,255,0.1)] data-[state=active]:text-[#00F0FF]"
          >
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Limits tab */}
        <TabsContent value="limits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#F8FAFC]">
                <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(245,158,11,0.1)]">
                  <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
                </div>
                Responsible Gambling Limits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="dailyLimit" className="text-[#F8FAFC]">
                    Daily Loss Limit
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]">
                      $
                    </span>
                    <Input
                      id="dailyLimit"
                      type="number"
                      min="0"
                      step="0.01"
                      value={dailyLimit}
                      onChange={(e) => setDailyLimit(e.target.value)}
                      placeholder="0.00"
                      className="pl-8"
                    />
                  </div>
                  <p className="text-xs text-[#64748B]">
                    Alert when daily losses reach this amount
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weeklyLimit" className="text-[#F8FAFC]">
                    Weekly Loss Limit
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]">
                      $
                    </span>
                    <Input
                      id="weeklyLimit"
                      type="number"
                      min="0"
                      step="0.01"
                      value={weeklyLimit}
                      onChange={(e) => setWeeklyLimit(e.target.value)}
                      placeholder="0.00"
                      className="pl-8"
                    />
                  </div>
                  <p className="text-xs text-[#64748B]">
                    Alert when weekly losses reach this amount
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthlyLimit" className="text-[#F8FAFC]">
                    Monthly Loss Limit
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]">
                      $
                    </span>
                    <Input
                      id="monthlyLimit"
                      type="number"
                      min="0"
                      step="0.01"
                      value={monthlyLimit}
                      onChange={(e) => setMonthlyLimit(e.target.value)}
                      placeholder="0.00"
                      className="pl-8"
                    />
                  </div>
                  <p className="text-xs text-[#64748B]">
                    Alert when monthly losses reach this amount
                  </p>
                </div>
              </div>

              <Button
                onClick={handleSaveLimits}
                disabled={isSaving}
                className="w-full md:w-auto"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Limits
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <div className="rounded-[12px] border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.05)] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(245,158,11,0.1)] shrink-0 mt-0.5">
                <Info className="h-3.5 w-3.5 text-[#F59E0B]" />
              </div>
              <p className="text-sm text-[#94A3B8]">
                <span className="text-[#F59E0B] font-medium">Important:</span>{" "}
                Setting limits helps maintain healthy gambling habits. Once set,
                limits can only be reduced immediately but increases require a
                24-hour cooling-off period.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Notifications tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#F8FAFC]">
                <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(0,240,255,0.1)]">
                  <Bell className="h-4 w-4 text-[#00F0FF]" />
                </div>
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="flex items-center justify-between rounded-[12px] border border-[rgba(0,240,255,0.1)] bg-[#0A0E17] p-4 cursor-pointer"
                onClick={() => setAlertsEnabled(!alertsEnabled)}
              >
                <div>
                  <h4 className="font-medium text-[#F8FAFC]">
                    All Alerts
                  </h4>
                  <p className="text-sm text-[#94A3B8]">
                    Enable or disable all alert notifications
                  </p>
                </div>
                <Badge variant={alertsEnabled ? "success" : "secondary"}>
                  {alertsEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>

              <div className="flex items-center justify-between rounded-[12px] border border-[rgba(0,240,255,0.1)] bg-[#0A0E17] p-4">
                <div>
                  <h4 className="font-medium text-[#F8FAFC]">
                    Loss Limit Alerts
                  </h4>
                  <p className="text-sm text-[#94A3B8]">
                    Get notified when approaching loss limits
                  </p>
                </div>
                <Badge variant={alertsEnabled ? "success" : "secondary"}>
                  {alertsEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>

              <div className="flex items-center justify-between rounded-[12px] border border-[rgba(0,240,255,0.1)] bg-[#0A0E17] p-4">
                <div>
                  <h4 className="font-medium text-[#F8FAFC]">
                    RNG Anomaly Alerts
                  </h4>
                  <p className="text-sm text-[#94A3B8]">
                    Get notified when anomalies are detected
                  </p>
                </div>
                <Badge variant={alertsEnabled ? "success" : "secondary"}>
                  {alertsEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>

              <Button
                onClick={handleSaveLimits}
                disabled={isSaving}
                className="w-full md:w-auto"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Preferences
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wallets tab */}
        <TabsContent value="wallets" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-[#F8FAFC]">
                <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(0,240,255,0.1)]">
                  <Wallet className="h-4 w-4 text-[#00F0FF]" />
                </div>
                Connected Wallets
              </CardTitle>
              <Dialog
                open={isWalletDialogOpen}
                onOpenChange={setIsWalletDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Wallet
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-[#F8FAFC]">
                      Connect Wallet
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddWallet} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label className="text-[#F8FAFC]">Blockchain</Label>
                      <Select value={walletChain} onValueChange={setWalletChain}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CHAIN_OPTIONS.map((chain) => (
                            <SelectItem key={chain.value} value={chain.value}>
                              {chain.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#F8FAFC]">Wallet Address</Label>
                      <Input
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        placeholder="0x... or algo address"
                        required
                      />
                    </div>

                    {walletError && (
                      <div className="rounded-[8px] border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.05)] p-3">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-[#EF4444]" />
                          <span className="text-sm text-[#EF4444]">
                            {walletError}
                          </span>
                        </div>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isAddingWallet}
                    >
                      {isAddingWallet ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Wallet
                        </>
                      )}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {settings?.wallets.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(100,116,139,0.1)]">
                      <Wallet className="h-6 w-6 text-[#64748B]" />
                    </div>
                    <p className="mt-3 text-sm text-[#94A3B8]">
                      No wallets connected
                    </p>
                    <p className="text-xs text-[#64748B]">
                      Connect a wallet to enable blockchain evidence anchoring
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {settings?.wallets.map((wallet) => (
                    <div
                      key={wallet.id}
                      className="flex items-center justify-between rounded-[12px] border border-[rgba(0,240,255,0.1)] bg-[#0A0E17] p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(0,240,255,0.1)]">
                          <Wallet className="h-5 w-5 text-[#00F0FF]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[#F8FAFC] capitalize">
                              {wallet.chain}
                            </span>
                            {wallet.isPrimary && (
                              <Badge variant="outline" className="text-xs">
                                Primary
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-[#64748B] font-mono truncate max-w-[300px]">
                            {wallet.address}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveWallet(wallet.id)}
                        className="text-[#EF4444] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="rounded-[12px] border border-[rgba(0,240,255,0.2)] bg-[rgba(0,240,255,0.05)] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(0,240,255,0.1)] shrink-0 mt-0.5">
                <Info className="h-3.5 w-3.5 text-[#00F0FF]" />
              </div>
              <p className="text-sm text-[#94A3B8]">
                <span className="text-[#00F0FF] font-medium">
                  Supported Networks:
                </span>{" "}
                Algorand, Ethereum, Polygon, BSC, Arbitrum, and Base. Connect
                your wallet to anchor evidence on your preferred blockchain.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Security tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#F8FAFC]">
                <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(0,240,255,0.1)]">
                  <Shield className="h-4 w-4 text-[#00F0FF]" />
                </div>
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-[12px] border border-[rgba(0,240,255,0.1)] bg-[#0A0E17] p-4">
                <div>
                  <h4 className="font-medium text-[#F8FAFC]">
                    Two-Factor Authentication
                  </h4>
                  <p className="text-sm text-[#94A3B8]">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Badge variant="secondary">Managed by Clerk</Badge>
              </div>

              <div className="flex items-center justify-between rounded-[12px] border border-[rgba(0,240,255,0.1)] bg-[#0A0E17] p-4">
                <div>
                  <h4 className="font-medium text-[#F8FAFC]">Email</h4>
                  <p className="text-sm text-[#94A3B8]">{settings?.email}</p>
                </div>
                <Badge variant="success">Verified</Badge>
              </div>

              <div className="flex items-center justify-between rounded-[12px] border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.05)] p-4">
                <div>
                  <h4 className="font-medium text-[#EF4444]">Delete Account</h4>
                  <p className="text-sm text-[#94A3B8]">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
