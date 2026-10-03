import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Plus, Calendar, Filter, MoreVertical, Eye, Pencil, Trash2,
  Check, ChevronDown, Search, Building2, Share2, Mail,
  Printer, Send, X, Truck,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import "../../Style/Invoice/InvoiceManagement.css";
import { useApp } from "../../../context/AppContext";
import { getBankInfo } from "../constants/bankInfo";
import DateRangeFilter from "../common/DateRangeFilter";

// ─── Constants ────────────────────────────────────────────────────────────────

const banks = [
  "Semua Bank", "BCA", "Mandiri", "BRI", "BNI",
  "BTN", "BSI", "Bank Maluku Malut", "DJPB", "Tunai" // ← tambah di sini
];

const statuses = ["Semua Status", "Lunas", "Belum Lunas"];

const BULAN = [
  { value: "01", label: "Januari"   },
  { value: "02", label: "Februari"  },
  { value: "03", label: "Maret"     },
  { value: "04", label: "April"     },
  { value: "05", label: "Mei"       },
  { value: "06", label: "Juni"      },
  { value: "07", label: "Juli"      },
  { value: "08", label: "Agustus"   },
  { value: "09", label: "September" },
  { value: "10", label: "Oktober"   },
  { value: "11", label: "November"  },
  { value: "12", label: "Desember"  },
];

const TAHUN = ["2026", "2027", "2028", "2029", "2030", "2031"];

const FILTER_KEY = "inv_mgmt_filter";

