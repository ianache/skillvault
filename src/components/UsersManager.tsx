"use client";

import { useMemo, useState } from "react";
import { APP_ROLES, type AppRole, type AppUser } from "@/lib/users/types";

interface Props {
  initialUsers: AppUser[];
}

const ROLE_LABELS: Record<AppRole, { name: string; description: string }> = {
  admin: { name: "Admin", description: "Acceso total a la configuración del sistema" },
  author: { name: "Author", description: "Puede crear y editar contenido" },
  reviewer: { name: "Reviewer", description: "Puede revisar y aprobar contenido" },
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 14px",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  fontFamily: "inherit",
  fontSize: "13.5px",
  background: "var(--surface)",
  color: "var(--text)",
};

const pillBase: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: "20px",
  fontFamily: "inherit",
  fontSize: "12.5px",
  fontWeight: 600,
  cursor: "pointer",
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--muted)",
};

const pillActive: React.CSSProperties = {
  ...pillBase,
  background: "var(--accent)",
  borderColor: "var(--accent)",
  color: "#fff",
};

export function UsersManager({ initialUsers }: Props) {
  const [users, setUsers] = useState<AppUser[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive">("active");
  const [roleFilter, setRoleFilter] = useState<AppRole[]>([]);
  const [modalUserId, setModalUserId] = useState<string | null>(null);
  const [draftRoles, setDraftRoles] = useState<AppRole[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedUser = users.find((u) => u.id === modalUserId) ?? null;

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users
      .filter((u) => (statusFilter === "active" ? u.active : !u.active))
      .filter((u) => !q || u.username.toLowerCase().includes(q))
      .filter((u) => roleFilter.length === 0 || roleFilter.every((r) => u.roles.includes(r)));
  }, [users, searchQuery, statusFilter, roleFilter]);

  function toggleRoleFilter(role: AppRole) {
    setRoleFilter((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  }

  function openModalFor(user: AppUser) {
    setModalUserId(user.id);
    setDraftRoles([...user.roles]);
    setError("");
  }

  function closeModal() {
    setModalUserId(null);
    setDraftRoles([]);
    setError("");
  }

  function toggleDraftRole(role: AppRole) {
    setDraftRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  }

  async function saveRoles() {
    if (!selectedUser) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/users/${selectedUser.id}/roles`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: draftRoles }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al guardar");
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? data.user : u)));
      closeModal();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {error && !modalUserId && (
        <div
          style={{
            padding: "10px 14px",
            background: "#E8503A18",
            border: "1px solid #E8503A55",
            borderRadius: "6px",
            color: "#E8503A",
            fontSize: "13px",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "16px", alignItems: "flex-end", marginBottom: "24px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "240px" }}>
          <label
            style={{
              display: "block",
              fontSize: "11.5px",
              fontWeight: 600,
              color: "var(--muted)",
              marginBottom: "6px",
              fontFamily: "var(--font-jetbrains-mono), monospace",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            Buscar por usuario
          </label>
          <input
            type="text"
            placeholder="ej. jsalazar"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ display: "flex", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "3px" }}>
          <button type="button" onClick={() => setStatusFilter("active")} style={statusFilter === "active" ? pillActive : { ...pillBase, border: "none", borderRadius: "6px" }}>
            Activos
          </button>
          <button type="button" onClick={() => setStatusFilter("inactive")} style={statusFilter === "inactive" ? pillActive : { ...pillBase, border: "none", borderRadius: "6px" }}>
            Inactivos
          </button>
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "11.5px",
              fontWeight: 600,
              color: "var(--muted)",
              marginBottom: "6px",
              fontFamily: "var(--font-jetbrains-mono), monospace",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            Filtrar por roles
          </label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {APP_ROLES.map((role) => (
              <button key={role} type="button" onClick={() => toggleRoleFilter(role)} style={roleFilter.includes(role) ? pillActive : pillBase}>
                {ROLE_LABELS[role].name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Usuario", "Nombre completo", "Email", "Estado", "Roles actuales", ""].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "14px 20px",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--faint)",
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "14px 20px", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>
                  {user.username}
                </td>
                <td style={{ padding: "14px 20px", fontSize: "13.5px", color: "var(--text)" }}>{user.fullName || "—"}</td>
                <td style={{ padding: "14px 20px", fontSize: "13px", color: "var(--muted)" }}>{user.email || "—"}</td>
                <td style={{ padding: "14px 20px" }}>
                  {user.active ? (
                    <span
                      style={{
                        fontSize: "11.5px",
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                        color: "var(--green)",
                        background: "rgba(15,148,136,0.1)",
                        padding: "3px 9px",
                        borderRadius: "20px",
                      }}
                    >
                      Activo
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: "11.5px",
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                        color: "var(--muted)",
                        background: "var(--raised)",
                        padding: "3px 9px",
                        borderRadius: "20px",
                      }}
                    >
                      Inactivo
                    </span>
                  )}
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {user.roles.length === 0 ? (
                      <span style={{ color: "var(--faint)", fontSize: "12.5px" }}>Sin roles</span>
                    ) : (
                      user.roles.map((role) => (
                        <span
                          key={role}
                          style={{
                            fontSize: "11.5px",
                            color: "var(--accent)",
                            background: "var(--accent-muted)",
                            padding: "3px 9px",
                            borderRadius: "20px",
                            fontWeight: 500,
                          }}
                        >
                          {ROLE_LABELS[role].name}
                        </span>
                      ))
                    )}
                  </div>
                </td>
                <td style={{ padding: "14px 20px", textAlign: "right" }}>
                  <button
                    type="button"
                    onClick={() => openModalFor(user)}
                    style={{
                      background: "var(--raised)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      padding: "7px 14px",
                      borderRadius: "8px",
                      fontFamily: "inherit",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Asignar roles
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--faint)", fontSize: "13.5px" }}>
            No se encontraron usuarios con ese criterio.
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedUser && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              borderRadius: "14px",
              width: "440px",
              maxWidth: "90vw",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "22px 24px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--text)" }}>
                Roles de {selectedUser.fullName || selectedUser.username}
              </div>
              <div style={{ color: "var(--muted)", fontSize: "12.5px", marginTop: "3px", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                {selectedUser.username} · {selectedUser.email || "sin email"}
              </div>
            </div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {error && (
                <div style={{ padding: "8px 12px", background: "#E8503A18", border: "1px solid #E8503A55", borderRadius: "6px", color: "#E8503A", fontSize: "12.5px" }}>
                  {error}
                </div>
              )}
              {APP_ROLES.map((role) => {
                const checked = draftRoles.includes(role);
                return (
                  <label
                    key={role}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 14px",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      cursor: "pointer",
                    }}
                  >
                    <input type="checkbox" checked={checked} onChange={() => toggleDraftRole(role)} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "13.5px", color: "var(--text)" }}>{ROLE_LABELS[role].name}</div>
                      <div style={{ color: "var(--muted)", fontSize: "12px", marginTop: "2px" }}>{ROLE_LABELS[role].description}</div>
                    </div>
                    {checked && (
                      <span
                        style={{
                          fontSize: "11px",
                          color: "var(--accent)",
                          background: "var(--accent-muted)",
                          padding: "3px 9px",
                          borderRadius: "20px",
                          fontWeight: 500,
                        }}
                      >
                        Asignado
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
            <div style={{ padding: "16px 24px", display: "flex", justifyContent: "flex-end", gap: "10px", background: "var(--raised)", borderTop: "1px solid var(--border)" }}>
              <button
                type="button"
                onClick={closeModal}
                style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text)", padding: "9px 16px", borderRadius: "8px", fontFamily: "inherit", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveRoles}
                disabled={saving}
                style={{ background: "var(--accent)", border: "1px solid var(--accent)", color: "#fff", padding: "9px 16px", borderRadius: "8px", fontFamily: "inherit", fontSize: "13px", fontWeight: 600, cursor: "pointer", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
