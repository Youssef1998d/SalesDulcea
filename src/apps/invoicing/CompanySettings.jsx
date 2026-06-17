import { useState } from "react";
import { useTheme } from "../../core/theme";
import { Modal, Btn, Input } from "../../components/ui";
import { supabase } from "../../core/supabase";

// Manager screen to configure the legal company identity used on invoices.
// The official stamp is mandatory for invoice generation.
export function CompanySettings({ open, onClose, org, onSaved }) {
  const T = useTheme();
  const [form, setForm] = useState({
    company_name:              org?.company_name || org?.name || "",
    address:                   org?.address || "",
    phone:                     org?.phone || "",
    email:                     org?.email || "",
    tax_identification_number: org?.tax_identification_number || "",
    tax_rate:                  String(org?.tax_rate ?? 0),
    logo_url:                  org?.logo_url || "",
    stamp_url:                 org?.stamp_url || "",
  });
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(null); // 'logo' | 'stamp'

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function uploadAsset(kind, file) {
    if (!file) return;
    setUploading(kind);
    setError(null);
    try {
      const ext  = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `${org.id}/${kind}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("branding")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("branding").getPublicUrl(path);
      // cache-bust so the new image is picked up immediately
      const url = `${data.publicUrl}?v=${Date.now()}`;
      setF(kind === "logo" ? "logo_url" : "stamp_url", url);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(null);
    }
  }

  async function save() {
    setError(null);
    if (!form.company_name.trim()) { setError("Le nom de la société est requis."); return; }
    setBusy(true);
    try {
      const payload = {
        company_name:              form.company_name.trim(),
        address:                   form.address || null,
        phone:                     form.phone || null,
        email:                     form.email || null,
        tax_identification_number: form.tax_identification_number || null,
        tax_rate:                  Number(form.tax_rate || 0),
        logo_url:                  form.logo_url || null,
        stamp_url:                 form.stamp_url || null,
      };
      const { error: upErr } = await supabase.from("organizations").update(payload).eq("id", org.id);
      if (upErr) throw upErr;
      onSaved?.({ ...org, ...payload });
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="PARAMÈTRES SOCIÉTÉ">
      <Input label="Nom de la société *" value={form.company_name} onChange={v => setF("company_name", v)} placeholder="Dulcea SARL" />
      <Input label="Adresse"             value={form.address}      onChange={v => setF("address", v)}      placeholder="Rue ..., Tunis" />
      <Input label="Téléphone"           value={form.phone}        onChange={v => setF("phone", v)}        placeholder="+216  XX XXX XXX" />
      <Input label="Email"               value={form.email}        onChange={v => setF("email", v)}        placeholder="contact@societe.tn" />
      <Input label="Matricule fiscal"    value={form.tax_identification_number} onChange={v => setF("tax_identification_number", v)} placeholder="0000000/A/M/000" />
      <Input label="TVA par défaut (%)"  type="number" value={form.tax_rate} onChange={v => setF("tax_rate", v)} />

      {/* Logo */}
      <AssetField
        T={T} label="Logo société" url={form.logo_url}
        uploading={uploading === "logo"}
        onFile={f => uploadAsset("logo", f)}
        onUrl={v => setF("logo_url", v)}
      />

      {/* Stamp (mandatory) */}
      <AssetField
        T={T} label="Cachet de l'entreprise (obligatoire)" url={form.stamp_url}
        uploading={uploading === "stamp"}
        onFile={f => uploadAsset("stamp", f)}
        onUrl={v => setF("stamp_url", v)}
      />
      {!form.stamp_url && (
        <div style={{ fontSize: 12, color: T.danger, marginBottom: 14 }}>
          ⚠ Sans cachet configuré, aucune facture ne peut être générée.
        </div>
      )}

      {error && (
        <div style={{ background: T.mode === "dark" ? "#1f0a0a" : "#fff5f5", border: `1px solid ${T.danger}44`, color: T.danger, borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>
          {error}
        </div>
      )}

      <Btn style={{ width: "100%" }} onClick={save} disabled={busy}>
        {busy ? "Enregistrement..." : "Enregistrer"}
      </Btn>
    </Modal>
  );
}

function AssetField({ T, label, url, uploading, onFile, onUrl }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: T.textSub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{
          width: 56, height: 56, borderRadius: 10, flexShrink: 0,
          border: `1px solid ${T.border}`, background: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
        }}>
          {url
            ? <img src={url} alt={label} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            : <span style={{ fontSize: 18, color: T.textDim }}>🖼</span>}
        </div>
        <label style={{
          flex: 1, cursor: "pointer", textAlign: "center",
          background: T.surfaceHi, border: `1px dashed ${T.border}`, borderRadius: 10,
          padding: "12px", color: T.textSub, fontSize: 13,
        }}>
          {uploading ? "Envoi..." : url ? "Remplacer l'image" : "Choisir un fichier"}
          <input type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => onFile(e.target.files?.[0])} />
        </label>
      </div>
      <input
        value={url} onChange={e => onUrl(e.target.value)}
        placeholder="…ou coller une URL d'image"
        style={{ width: "100%", marginTop: 8, background: "transparent", border: "none", borderBottom: `1px solid ${T.border}`, padding: "6px 0", color: T.textDim, fontSize: 12, outline: "none" }}
      />
    </div>
  );
}
