import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { ContractDoc } from '../types';

const TYPE_LABELS: Record<string, string> = {
  vente: 'Vente',
  pret: 'Prêt',
  service: 'Service',
  location: 'Location',
};

function buildHtml(contract: ContractDoc, parties: { role: string; phone: string }[]): string {
  const date = new Date(contract.$createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const partiesHtml = parties
    .map(
      (p) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #ddd">${p.role}</td><td style="padding:8px;border-bottom:1px solid #ddd">${p.phone}</td></tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: 'Helvetica Neue', sans-serif; padding: 40px; color: #1a1a1a; }
    .header { text-align: center; margin-bottom: 32px; }
    .logo { font-size: 28px; font-weight: 800; color: #00A884; }
    .subtitle { color: #666; font-size: 12px; margin-top: 4px; }
    .watermark { color: #00A884; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin-top: 8px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 14px; font-weight: 700; color: #00A884; border-bottom: 2px solid #00A884; padding-bottom: 4px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; }
    .info-row td { padding: 6px 0; }
    .info-label { color: #666; width: 40%; }
    .info-value { font-weight: 600; }
    .hash-box { background: #f5f5f5; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 10px; word-break: break-all; color: #00A884; }
    .footer { margin-top: 40px; text-align: center; color: #999; font-size: 10px; }
    .badge { display: inline-block; background: #e8f5e9; color: #00A884; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">NAATAL</div>
    <div class="subtitle">Dossier de preuve numérique</div>
    <div class="watermark">NAATAL — Dossier certifié</div>
  </div>

  <div class="section">
    <div class="section-title">Informations du contrat</div>
    <table>
      <tr class="info-row"><td class="info-label">Référence</td><td class="info-value">${contract.reference}</td></tr>
      <tr class="info-row"><td class="info-label">Type</td><td class="info-value">${TYPE_LABELS[contract.type] ?? contract.type}</td></tr>
      <tr class="info-row"><td class="info-label">Statut</td><td class="info-value"><span class="badge">${contract.status.toUpperCase()}</span></td></tr>
      <tr class="info-row"><td class="info-label">Date de création</td><td class="info-value">${date}</td></tr>
      ${contract.amount ? `<tr class="info-row"><td class="info-label">Montant</td><td class="info-value">${contract.amount.toLocaleString()} ${contract.currency}</td></tr>` : ''}
      ${contract.due_date ? `<tr class="info-row"><td class="info-label">Échéance</td><td class="info-value">${new Date(contract.due_date).toLocaleDateString('fr-FR')}</td></tr>` : ''}
    </table>
  </div>

  <div class="section">
    <div class="section-title">Parties</div>
    <table>
      <tr><th style="text-align:left;padding:8px;border-bottom:2px solid #ddd">Rôle</th><th style="text-align:left;padding:8px;border-bottom:2px solid #ddd">Téléphone</th></tr>
      ${partiesHtml}
    </table>
  </div>

  ${contract.integrity_hash ? `
  <div class="section">
    <div class="section-title">Empreinte d'intégrité (SHA-256)</div>
    <div class="hash-box">${contract.integrity_hash}</div>
  </div>
  ` : ''}

  <div class="section">
    <div class="section-title">Preuves jointes</div>
    <table>
      <tr class="info-row"><td class="info-label">Enregistrements vocaux</td><td class="info-value">Stockés et chiffrés sur Appwrite Cloud</td></tr>
      <tr class="info-row"><td class="info-label">CNI vérifiées</td><td class="info-value">Photos privées, accès restreint</td></tr>
      <tr class="info-row"><td class="info-label">Horodatage</td><td class="info-value">${contract.$createdAt}</td></tr>
    </table>
  </div>

  ${contract.locked_at ? `
  <div class="section" style="text-align:center; padding: 16px; background: #e8f5e9; border-radius: 12px;">
    <strong style="color:#00A884">🔒 Dossier verrouillé le ${new Date(contract.locked_at).toLocaleDateString('fr-FR')}</strong>
    <p style="color:#666;font-size:11px;margin-top:4px">Ce document ne peut plus être modifié.</p>
  </div>
  ` : ''}

  <div class="footer">
    <p>Généré par Naatal — ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
    <p>Ce document atteste de l'existence d'un accord enregistré numériquement.</p>
  </div>
</body>
</html>`;
}

export async function generateAndSharePdf(
  contract: ContractDoc,
  parties: { role: string; phone: string }[]
): Promise<void> {
  const html = buildHtml(contract, parties);
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Naatal — ${contract.reference}`,
    UTI: 'com.adobe.pdf',
  });
}
