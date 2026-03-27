"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Users, Shield, Clock, Brain, Lock, Unlock,
  ClipboardCheck, ChevronDown, ChevronRight, Save, RotateCcw, Pencil
} from "lucide-react";
import { hasPermission } from "@/lib/permissions";
import { PageHelp, TabHelp } from "@/components/ui/help-tip";
import { GATES } from "@/lib/gates";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  locked: boolean;
  createdAt: string;
};

type AuditEntry = {
  id: string;
  action: string;
  targetName: string | null;
  details: any;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
};

export default function AdminPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const role = (session?.user as any)?.role;
  const canManageUsers = hasPermission(role, "manage_users");
  const canViewAudit = hasPermission(role, "view_audit");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [usersRes, auditRes] = await Promise.all([
      fetch("/api/admin/users"),
      canViewAudit ? fetch("/api/audit") : Promise.resolve(null),
    ]);
    if (usersRes.ok) setUsers(await usersRes.json());
    if (auditRes?.ok) setAudit(await auditRes.json());
    setLoading(false);
  }

  async function updateUser(userId: string, updates: Partial<User>) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...updates }),
    });
    fetchData();
  }

  if (loading) return <div className="text-stone-400 text-center py-12">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-serif text-white mb-4">Administration</h1>
      <PageHelp>
        Manage platform users and roles, view the RBAC permission matrix, review the full audit trail of all
        platform actions, and configure AI integration settings. Only admins can modify user roles, lock accounts,
        or change system settings.
      </PageHelp>

      <Tabs defaultValue="users">
        <TabsList className="bg-stone-800 border border-stone-700">
          <TabsTrigger value="users" className="data-[state=active]:bg-stone-700 data-[state=active]:text-amber-400 text-stone-400">
            <Users className="w-4 h-4 mr-1.5" />
            Users
          </TabsTrigger>
          <TabsTrigger value="permissions" className="data-[state=active]:bg-stone-700 data-[state=active]:text-amber-400 text-stone-400">
            <Shield className="w-4 h-4 mr-1.5" />
            Permissions
          </TabsTrigger>
          {canViewAudit && (
            <TabsTrigger value="audit" className="data-[state=active]:bg-stone-700 data-[state=active]:text-amber-400 text-stone-400">
              <Clock className="w-4 h-4 mr-1.5" />
              Audit Trail
            </TabsTrigger>
          )}
          {canManageUsers && (
            <TabsTrigger value="criteria" className="data-[state=active]:bg-stone-700 data-[state=active]:text-amber-400 text-stone-400">
              <ClipboardCheck className="w-4 h-4 mr-1.5" />
              Criteria
            </TabsTrigger>
          )}
          <TabsTrigger value="ai" className="data-[state=active]:bg-stone-700 data-[state=active]:text-amber-400 text-stone-400">
            <Brain className="w-4 h-4 mr-1.5" />
            AI Integration
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-4">
          <Card className="bg-stone-800 border-stone-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-700">
                    <th className="text-left p-3 text-stone-400 font-medium">Name</th>
                    <th className="text-left p-3 text-stone-400 font-medium">Email</th>
                    <th className="text-left p-3 text-stone-400 font-medium">Role</th>
                    <th className="text-left p-3 text-stone-400 font-medium">Status</th>
                    {canManageUsers && <th className="text-left p-3 text-stone-400 font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-stone-700/50 hover:bg-stone-700/20">
                      <td className="p-3 text-white">{user.name}</td>
                      <td className="p-3 text-stone-300">{user.email}</td>
                      <td className="p-3">
                        {canManageUsers ? (
                          <Select
                            value={user.role}
                            onValueChange={(val) => updateUser(user.id, { role: val } as any)}
                          >
                            <SelectTrigger className="w-28 h-8 bg-stone-900 border-stone-600 text-white text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-stone-800 border-stone-700">
                              <SelectItem value="admin" className="text-white">Admin</SelectItem>
                              <SelectItem value="analyst" className="text-white">Analyst</SelectItem>
                              <SelectItem value="viewer" className="text-white">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={
                            user.role === "admin" ? "bg-amber-600 text-white" :
                            user.role === "analyst" ? "bg-blue-600 text-white" :
                            "bg-stone-600 text-stone-200"
                          }>
                            {user.role}
                          </Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge className={user.locked ? "bg-red-900/30 text-red-400" : "bg-green-900/30 text-green-400"}>
                          {user.locked ? "Locked" : "Active"}
                        </Badge>
                      </td>
                      {canManageUsers && (
                        <td className="p-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateUser(user.id, { locked: !user.locked } as any)}
                            className="text-stone-400 hover:text-white h-8"
                          >
                            {user.locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="mt-4">
          <Card className="bg-stone-800 border-stone-700 p-6">
            <h3 className="text-white font-medium mb-4">Permission Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-700">
                    <th className="text-left p-2 text-stone-400">Permission</th>
                    <th className="text-center p-2 text-amber-400">Admin</th>
                    <th className="text-center p-2 text-blue-400">Analyst</th>
                    <th className="text-center p-2 text-stone-400">Viewer</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "View targets & gates", admin: true, analyst: true, viewer: true },
                    { label: "Create/edit targets", admin: true, analyst: true, viewer: false },
                    { label: "Score dimensions", admin: true, analyst: true, viewer: false },
                    { label: "Upload evidence", admin: true, analyst: true, viewer: false },
                    { label: "Edit gate weights", admin: true, analyst: false, viewer: false },
                    { label: "Edit persona config", admin: true, analyst: false, viewer: false },
                    { label: "Approve gate passage", admin: true, analyst: false, viewer: false },
                    { label: "Manage users & roles", admin: true, analyst: false, viewer: false },
                    { label: "View audit trail", admin: true, analyst: false, viewer: false },
                    { label: "Close/archive deals", admin: true, analyst: false, viewer: false },
                  ].map((row) => (
                    <tr key={row.label} className="border-b border-stone-700/30">
                      <td className="p-2 text-stone-300">{row.label}</td>
                      <td className="p-2 text-center">{row.admin ? "✓" : "—"}</td>
                      <td className="p-2 text-center">{row.analyst ? "✓" : "—"}</td>
                      <td className="p-2 text-center">{row.viewer ? "✓" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Audit Trail Tab */}
        {canViewAudit && (
          <TabsContent value="audit" className="mt-4">
            <Card className="bg-stone-800 border-stone-700 overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                {audit.length === 0 ? (
                  <div className="text-stone-500 text-center py-8">No audit entries yet</div>
                ) : (
                  <div className="divide-y divide-stone-700/50">
                    {audit.map((entry) => (
                      <div key={entry.id} className="p-3 hover:bg-stone-700/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-stone-600 text-stone-400 text-[10px] font-mono">
                              {entry.action}
                            </Badge>
                            {entry.targetName && (
                              <span className="text-stone-300 text-sm">{entry.targetName}</span>
                            )}
                          </div>
                          <span className="text-stone-500 text-xs">
                            {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ""}
                          </span>
                        </div>
                        <div className="text-stone-500 text-xs mt-1">
                          by {entry.userName || "Unknown"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        )}

        {/* Criteria Configuration Tab */}
        {canManageUsers && (
          <TabsContent value="criteria" className="mt-4">
            <CriteriaConfigPanel />
          </TabsContent>
        )}

        {/* AI Integration Tab */}
        <TabsContent value="ai" className="mt-4">
          <Card className="bg-stone-800 border-stone-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-stone-500" />
              <div>
                <h3 className="text-white font-medium">AI-Assisted Scoring</h3>
                <p className="text-stone-400 text-sm">Powered by Anthropic Claude</p>
              </div>
              <Badge className="ml-auto bg-stone-700 text-stone-400">Disabled</Badge>
            </div>
            <div className="bg-stone-900 rounded-lg p-4 border border-stone-700">
              <p className="text-stone-300 text-sm leading-relaxed">
                AI-assisted scoring is available as an opt-in feature. When enabled, AMP provides
                AI-suggested dimension scores, financial data extraction, and IC narrative drafting
                — all anchored to your rubric definitions and persona configuration.
              </p>
              <ul className="mt-3 space-y-2 text-stone-400 text-sm">
                <li className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-500" />
                  Requires a Data Processing Agreement on file
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-500" />
                  Operates at per-document granularity — no automatic processing
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-500" />
                  All AI suggestions are advisory only — analyst confirms every score
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-500" />
                  Every AI call is logged to a separate compliance audit trail
                </li>
              </ul>
              <p className="text-stone-500 text-xs mt-4">
                Contact Alio Foundry to enable AI features for your organization.
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Criteria Configuration Panel ──────────────────────────────
type CriteriaItem = {
  gateCode: string;
  gateName: string;
  dimensionName: string;
  weight: number;
  testGuidance: string;
  acceptanceParams: Array<{ label: string; defaultValue: string; type: string }>;
  isOverridden: boolean;
  defaultGuidance: string;
  defaultParams: Array<{ label: string; defaultValue: string; type: string }>;
};

function CriteriaConfigPanel() {
  const [criteria, setCriteria] = useState<CriteriaItem[]>([]);
  const [selectedGate, setSelectedGate] = useState("G0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingDim, setEditingDim] = useState<string | null>(null);
  const [editGuidance, setEditGuidance] = useState("");
  const [editParams, setEditParams] = useState<Array<{ label: string; defaultValue: string; type: string }>>([]);

  useEffect(() => {
    fetchCriteria();
  }, []);

  async function fetchCriteria() {
    const res = await fetch("/api/criteria");
    if (res.ok) setCriteria(await res.json());
    setLoading(false);
  }

  function startEditing(item: CriteriaItem) {
    setEditingDim(item.dimensionName);
    setEditGuidance(item.testGuidance);
    setEditParams(JSON.parse(JSON.stringify(item.acceptanceParams)));
  }

  function cancelEditing() {
    setEditingDim(null);
    setEditGuidance("");
    setEditParams([]);
  }

  async function saveCriteria(gateCode: string, dimensionName: string) {
    setSaving(dimensionName);
    await fetch("/api/criteria", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gateCode,
        dimensionName,
        testGuidance: editGuidance,
        acceptanceParams: editParams,
      }),
    });
    await fetchCriteria();
    setEditingDim(null);
    setSaving(null);
  }

  async function resetToDefault(gateCode: string, dimensionName: string) {
    const item = criteria.find((c) => c.gateCode === gateCode && c.dimensionName === dimensionName);
    if (!item) return;
    setSaving(dimensionName);
    await fetch("/api/criteria", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gateCode,
        dimensionName,
        testGuidance: item.defaultGuidance,
        acceptanceParams: item.defaultParams,
      }),
    });
    await fetchCriteria();
    setSaving(null);
  }

  function updateParam(index: number, field: "label" | "defaultValue", value: string) {
    const updated = [...editParams];
    updated[index] = { ...updated[index], [field]: value };
    setEditParams(updated);
  }

  function addParam() {
    setEditParams([...editParams, { label: "", defaultValue: "", type: "text" }]);
  }

  function removeParam(index: number) {
    setEditParams(editParams.filter((_, i) => i !== index));
  }

  const gateCriteria = criteria.filter((c) => c.gateCode === selectedGate);
  const selectedGateDef = GATES.find((g) => g.code === selectedGate);

  if (loading) return <div className="text-stone-500 text-sm py-4">Loading criteria...</div>;

  return (
    <div className="space-y-4">
      <TabHelp>
        Configure the test guidance and acceptance parameters that analysts see when scoring each dimension.
        Changes apply immediately to all future evaluations. Use &quot;Reset to Default&quot; to restore the
        AMP methodology defaults.
      </TabHelp>

      {/* Gate Selector */}
      <div className="flex items-center gap-3">
        <Label className="text-stone-400 text-sm shrink-0">Select Gate:</Label>
        <div className="flex gap-1 flex-wrap">
          {GATES.map((gate) => (
            <button
              key={gate.code}
              onClick={() => { setSelectedGate(gate.code); setEditingDim(null); }}
              className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                selectedGate === gate.code
                  ? "bg-amber-600 text-white"
                  : "bg-stone-700 text-stone-400 hover:bg-stone-600 hover:text-white"
              }`}
            >
              {gate.code}
            </button>
          ))}
        </div>
      </div>

      {/* Gate Info */}
      {selectedGateDef && (
        <div className="bg-stone-900/50 rounded-lg border border-stone-700 p-3">
          <h4 className="text-white font-medium text-sm">{selectedGateDef.code} — {selectedGateDef.name}</h4>
          <p className="text-stone-400 text-xs mt-1">{selectedGateDef.purpose}</p>
          <div className="flex gap-4 mt-2 text-xs text-stone-500">
            <span>Type: <strong className="text-stone-300">{selectedGateDef.type}</strong></span>
            <span>Dimensions: <strong className="text-stone-300">{selectedGateDef.dimensions.length}</strong></span>
            {selectedGateDef.minimumScore && (
              <span>Min Score: <strong className="text-stone-300">{selectedGateDef.minimumScore}/100</strong></span>
            )}
          </div>
        </div>
      )}

      {/* Dimension List */}
      <div className="space-y-3">
        {gateCriteria.map((item) => {
          const isEditing = editingDim === item.dimensionName;

          return (
            <Card key={item.dimensionName} className={`bg-stone-800 border-stone-700 overflow-hidden ${
              item.isOverridden ? "ring-1 ring-amber-700/30" : ""
            }`}>
              {/* Dimension Header */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className="text-white font-medium text-sm">{item.dimensionName}</span>
                  <Badge variant="outline" className="border-stone-600 text-stone-400 text-[10px]">
                    {item.weight}%
                  </Badge>
                  {item.isOverridden && (
                    <Badge className="bg-amber-900/30 text-amber-400 text-[10px]">
                      Customized
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {item.isOverridden && !isEditing && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-stone-500 hover:text-white h-7 text-xs"
                      onClick={() => resetToDefault(item.gateCode, item.dimensionName)}
                      disabled={saving === item.dimensionName}
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Reset
                    </Button>
                  )}
                  {!isEditing ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-amber-400 hover:text-amber-300 h-7 text-xs"
                      onClick={() => startEditing(item)}
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700 h-7 text-xs"
                        onClick={() => saveCriteria(item.gateCode, item.dimensionName)}
                        disabled={saving === item.dimensionName}
                      >
                        <Save className="w-3 h-3 mr-1" />
                        {saving === item.dimensionName ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-stone-400 h-7 text-xs"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="px-4 pb-4 space-y-3">
                {/* Test Guidance */}
                <div>
                  <Label className="text-blue-400 text-xs uppercase tracking-wider font-medium">Test Guidance</Label>
                  {isEditing ? (
                    <Textarea
                      value={editGuidance}
                      onChange={(e) => setEditGuidance(e.target.value)}
                      className="bg-stone-900 border-stone-600 text-white text-xs mt-1"
                      rows={3}
                    />
                  ) : (
                    <p className="text-stone-300 text-xs mt-1 leading-relaxed bg-stone-900/50 rounded p-2">
                      {item.testGuidance}
                    </p>
                  )}
                </div>

                {/* Acceptance Parameters */}
                <div>
                  <Label className="text-amber-400 text-xs uppercase tracking-wider font-medium">
                    Acceptance Parameters
                  </Label>
                  {isEditing ? (
                    <div className="mt-1 space-y-2">
                      {editParams.map((param, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Input
                            value={param.label}
                            onChange={(e) => updateParam(i, "label", e.target.value)}
                            placeholder="Parameter name"
                            className="bg-stone-900 border-stone-600 text-white text-xs h-8 w-40"
                          />
                          <Input
                            value={param.defaultValue}
                            onChange={(e) => updateParam(i, "defaultValue", e.target.value)}
                            placeholder="Value"
                            className="bg-stone-900 border-stone-600 text-white text-xs h-8 flex-1"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 h-8 w-8 p-0"
                            onClick={() => removeParam(i)}
                          >
                            &times;
                          </Button>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-stone-400 hover:text-white h-7 text-xs"
                        onClick={addParam}
                      >
                        + Add Parameter
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-1 bg-stone-900/50 rounded p-2 space-y-1">
                      {item.acceptanceParams.map((param, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className="text-stone-500 shrink-0">{param.label}:</span>
                          <span className="text-stone-200 font-medium">{param.defaultValue}</span>
                        </div>
                      ))}
                      {item.acceptanceParams.length === 0 && (
                        <span className="text-stone-500 text-xs italic">No parameters configured</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