const loadFilter = () => {
  try {
    const saved = sessionStorage.getItem(FILTER_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
};

const saveFilter = (state) => {
  try { sessionStorage.setItem(FILTER_KEY, JSON.stringify(state)); } catch {}
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDisplayDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const day   = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year  = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDateDisplay = formatDisplayDate;

const formatDateBroadcast = (dateString) => {
  if (!dateString) return "-";
  const d  = new Date(dateString);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
};

const formatDueDateBroadcast = (dateString) => {
  if (!dateString) return "-";
  const d  = new Date(new Date(dateString).getTime() + 7 * 24 * 60 * 60 * 1000);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
};

const getDownloadLink = (item) => {
  const base = window.location.origin;
  return `${base}/invoice/download/${item.id}?type=${item.type || "normal"}&paper_size=${item.paper_size ?? "a4"}`;
};

const getBadgeLabel = (status) => {
  if (status === "paid")    return "Lunas";
  if (status === "unpaid")  return "Belum Lunas";
  if (status === "overdue") return "Jatuh Tempo";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const BankDropdown = ({ value, customBank, onBankChange, onCustomBankChange }) => {
  const [open, setOpen]   = useState(false);
  const dropdownRef       = useRef(null);
  const inputRef          = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (open && value === "Lainnya" && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open, value]);

  const handleSelect = (option) => {
    onBankChange(option);
    if (option !== "Lainnya") { onCustomBankChange(""); setOpen(false); }
  };

  const displayLabel = value === "Lainnya" && customBank ? `Lainnya: ${customBank}` : value;

  return (
    <div className="custom-dropdown bank-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className={`custom-dropdown-trigger ${open ? "open" : ""}`}
        onClick={() => setOpen((p) => !p)}
      >
        <Building2 size={13} className="trigger-icon" />
        <span className="trigger-label">{displayLabel}</span>
        <ChevronDown size={13} className={`dropdown-chevron ${open ? "rotated" : ""}`} />
      </button>

      {open && (
        <div className="custom-dropdown-menu bank-menu">
          {banks.map((option, i) => (
            <button
              key={i} type="button"
              className={`custom-dropdown-option ${value === option ? "selected" : ""}`}
              onClick={() => handleSelect(option)}
            >
              <span>{option}</span>
              {value === option && <Check size={13} className="option-check" />}
            </button>
          ))}
          {value === "Lainnya" && (
            <div className="other-bank-input-wrap">
              <div className="other-input-divider" />
              <div className="other-input-label"><Building2 size={12} /> Masukkan nama bank</div>
              <input
                ref={inputRef} type="text" className="other-bank-input"
                placeholder="cth. Maybank, HSBC..."
                value={customBank}
                onChange={(e) => onCustomBankChange(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => { if (e.key === "Enter") setOpen(false); }}
              />
              {customBank && (
                <button type="button" className="other-apply-btn" onClick={() => setOpen(false)}>
                  <Check size={12} /> Terapkan
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CustomDropdown = ({ options, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef     = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="custom-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className={`custom-dropdown-trigger ${open ? "open" : ""}`}
        onClick={() => setOpen((p) => !p)}
      >
        <span>{value}</span>
        <ChevronDown size={13} className={`dropdown-chevron ${open ? "rotated" : ""}`} />
      </button>
      {open && (
        <div className="custom-dropdown-menu">
          {options.map((option, i) => (
            <button
              key={i} type="button"
              className={`custom-dropdown-option ${value === option ? "selected" : ""}`}
              onClick={() => { onChange(option); setOpen(false); }}
            >
              <span>{option}</span>
              {value === option && <Check size={13} className="option-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const PaperSizeToggle = ({ value, onChange }) => {
  const options = [
    { key: "all", label: "Semua", icon: null },
    { key: "a5",  label: "A5",    icon: <Printer size={12} />, sub: "Cetak" },
    { key: "a4",  label: "A4",    icon: <Send size={12} />,    sub: "PDF"   },
  ];
};

const PaperBadge = ({ size }) => {
  const isA5 = (size ?? "a4") === "a5";
  return (
    <span className={`paper-badge ${isA5 ? "paper-badge-a5" : "paper-badge-a4"}`}>
      {isA5
        ? <><Printer size={10} /> A5 · Cetak</>
        : <><Send size={10} /> A4 · PDF</>
      }
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const InvoiceManagement = () => {
  const { invoices, setInvoices, refreshInvoices } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const saved = loadFilter();

  // ── State ──
  const [currentPage,       setCurrentPage]       = useState(saved?.page    ?? 1);
  const [customBank,        setCustomBank]        = useState("");
  const [selectedBank,      setSelectedBank]      = useState(saved?.bank    ??"Semua Bank");
  const [selectedStatus,    setSelectedStatus]    = useState(saved?.status  ??"Semua Status");
  const [selectedPaperSize, setSelectedPaperSize] = useState(saved?.paperSize ??"all");
  const [selectedDate,      setSelectedDate]      = useState(saved?.date     ??"");
  const [startDate,         setStartDate]         = useState(saved?.startDate ??"");
  const [endDate,           setEndDate]           = useState(saved?.endDate   ??"");
  const [selectedMonth,     setSelectedMonth]     = useState(saved?.month    ??"");
  const [selectedYear,      setSelectedYear]      = useState(saved?.year     ??"");
  const [searchTerm,        setSearchTerm]        = useState(saved?.search   ??"");
  const [activeDropdown,    setActiveDropdown]    = useState(null);
  const [shareDropdown,     setShareDropdown]     = useState(null);
  const [monthOpen,         setMonthOpen]         = useState(false);
  const [yearOpen,          setYearOpen]          = useState(false);
  const [invoiceToDelete,   setInvoiceToDelete]   = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  // Tambah state (sudah ada toastMessage, tambah satu lagi khusus save)
const [saveToast, setSaveToast] = useState(null);

const [invoiceSort, setInvoiceSort] = useState(saved?.sort    ?? "default");
const [sortPopupOpen, setSortPopupOpen] = useState(false);
const sortBtnRef = useRef(null);

  const itemsPerPage  = 20;
  const paginationRef = useRef(null);
  const dateInputRef  = useRef(null);
  const yearRef       = useRef(null);

  const handleFilterChange = (setter) => (value) => {
  setter(value);
  setCurrentPage(1);
};
  // ── Effects ──
  useEffect(() => { refreshInvoices(); }, []);

  useEffect(() => {
    const h = (e) => {
      if (yearRef.current && !yearRef.current.contains(e.target)) setYearOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (!e.target.closest(".action-cell") && !e.target.closest(".inv-card-action-btn")) {
        setActiveDropdown(null);
        setShareDropdown(null);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
  saveFilter({
    bank:      selectedBank,
    status:    selectedStatus,
    paperSize: selectedPaperSize,
    date:      selectedDate,
    startDate: startDate,
    endDate:   endDate,
    month:     selectedMonth,
    year:      selectedYear,
    search:    searchTerm,
    page:      currentPage,
    sort:      invoiceSort,
  });
}, [selectedBank, selectedStatus, selectedPaperSize, selectedDate, startDate, endDate, selectedMonth, selectedYear, searchTerm, currentPage, invoiceSort]);

  useEffect(() => {
  if (location.state?.savedInvoice) {
    setSaveToast(location.state.savedInvoice);
    setTimeout(() => setSaveToast(null), 3000);
    // bersihkan state agar tidak muncul lagi saat refresh
    window.history.replaceState({}, "");
  }
}, [location.state]);

  // ── Derived ──
  const countA5 = invoices.filter((inv) => (inv.paper_size ?? "a4") === "a5").length;
  const countA4 = invoices.filter((inv) => (inv.paper_size ?? "a4") === "a4").length;

  const filteredInvoices = invoices.filter((inv) => {
    if (selectedPaperSize !== "all") {
      if ((inv.paper_size ?? "a4") !== selectedPaperSize) return false;
    }
    if (selectedBank !== "Semua Bank") {
      if (selectedBank === "Lainnya") {
        if (customBank && !inv.bank.toLowerCase().includes(customBank.toLowerCase())) return false;
      } else {
        if (inv.bank !== selectedBank) return false;
      }
    }
    if (selectedStatus !== "Semua Status") {
      const statusMap = { Lunas: "paid", "Belum Lunas": "unpaid" };
      if (inv.status.toLowerCase() !== (statusMap[selectedStatus] || selectedStatus.toLowerCase())) return false;
    }
    // Filter Tanggal Custom Range / Single Date
    if (startDate && endDate) {
      const invDate = inv.date || "";
      if (!invDate || invDate < startDate || invDate > endDate) return false;
    } else if (startDate) {
      const invDate = inv.date || "";
      if (!invDate || invDate < startDate) return false;
    } else if (endDate) {
      const invDate = inv.date || "";
      if (!invDate || invDate > endDate) return false;
    } else if (selectedDate) {
      if ((inv.date || "") !== selectedDate) return false;
    } else if (selectedMonth && selectedYear) {
      if (!(inv.date || "").startsWith(`${selectedYear}-${selectedMonth}`)) return false;
    } else if (selectedMonth) {
      if ((inv.date || "").slice(5, 7) !== selectedMonth) return false;
    } else if (selectedYear) {
      if ((inv.date || "").slice(0, 4) !== selectedYear) return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchCustomer  = (inv.customer || "").toLowerCase().includes(term);
      const matchInvoiceNo = (inv.invoiceNumber || "").toLowerCase().includes(term);
      const matchKepada    = (inv.kepada || "").toLowerCase().includes(term);
      const matchBranch    = (inv.branch || "").toLowerCase().includes(term);
      const matchDesc      = Array.isArray(inv.items) && inv.items.some(item => (item.desc || "").toLowerCase().includes(term));

      if (!matchCustomer && !matchInvoiceNo && !matchKepada && !matchBranch && !matchDesc) return false;
    }
    return true;
  });

const getInvNum = (inv) => parseInt((inv.invoiceNumber || "").split("/")[0]) || 0;

const sortedInvoices = [...filteredInvoices].sort((a, b) => {
  if (invoiceSort === "asc")  return getInvNum(a) - getInvNum(b);
  if (invoiceSort === "desc") return getInvNum(b) - getInvNum(a);
  return 0; // default = urutan dari API (by id desc)
});

// Ganti filteredInvoices → sortedInvoices di pagination
const totalPages       = Math.ceil(sortedInvoices.length / itemsPerPage);
const indexOfLastItem  = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;
const currentInvoices  = sortedInvoices.slice(indexOfFirstItem, indexOfLastItem);

  // Tambah di atas, sejajar constants lain
const API_URL = import.meta.env.VITE_API_URL || "";

  // ── Handlers ──
  const toggleDropdown = (index) => {
    setShareDropdown(null);
    setActiveDropdown((prev) => (prev === index ? null : index));
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    setTimeout(() => {
      paginationRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  const handleDelete = async () => {
    try {
      const inv = invoices.find((i) => i.id === invoiceToDelete);
      // handleDelete — ganti fetch URL
const response = await fetch(
  `${API_URL}/api/invoices/${invoiceToDelete}`,
  { method: "DELETE", headers: { Accept: "application/json" } }
);
      if (!response.ok) {
        console.error("DELETE ERROR:", await response.text());
        alert("Gagal menghapus invoice");
        return;
      }
      setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceToDelete));
      setInvoiceToDelete(null);
setToastMessage(inv.invoiceNumber); // simpan nomor invoice yg dihapus
setTimeout(() => setToastMessage(null), 3000);
      setActiveDropdown(null);
    } catch (error) {
      console.error("Delete error:", error);
      alert("Terjadi kesalahan saat menghapus");
    }
  };

  const handleShareWhatsApp = (item) => {
    const totalItem    = (item.items || []).reduce((acc, i) => acc + Number(i.qty || 0) * Number(i.price || 0), 0);
    const bankData     = getBankInfo(item.bank);
    const linkDownload = getDownloadLink(item);
    const tanggal      = formatDateBroadcast(item.date);
    const dueDate      = formatDueDateBroadcast(item.date);

    const msg = encodeURIComponent(
      `Dear...Bapak/Ibu ${item.customer},\n\n` +
      `Terima kasih telah memilih *Flower Plus* untuk menjadi bagian dari momen dan pesan yang disampaikan.\n` +
      `Kami merasa terhormat dapat menjadi bagian dari pesan tersebut\u2014*mengantarkan perhatian Bapak/Ibu, bahkan hingga ke berbagai pelosok Indonesia.*\n` +
      `Berikut adalah rincian pembayaran anda \u{1F60A}\u{1F64F}\n\n` +
      `*Detail Invoice:*\n` +
      `No. Invoice   : ${item.invoiceNumber}\n` +
      `Tanggal       : ${tanggal}\n` +
      `Total Tagihan : Rp ${totalItem.toLocaleString("id-ID")}\n` +
      `Jatuh Tempo   : ${dueDate}\n\n` +
      `*Tautan Unduh Invoice:*\n` +
      `${linkDownload}\n\n` +
      `*Informasi Pembayaran:*\n` +
      (bankData.isCash
        ? `- Metode  : PEMBAYARAN TUNAI\n\n`
        : bankData.norek2
          ? `- Bank 1  : ${bankData.label}\n` +
            `- No. Rek : ${bankData.norek}\n` +
            `- Bank 2  : ${bankData.label2}\n` +
            `- No. Rek : ${bankData.norek2}\n\n`
          : `- Bank    : ${bankData.label}\n` +
            `- No. Rek : ${bankData.norek}\n\n`) +
      `Terima kasih telah memilih dan mempercayakan *FlowerPlus*.\n` +
      `*Karena bagi kami, bunga bukan hanya tentang apa yang terlihat, tetapi tentang apa yang ingin disampaikan.*\n\n` +
      `Salam hangat,\n` +
      `*Tim Keuangan Flower Plus*\n`
    );
    window.open(`https://api.whatsapp.com/send?text=${msg}`, "_blank");
  };

  const handleShareEmail = (item) => {
    const totalItem    = (item.items || []).reduce((acc, i) => acc + Number(i.qty || 0) * Number(i.price || 0), 0);
    const bankData     = getBankInfo(item.bank);
    const linkDownload = getDownloadLink(item);
    const tanggal      = formatDateBroadcast(item.date);
    const dueDate      = formatDueDateBroadcast(item.date);

    const subject = encodeURIComponent(`Invoice ${item.invoiceNumber} - Flower Plus`);
    const body    = encodeURIComponent(
      `Dear...Bapak/Ibu ${item.customer},\n\n` +
      `Terima kasih telah memilih Flower Plus untuk menjadi bagian dari momen dan pesan yang ingin Bapak/Ibu sampaikan.\n` +
      `Kami merasa terhormat dapat menjadi bagian dari pesan tersebut\u2014mengantarkan perhatian Bapak/Ibu, bahkan hingga ke berbagai pelosok Indonesia.\n` +
      `Berikut adalah rincian pembayaran anda \u{1F60A}\u{1F64F}\n\n` +
      `Detail Invoice:\n` +
      `- No. Invoice   : ${item.invoiceNumber}\n` +
      `- Tanggal       : ${tanggal}\n` +
      `- Total Tagihan : Rp ${totalItem.toLocaleString("id-ID")}\n` +
      `- Jatuh Tempo   : ${dueDate}\n\n` +
      `Silakan unduh invoice Anda melalui tautan berikut:\n` +
      `${linkDownload}\n\n` +
      `Informasi Pembayaran:\n` +
      (bankData.isCash
        ? `Metode  : PEMBAYARAN TUNAI\n\n`
        : bankData.norek2
          ? `Bank 1  : ${bankData.label}\n` +
            `No. Rek : ${bankData.norek}\n` +
            `Bank 2  : ${bankData.label2}\n` +
            `No. Rek : ${bankData.norek2}\n\n`
          : `Bank    : ${bankData.label}\n` +
            `No. Rek : ${bankData.norek}\n\n`) +
      `Terima kasih telah memilih dan mempercayakan FlowerPlus.\n` +
      `Karena bagi kami, bunga bukan hanya tentang apa yang terlihat, tetapi tentang apa yang ingin disampaikan.\n\n` +
      `Salam hangat,\n` +
      `Tim Keuangan Flower Plus\n`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
  };

  // ── Render helpers ──
  const renderActionMenu = (item, index) => (
    <div className="action-dropdown">
      <button
        className="dropdown-item"
        onClick={() => navigate(`/invoice/preview/${item.id}?type=${item.type || "normal"}&paper_size=${item.paper_size ?? "a4"}`)}
      >
        <Eye size={14} /> Lihat Detail
      </button>
      <button
        className="dropdown-item"
        onClick={() => navigate(`/invoice/edit/${item.id}?type=${item.type || "normal"}`)}
      >
        <Pencil size={14} /> Ubah
      </button>

      <div className="share-sub-wrap">
        <button
          className="dropdown-item"
          onClick={(e) => { e.stopPropagation(); setShareDropdown((prev) => (prev === index ? null : index)); }}
        >
          <Share2 size={14} /> Bagikan
          <ChevronDown
            size={12}
            style={{
              marginLeft: "auto",
              transform: shareDropdown === index ? "rotate(180deg)" : "none",
              transition: "transform 0.2s",
            }}
          />
        </button>
        {shareDropdown === index && (
          <div className="share-sub-menu">
            <button
              className="share-sub-item share-sub-wa"
              onClick={() => { handleShareWhatsApp(item); setActiveDropdown(null); setShareDropdown(null); }}
            >
              <FaWhatsapp size={13} /> WhatsApp
            </button>
            <button
              className="share-sub-item share-sub-email"
              onClick={() => { handleShareEmail(item); setActiveDropdown(null); setShareDropdown(null); }}
            >
              <Mail size={13} /> Email
            </button>
          </div>
        )}
      </div>

      <div className="dropdown-divider" />
      <button
        className="dropdown-item delete"
        onClick={() => { setInvoiceToDelete(item.id); setActiveDropdown(null); }}
      >
        <Trash2 size={14} /> Hapus
      </button>
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="invoice-page">

      {/* HEADER */}
      <div className="invoice-header">
        <div className="header-text">
          <h1>Manajemen Invoice</h1>
          <p>Kelola semua invoice bisnis Anda</p>
        </div>
        <button className="create-btn-invoice" onClick={() => navigate("/invoice/create?type=normal")}>
          <Plus size={15} /> Buat Invoice
        </button>
      </div>
      {/* SUMMARY BAR */}
      <div className="inv-summary-bar">
        <button
          className={`inv-summary-item ${selectedPaperSize === "all" ? "isb-active-all" : ""}`}
          onClick={() => handleFilterChange(setSelectedPaperSize)("all")}
        >
          <span className="isb-dot isb-dot-all" />
          <span className="isb-label">Semua</span>
          <span className="isb-count">{invoices.length}</span>
        </button>

        <div className="inv-summary-divider" />

        <button
          className={`inv-summary-item isb-a5 ${selectedPaperSize === "a5" ? "isb-active-a5" : ""}`}
          onClick={() => handleFilterChange(setSelectedPaperSize)("a5")}
        >
          <Printer size={13} />
          <span className="isb-label">A5 · Cetak</span>
          <span className="isb-count isb-count-a5">{countA5}</span>
        </button>

        <div className="inv-summary-divider" />

        <button
          className={`inv-summary-item isb-a4 ${selectedPaperSize === "a4" ? "isb-active-a4" : ""}`}
          onClick={() => handleFilterChange(setSelectedPaperSize)("a4")}
        >
          <Send size={13} />
          <span className="isb-label">A4 · PDF</span>
          <span className="isb-count isb-count-a4">{countA4}</span>
        </button>
      </div>

      {/* FILTER */}
      <div className="filter-card">
        <div className="filter-left">
          <Filter size={14} /><span>Filter</span>
        </div>
        <div className="filter-divider-v" />
        <div className="filter-controls">

          <PaperSizeToggle value={selectedPaperSize} onChange={setSelectedPaperSize} />

          <div className="filter-divider-v" style={{ height: "20px" }} />

          {/* TANGGAL FILTER (SINGLE & CUSTOM RANGE) */}
          <DateRangeFilter
            singleDate={selectedDate}
            startDate={startDate}
            endDate={endDate}
            onApply={({ mode, singleDate: sDate, startDate: sStart, endDate: sEnd }) => {
              if (mode === "single") {
                setSelectedDate(sDate);
                setStartDate("");
                setEndDate("");
              } else {
                setSelectedDate("");
                setStartDate(sStart);
                setEndDate(sEnd);
              }
              setCurrentPage(1);
            }}
            onReset={() => {
              setSelectedDate("");
              setStartDate("");
              setEndDate("");
              setCurrentPage(1);
            }}
            theme="blue"
          />

          {/* TAHUN */}
          <div className="custom-dropdown" ref={yearRef}>
            <button
              type="button"
              className={`custom-dropdown-trigger ${yearOpen ? "open" : ""} ${selectedYear ? "active-filter" : ""}`}
              onClick={() => { setYearOpen((p) => !p); setMonthOpen(false); }}
            >
              <span>{selectedYear || "Semua Tahun"}</span>
              <ChevronDown size={13} className={`dropdown-chevron ${yearOpen ? "rotated" : ""}`} />
            </button>
            {yearOpen && (
              <div className="custom-dropdown-menu">
                <button
                  type="button"
                  className={`custom-dropdown-option ${!selectedYear ? "selected" : ""}`}
                  onClick={() => { setSelectedYear(""); setYearOpen(false); }}
                >
                  <span>Semua Tahun</span>
                  {!selectedYear && <Check size={13} className="option-check" />}
                </button>
                {TAHUN.map((y) => (
                  <button
                    key={y} type="button"
                    className={`custom-dropdown-option ${selectedYear === y ? "selected" : ""}`}
                    onClick={() => { handleFilterChange(setSelectedYear)(y); setYearOpen(false); }}
                  >
                    <span>{y}</span>
                    {selectedYear === y && <Check size={13} className="option-check" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SEARCH */}
          <div className="search-wrap">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Cari pelanggan / no. invoice / cabang / deskripsi..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => handleFilterChange(setSearchTerm)(e.target.value)}
            />
          </div>

          <BankDropdown
            value={selectedBank}
            customBank={customBank}
            onBankChange={handleFilterChange(setSelectedBank)}
            onCustomBankChange={setCustomBank}
          />
          <CustomDropdown options={statuses} value={selectedStatus} onChange={handleFilterChange(setSelectedStatus)} />

        </div>
      </div>

      {/* TABLE (tablet & desktop) */}
      <div className="invoice-table-card">
        <div className="invoice-table-scroll">
          <table>
            <thead>
              <tr>
                <th style={{ width: "48px", textAlign: "center" }}>No</th>
                <th>
                  <div className="inv-sort-th" ref={sortBtnRef}>
                    Invoice
                  <button
                  type="button"
                  className={`inv-sort-btn ${invoiceSort !== "default" ? "inv-sort-btn--active" : ""}`}
                  onClick={() => setSortPopupOpen((p) => !p)}
                >
                  <span className="inv-sort-icon">
                    <span className={`inv-sort-bar ${invoiceSort === "asc" ? "inv-sort-bar--on" : ""}`} />
                    <span className={`inv-sort-bar ${invoiceSort === "desc" ? "inv-sort-bar--on" : ""}`} />
                  </span>
                  <span className="inv-sort-label">
                    {invoiceSort === "asc" ? "A→Z" : invoiceSort === "desc" ? "Z→A" : "Urut"}
                  </span>
                </button>

                    {sortPopupOpen && (
                      <div className="inv-sort-popup">
                        {[
                          { key: "desc",    label: "Terbesar ke terkecil", icon: "↓" },
                          { key: "asc",     label: "Terkecil ke terbesar", icon: "↑" },
                          { key: "default", label: "Default (terbaru)",    icon: "≡" },
                        ].map(({ key, label, icon }) => (
                          <button
                            key={key}
                            type="button"
                            className={`inv-sort-opt ${invoiceSort === key ? "inv-sort-opt--sel" : ""}`}
                            onClick={() => { setInvoiceSort(key); setSortPopupOpen(false); }}
                          >
                            <span className="inv-sort-opt-icon">{icon}</span>
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </th>
                <th>Tipe</th>
                <th>Pelanggan</th>
                <th className="col-bank">Bank</th>
                <th>Jumlah</th>
                <th>Tanggal</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {currentInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-row">
                    <div className="empty-state">
                      <span className="empty-icon">📄</span>
                      <span>Tidak ada invoice ditemukan</span>
                    </div>
                  </td>
                </tr>
              ) : (
                currentInvoices.map((item, index) => (
                  <tr key={index}>
                    <td style={{ textAlign: "center", fontWeight: 700, color: "#94a3b8", fontSize: "12px" }}>
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="invoice-id">{item.invoiceNumber}</td>
                    <td><PaperBadge size={item.paper_size} /></td>
                    <td>
                      <strong title={item.customer}>{item.customer}</strong>
                      <span>{item.email}</span>
                    </td>
                    <td className="bank-cell col-bank">{item.bank}</td>
                    <td className="amount-cell">
                      <div className="inv-amount-wrap">
                        <span className="inv-amount-main">Rp {Number(item.amount).toLocaleString("id-ID")}</span>
                        {Number(item.shippingCost || item.shipping_cost || 0) > 0 && (
                          <span
                            className="inv-ongkir-badge"
                            title={`Ongkos Kirim: Rp ${Number(item.shippingCost || item.shipping_cost).toLocaleString("id-ID")}`}
                          >
                            <Truck size={11} />
                            <span>Ongkir Rp {Number(item.shippingCost || item.shipping_cost).toLocaleString("id-ID")}</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="date-cell">
                      <span>{formatDisplayDate(item.date)}</span>
                      <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginTop: "2px" }}>
                        Jatuh tempo: {formatDisplayDate(
                          new Date(new Date(item.date).getTime() + 7 * 24 * 60 * 60 * 1000)
                        )}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${item.status}`}>
                        {getBadgeLabel(item.status)}
                      </span>
                    </td>
                    <td className="action-cell">
                      <button className="action-btn" onClick={() => toggleDropdown(index)}>
                        <MoreVertical size={16} />
                      </button>
                      {activeDropdown === index && renderActionMenu(item, index)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CARD LIST (mobile < 480px) */}
      <div className="invoice-card-list">
        {currentInvoices.length === 0 ? (
          <div className="empty-state" style={{ padding: "40px 0" }}>
            <span className="empty-icon">📄</span>
            <span>Tidak ada invoice ditemukan</span>
          </div>
        ) : (
          currentInvoices.map((item, index) => (
            <div key={index} className="inv-card">
              <div className="inv-card-top">
                <div className="inv-card-left">
                  <div className="inv-card-number">{item.invoiceNumber}</div>
                  <div className="inv-card-customer">{item.customer}</div>
                  <div className="inv-card-branch">{item.email || item.branch || "—"}</div>
                </div>
                <div className="inv-card-right">
                  <span className="inv-card-amount">
                    Rp {Number(item.amount).toLocaleString("id-ID")}
                  </span>
                  {Number(item.shippingCost || item.shipping_cost || 0) > 0 && (
                    <span
                      className="inv-ongkir-badge"
                      title={`Ongkos Kirim: Rp ${Number(item.shippingCost || item.shipping_cost).toLocaleString("id-ID")}`}
                    >
                      <Truck size={11} />
                      <span>Ongkir Rp {Number(item.shippingCost || item.shipping_cost).toLocaleString("id-ID")}</span>
                    </span>
                  )}
                  <span className={`badge ${item.status}`}>
                    {getBadgeLabel(item.status)}
                  </span>
                </div>
              </div>
              <div className="inv-card-bottom">
                <div className="inv-card-meta">
                  <PaperBadge size={item.paper_size} />
                  {item.bank && <span className="inv-card-bank">{item.bank}</span>}
                  <span className="inv-card-date">{formatDisplayDate(item.date)}</span>
                </div>
                <div className="inv-card-actions">
                  <button
                    className="inv-card-action-btn" title="Lihat Detail"
                    onClick={() => navigate(`/invoice/preview/${item.id}?type=${item.type || "normal"}&paper_size=${item.paper_size ?? "a4"}`)}
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    className="inv-card-action-btn" title="Ubah"
                    onClick={() => navigate(`/invoice/edit/${item.id}?type=${item.type || "normal"}`)}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="inv-card-action-btn" title="Bagikan WA"
                    onClick={() => handleShareWhatsApp(item)}
                  >
                    <FaWhatsapp size={14} />
                  </button>
                  <button
                    className="inv-card-action-btn danger" title="Hapus"
                    onClick={() => setInvoiceToDelete(item.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="pagination-management" ref={paginationRef}>
          <button className="page-arrow" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => {
            const page = i + 1;
            if (page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1) {
              return (
                <button key={page} className={currentPage === page ? "active" : ""} onClick={() => handlePageChange(page)}>
                  {page}
                </button>
              );
            }
            if (Math.abs(page - currentPage) === 2) return <span key={page} className="page-ellipsis">…</span>;
            return null;
          })}
          <button className="page-arrow" disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>›</button>
        </div>
      )}

      {/* DELETE MODAL */}
      {invoiceToDelete && (
        <div className="del-overlay" onClick={() => setInvoiceToDelete(null)}>
          <div className="del-modal" onClick={(e) => e.stopPropagation()}>
            <div className="del-icon-wrap">
              <div className="del-icon-ring" />
              <svg className="del-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
            </div>
            <div className="del-copy">
              <h3 className="del-title">Hapus Invoice</h3>
              <p className="del-subtitle">
                Anda akan menghapus invoice&nbsp;
                <span className="del-id">{invoiceToDelete}</span>.
                <br />Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="del-divider" />
            <div className="del-actions">
              <button className="del-btn-cancel" onClick={() => setInvoiceToDelete(null)}>Batal</button>
              <button className="del-btn-confirm" onClick={handleDelete}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                </svg>
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
      {toastMessage && (
  <div className="del-toast">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
    Invoice <strong>{toastMessage}</strong> berhasil dihapus
  </div>
)}

{saveToast && (
  <div className="del-toast save-toast">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
    Invoice <strong>{saveToast}</strong> berhasil disimpan
  </div>
)}

    </div>
  );
};

export default InvoiceManagement;