import { useState, useRef, useEffect } from "react";
import { Search, Users, Calendar, Filter, ChevronDown, Check, FileSpreadsheet, X } from "lucide-react";
import * as XLSX from "xlsx";
import { useApp } from "../../../context/AppContext";
import DateRangeFilter from "../common/DateRangeFilter";
import "../../Style/Customer/CustomerData.css";

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

const formatDateDisplay = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
};

const getItemDescriptions = (items) => {
  if (!Array.isArray(items) || items.length === 0) return "-";
  return items.map((item) => item.desc).filter(Boolean).join(" | ");
};

const CustomerData = () => {
  const { invoices, refreshInvoices } = useApp();

  const [searchTerm, setSearchTerm]     = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [startDate, setStartDate]       = useState("");
  const [endDate, setEndDate]           = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [currentPage, setCurrentPage]   = useState(1);

  const [yearOpen, setYearOpen]   = useState(false);

  const itemsPerPage = 15;
  const yearRef      = useRef(null);

  useEffect(() => {
    refreshInvoices();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (yearRef.current && !yearRef.current.contains(e.target)) setYearOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setCurrentPage(1);
  };

  // Filtering data invoice untuk pelanggan
  const filteredData = invoices.filter((inv) => {
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
    } else if (selectedYear) {
      if ((inv.date || "").slice(0, 4) !== selectedYear) return false;
    }

    // Filter Search (Nama pelanggan, kepada, no invoice, cabang, deskripsi)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchCustomer  = (inv.customer || "").toLowerCase().includes(term);
      const matchKepada    = (inv.kepada || "").toLowerCase().includes(term);
      const matchInvoiceNo = (inv.invoiceNumber || "").toLowerCase().includes(term);
      const matchBranch    = (inv.branch || "").toLowerCase().includes(term);
      const matchDesc      = Array.isArray(inv.items) && inv.items.some(i => (i.desc || "").toLowerCase().includes(term));

      if (!matchCustomer && !matchKepada && !matchInvoiceNo && !matchBranch && !matchDesc) {
        return false;
      }
    }

    return true;
  });

  // Pagination
  const totalPages       = Math.ceil(filteredData.length / itemsPerPage);
  const indexOfLastItem  = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData      = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  // Export Excel
  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      alert("Tidak ada data untuk dieksport!");
      return;
    }

    const excelData = filteredData.map((inv, index) => ({
      "No": index + 1,
      "Tanggal Invoice": inv.date ? formatDateDisplay(inv.date) : "-",
      "Nama (Kepada Yth)": inv.kepada || inv.customer || "-",
      "Deskripsi Invoice": getItemDescriptions(inv.items),
      "No. Invoice": inv.invoiceNumber || "-",
      "Cabang": inv.branch || "-",
      "Bank Transfer": inv.bank || "-",
      "Total Tagihan (Rp)": Number(inv.amount || 0),
      "Status": inv.status === "paid" ? "Lunas" : "Belum Lunas",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Set width kolom otomatis
    const columnWidths = [
      { wch: 6 },  // No
      { wch: 16 }, // Tanggal
      { wch: 25 }, // Nama
      { wch: 45 }, // Deskripsi
      { wch: 20 }, // No Invoice
      { wch: 18 }, // Cabang
      { wch: 15 }, // Bank
      { wch: 18 }, // Total Tagihan
      { wch: 14 }, // Status
    ];
    worksheet["!cols"] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Pelanggan");

    // Tanggal hari ini untuk nama file
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Data_Pelanggan_FlowerPlus_${dateStr}.xlsx`);
  };

  return (
    <div className="customer-page">

      {/* HEADER */}
      <div className="customer-header">
        <div className="header-text">
          <h1>Data Pelanggan</h1>
          <p>Daftar riwayat pelanggan dan deskripsi invoice yang telah dibuat</p>
        </div>
        <button className="export-excel-btn" onClick={handleExportExcel}>
          <FileSpreadsheet size={16} /> Export Excel
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="filter-card">
        <div className="filter-left">
          <Filter size={14} /><span>Filter</span>
        </div>
        <div className="filter-divider-v" />
        <div className="filter-controls">

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
                onClick={() => setYearOpen((p) => !p)}
              >
              <span>{selectedYear || "Semua Tahun"}</span>
              <ChevronDown size={13} className={`dropdown-chevron ${yearOpen ? "rotated" : ""}`} />
            </button>
            {yearOpen && (
              <div className="custom-dropdown-menu">
                <button
                  type="button"
                  className={`custom-dropdown-option ${!selectedYear ? "selected" : ""}`}
                  onClick={() => { setSelectedYear(""); setYearOpen(false); setCurrentPage(1); }}
                >
                  <span>Semua Tahun</span>
                  {!selectedYear && <Check size={13} className="option-check" />}
                </button>
                {TAHUN.map((y) => (
                  <button
                    key={y}
                    type="button"
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
              placeholder="Cari pelanggan / deskripsi / no. invoice..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => handleFilterChange(setSearchTerm)(e.target.value)}
            />
          </div>

        </div>
      </div>

      {/* TABLE DATA PELANGGAN */}
      <div className="customer-table-card">
        <div className="customer-table-scroll">
          <table>
            <thead>
              <tr>
                <th style={{ width: "48px", textAlign: "center" }}>No</th>
                <th style={{ width: "115px" }}>Tanggal</th>
                <th style={{ width: "220px", minWidth: "180px" }}>Kepada Yth</th>
                <th style={{ minWidth: "250px" }}>Deskripsi Invoice</th>
                <th style={{ width: "155px" }}>No. Invoice</th>
                <th style={{ width: "140px" }}>Cabang</th>
                <th style={{ width: "130px", textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-row">
                    <div className="empty-state">
                      <span className="empty-icon">👥</span>
                      <span>Tidak ada data pelanggan ditemukan</span>
                    </div>
                  </td>
                </tr>
              ) : (
                currentData.map((item, index) => (
                  <tr key={item.id || index}>
                    <td style={{ textAlign: "center", fontWeight: 700, color: "#94a3b8", fontSize: "12px" }}>
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="date-cell">
                      <span>{formatDateDisplay(item.date)}</span>
                    </td>
                    <td>
                      <strong className="customer-name" title={item.kepada || item.customer}>
                        {item.kepada || item.customer || "-"}
                      </strong>
                    </td>
                    <td className="desc-cell">
                      {Array.isArray(item.items) && item.items.length > 0 ? (
                        (() => {
                          const items = item.items;
                          const firstDesc = items[0]?.desc || "-";
                          const extraCount = items.length - 1;
                          const tooltipText = items
                            .map((it, idx) => `${idx + 1}. ${it.desc || "-"}${it.qty ? ` (${it.qty} pcs)` : ""}${it.price ? ` - Rp ${Number(it.price).toLocaleString("id-ID")}` : ""}`)
                            .join("\n");

                          return (
                            <div className="desc-truncate-wrap" title={tooltipText}>
                              <span className="desc-bullet">•</span>
                              <span className="desc-truncate-text">{firstDesc}</span>
                              {extraCount > 0 && (
                                <span className="desc-more-badge">+{extraCount}</span>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="invoice-id">{item.invoiceNumber || "-"}</td>
                    <td className="branch-cell" title={item.branch || ""}>{item.branch || "-"}</td>
                    <td className="amount-cell" style={{ textAlign: "right" }}>
                      Rp {Number(item.amount || 0).toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* SMART PAGINATION */}
        {totalPages > 1 && (
          <div className="customer-pagination">
            <span className="pagination-info">
              Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredData.length)} dari {filteredData.length.toLocaleString("id-ID")} data
            </span>
            <div className="pagination-buttons">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              >
                ‹ Sebelumnya
              </button>
              {(() => {
                const getPages = () => {
                  if (totalPages <= 7) {
                    return Array.from({ length: totalPages }, (_, i) => i + 1);
                  }
                  if (currentPage <= 3) {
                    return [1, 2, 3, 4, "…", totalPages];
                  }
                  if (currentPage >= totalPages - 2) {
                    return [1, "…", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
                  }
                  return [1, "…", currentPage - 1, currentPage, currentPage + 1, "…", totalPages];
                };

                return getPages().map((page, idx) => {
                  if (page === "…") {
                    return <span key={`dots-${idx}`} className="page-ellipsis">…</span>;
                  }
                  return (
                    <button
                      key={page}
                      className={currentPage === page ? "active" : ""}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  );
                });
              })()}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              >
                Selanjutnya ›
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default CustomerData;
