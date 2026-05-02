import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Download, Printer, QrCode, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

export default function QrCodeGenerator() {
  const [tableCount, setTableCount] = useState(10);
  const [baseUrl, setBaseUrl] = useState(() => window.location.origin);
  const [codes, setCodes] = useState([]);
  const tables = useMemo(
    () => Array.from({ length: Math.max(Number(tableCount) || 0, 0) }, (_, index) => index + 1),
    [tableCount]
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      tables.map(async (table) => {
        const url = `${baseUrl.replace(/\/$/, "")}/menu?table=${table}`;
        const dataUrl = await QRCode.toDataURL(url, { width: 260, margin: 2, color: { dark: "#0f172a", light: "#ffffff" } });
        return { table, url, dataUrl };
      })
    )
      .then((nextCodes) => {
        if (!cancelled) setCodes(nextCodes);
      })
      .catch(() => toast.error("Could not generate QR codes"));
    return () => {
      cancelled = true;
    };
  }, [baseUrl, tables]);

  const downloadQr = (code) => {
    const link = document.createElement("a");
    link.href = code.dataUrl;
    link.download = `table-${code.table}-qr.png`;
    link.click();
  };

  const downloadGrid = () => {
    window.print();
  };

  return (
    <section className="panel p-4" id="qr-generator">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <QrCode className="text-ember-600" />
            <h2 className="text-xl font-bold">Generate table QR codes</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Create scan-ready table links for printing and demos.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setBaseUrl(window.location.origin)} className="btn-secondary rounded-lg px-3" title="Use current site URL">
            <RefreshCw size={16} />
          </button>
          <button type="button" onClick={downloadGrid} className="btn-primary rounded-lg px-3">
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[160px_1fr]">
        <label className="text-sm font-semibold">
          Tables
          <input
            className="input mt-1"
            min="1"
            max="100"
            type="number"
            value={tableCount}
            onChange={(event) => setTableCount(event.target.value)}
          />
        </label>
        <label className="text-sm font-semibold">
          Base URL
          <input className="input mt-1" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} />
        </label>
      </div>

      {codes[0] && (
        <div className="mt-5 rounded-lg border border-dashed border-orange-200 bg-orange-50 p-4 dark:border-slate-700 dark:bg-slate-950">
          <p className="text-sm font-bold uppercase tracking-wide text-ember-700 dark:text-orange-300">Scan Me Preview</p>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <img src={codes[0].dataUrl} alt="Scan table 1 QR preview" className="h-32 w-32 rounded-lg bg-white p-2" />
            <div className="min-w-0">
              <p className="font-black">Table {codes[0].table}</p>
              <p className="break-all text-sm text-slate-600 dark:text-slate-300">{codes[0].url}</p>
            </div>
          </div>
        </div>
      )}

      <div className="qr-print-grid mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {codes.map((code) => (
          <article key={code.table} className="qr-ticket rounded-lg border border-slate-200 bg-white p-4 text-center text-slate-950 dark:border-slate-700">
            <p className="text-lg font-black">Table {code.table}</p>
            <p className="mb-3 text-sm font-semibold text-slate-500">Scan to Order</p>
            <img src={code.dataUrl} alt={`QR code for table ${code.table}`} className="mx-auto h-44 w-44" />
            <p className="mt-3 break-all text-xs text-slate-500">{code.url}</p>
            <button type="button" onClick={() => downloadQr(code)} className="btn-secondary mt-4 rounded-lg px-3 py-2 text-sm print:hidden">
              <Download size={15} /> Download PNG
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
