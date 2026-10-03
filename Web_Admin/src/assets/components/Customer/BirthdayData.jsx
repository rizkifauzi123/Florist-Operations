import { useState, useRef, useEffect } from "react";
import { Search, Calendar, Filter, ChevronDown, Check, FileSpreadsheet, X, Cake } from "lucide-react";
import * as XLSX from "xlsx";
import { useApp } from "../../../context/AppContext";
import DateRangeFilter from "../common/DateRangeFilter";
import "../../Style/Customer/BirthdayData.css";

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

const BirthdayData = () => {
  const { invoices, refreshInvoices } = useApp();

  const [searchTerm, setSearchTerm]     = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [startDate, setStartDate]       = useState("");
  const [endDate, setEndDate]           = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [currentPage, setCurrentPage]   = useState(1);

  const [yearOpen, setYearOpen]         = useState(false);

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

  // Hanya ambil invoice yang ditandai sebagai data ulang tahun
  const birthdayInvoices = invoices.filter(
    (inv) => inv.is_birthday === true || inv.is_birthday === 1 || inv.is_birthday === "1"
  );

  // Filtering data ulang tahun
  const filteredData = birthdayInvoices.filter((inv) => {
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

    // Filter Search (Kepada Yth, customer, deskripsi)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchCustomer = (inv.customer || "").toLowerCase().includes(term);
      const matchKepada   = (inv.kepada || "").toLowerCase().includes(term);
      const matchDesc     = Array.isArray(inv.items) && inv.items.some(i => (i.desc || "").toLowerCase().includes(term));

      if (!matchCustomer && !matchKepada && !matchDesc) {
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

  // Export Excel Khusus Data Ulang Tahun
  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      alert("Tidak ada data ulang tahun untuk dieksport!");
      return;
    }

    const excelData = filteredData.map((inv, index) => ({
      "No": index + 1,
      "Tanggal Pembuatan Inv": inv.date ? formatDateDisplay(inv.date) : "-",
      "Kepada Yth": inv.kepada || inv.customer || "-",
      "Deskripsi Invoice": getItemDescriptions(inv.items),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    const columnWidths = [
      { wch: 6 },  // No
      { wch: 22 }, // Tanggal Pembuatan Inv
      { wch: 30 }, // Kepada Yth
      { wch: 55 }, // Deskripsi Invoice
    ];
    worksheet["!cols"] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Ulang Tahun");

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Data_Ulang_Tahun_FlowerPlus_${dateStr}.xlsx`);
  };

  return (
    <div className="birthday-page">

      {/* HEADER */}
      <div className="birthday-header">
        <div className="header-text">
          <h1>
            <Cake size={24} color="#db2777" />
            Data Ulang Tahun
            <span className="birthday-badge-count">{birthdayInvoices.length} Total</span>
          </h1>
          <p>Daftar riwayat data ulang tahun yang dicatat dari pembuatan invoice</p>
        </div>

        <button className="export-excel-birthday-btn" onClick={handleExportExcel}>
          <FileSpreadsheet size={16} /> Export Excel
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="birthday-filter-card">
        <div className="birthday-filter-left">
          <Filter size={14} /><span>Filter</span>
        </div>
        <div className="birthday-filter-divider-v" />
        <div className="birthday-filter-controls">

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
            theme="pink"
          />

          {/* TAHUN */}
          <div className="birthday-dropdown" ref={yearRef}>
            <button
              type="button"
              className={`birthday-dropdown-trigger ${yearOpen ? "open" : ""} ${selectedYear ? "active-filter" : ""}`}
              onClick={() => setYearOpen((p) => !p)}
            >
              <span>{selectedYear || "Semua Tahun"}</span>
              <ChevronDown size={13} className={`birthday-dropdown-chevron ${yearOpen ? "rotated" : ""}`} />
            </button>
            {yearOpen && (
              <div className="birthday-dropdown-menu">
                <button
                  type="button"
                  className={`birthday-dropdown-option ${!selectedYear ? "selected" : ""}`}
                  onClick={() => { setSelectedYear(""); setYearOpen(false); setCurrentPage(1); }}
                >
                  <span>Semua Tahun</span>
                  {!selectedYear && <Check size={13} />}
                </button>
                {TAHUN.map((y) => (
                  <button
                    key={y}
                    type="button"
                    className={`birthday-dropdown-option ${selectedYear === y ? "selected" : ""}`}
                    onClick={() => { handleFilterChange(setSelectedYear)(y); setYearOpen(false); }}
                  >
                    <span>{y}</span>
                    {selectedYear === y && <Check size={13} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SEARCH */}
          <div className="birthday-search-wrap">
            <Search size={14} className="birthday-search-icon" />
            <input
              type="text"
              placeholder="Cari penerima (Kepada Yth) / deskripsi..."
              className="birthday-search-input"
              value={searchTerm}
              onChange={(e) => handleFilterChange(setSearchTerm)(e.target.value)}
            />
          </div>

        </div>
      </div>

      {/* TABLE DATA ULANG TAHUN */}
      <div className="birthday-table-card">
        <div className="birthday-table-scroll">
          <table>
            <thead>
              <tr>
                <th style={{ width: "48px", textAlign: "center" }}>No</th>
                <th style={{ width: "150px" }}>Tanggal Pembuatan Inv</th>
                <th style={{ width: "240px", minWidth: "180px" }}>Kepada Yth</th>
                <th style={{ minWidth: "280px" }}>Deskripsi Invoice</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-birthday-state">
                      <span className="empty-birthday-icon">🎂</span>
                      <span>Belum ada data ulang tahun ditemukan</span>
                      <small style={{ color: "#94a3b8" }}>
                        Centang opsi <em>"Masukkan ke Data Ulang Tahun"</em> saat membuat invoice untuk menampilkan data di sini.
                      </small>
                    </div>
                  </td>
                </tr>
              ) : (
                currentData.map((item, index) => (
                  <tr key={item.id || index}>
                    <td style={{ textAlign: "center", fontWeight: 700, color: "#94a3b8", fontSize: "12px" }}>
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td>
                      <div className="birthday-date-cell">
                        <span>{formatDateDisplay(item.date)}</span>
                      </div>
                    </td>
                    <td>
                      <strong className="birthday-customer-name" title={item.kepada || item.customer}>
                        {item.kepada || item.customer || "-"}
                      </strong>
                    </td>
                    <td className="birthday-desc-cell">
                      {Array.isArray(item.items) && item.items.length > 0 ? (
                        (() => {
                          const items = item.items;
                          const firstDesc = items[0]?.desc || "-";
                          const extraCount = items.length - 1;
                          const tooltipText = items
                            .map((it, idx) => `${idx + 1}. ${it.desc || "-"}${it.qty ? ` (${it.qty} pcs)` : ""}${it.price ? ` - Rp ${Number(it.price).toLocaleString("id-ID")}` : ""}`)
                            .join("\n");

                          return (
                            <div className="birthday-desc-truncate-wrap" title={tooltipText}>
                              <span className="birthday-desc-bullet">•</span>
                              <span className="birthday-desc-truncate-text">{firstDesc}</span>
                              {extraCount > 0 && (
                                <span className="birthday-desc-more-badge">+{extraCount}</span>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        <span style={{ color: "#94a3b8" }}>-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* SMART PAGINATION */}
        {totalPages > 1 && (
          <div className="birthday-pagination">
            <span className="birthday-pagination-info">
              Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredData.length)} dari {filteredData.length.toLocaleString("id-ID")} data
            </span>
            <div className="birthday-pagination-buttons">
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

export default BirthdayData;
